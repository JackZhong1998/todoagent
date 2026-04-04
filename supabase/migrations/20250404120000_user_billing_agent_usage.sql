-- Stripe 订阅状态 + Agent 每日调用次数（UTC 自然日）+ 单次用户回合去重（多轮 tool 只计 1 次）
-- 仅由服务端（Vercel + service role）通过 RPC 写入；用户 JWT 无 EXECUTE。

create table if not exists public.todoagent_user_billing (
  user_id text primary key,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,
  subscription_current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.todoagent_agent_daily_usage (
  user_id text not null,
  usage_date date not null,
  call_count int not null default 0,
  primary key (user_id, usage_date)
);

create table if not exists public.todoagent_agent_billed_dedupe (
  user_id text not null,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, dedupe_key)
);

create index if not exists todoagent_agent_billed_dedupe_created_at_idx
  on public.todoagent_agent_billed_dedupe (created_at);

-- 原子：付费用户直接通过；同一 dedupe 仅第一次消耗配额；免费用户每日最多 10 次「用户发起的 Agent 回合」
create or replace function public.agent_moonshot_precheck(p_user_id text, p_dedupe_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paid boolean := false;
  v_end timestamptz;
  v_status text;
  v_count int;
  v_date date := (timezone('utc', now()))::date;
begin
  if p_user_id is null or length(trim(p_user_id)) = 0 then
    return jsonb_build_object('ok', false, 'code', 'invalid_user');
  end if;
  if p_dedupe_key is null or length(trim(p_dedupe_key)) = 0 then
    return jsonb_build_object('ok', false, 'code', 'invalid_dedupe');
  end if;

  select subscription_status, subscription_current_period_end
  into v_status, v_end
  from todoagent_user_billing
  where user_id = p_user_id;

  if found then
    v_paid := (
      v_status in ('active', 'trialing')
      and (v_end is null or v_end > now())
    );
  end if;

  if v_paid then
    return jsonb_build_object('ok', true, 'paid', true);
  end if;

  if exists (
    select 1 from todoagent_agent_billed_dedupe
    where user_id = p_user_id and dedupe_key = p_dedupe_key
  ) then
    return jsonb_build_object('ok', true, 'paid', false);
  end if;

  insert into todoagent_agent_daily_usage (user_id, usage_date, call_count)
  values (p_user_id, v_date, 1)
  on conflict (user_id, usage_date)
  do update set call_count = todoagent_agent_daily_usage.call_count + 1
  returning call_count into v_count;

  if v_count > 10 then
    update todoagent_agent_daily_usage
    set call_count = call_count - 1
    where user_id = p_user_id and usage_date = v_date;
    return jsonb_build_object('ok', false, 'code', 'agent_quota_exceeded');
  end if;

  insert into todoagent_agent_billed_dedupe (user_id, dedupe_key)
  values (p_user_id, p_dedupe_key);

  return jsonb_build_object('ok', true, 'paid', false);
end;
$$;

revoke all on function public.agent_moonshot_precheck(text, text) from public;
grant execute on function public.agent_moonshot_precheck(text, text) to service_role;
