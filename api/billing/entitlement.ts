import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { PostgrestError } from '@supabase/supabase-js';
import { getClerkUserIdFromRequest } from '../_lib/auth';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin';
import { billingBackendConfigured, skipAgentBilling } from '../_lib/billingFlags';

const FREE_DAILY_LIMIT = 10;

function utcTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function jsonFromSupabaseError(err: PostgrestError, step: string) {
  const msg = err.message || String(err);
  const missingRelation =
    /does not exist|schema cache/i.test(msg) || err.code === '42P01' || err.code === 'PGRST205';
  return {
    error: 'read_failed' as const,
    step,
    code: err.code,
    supabaseMessage: err.message,
    supabaseDetails: err.details,
    supabaseHint: err.hint,
    hint: missingRelation
      ? '若表已存在：在 Supabase → Settings → API 确认已启用 Data API，且 schema public 已暴露；或重新执行 migration 文件 20250404120000_user_billing_agent_usage.sql'
      : '请核对 Vercel 的 SUPABASE_URL（项目 Settings → API → Project URL）与 SUPABASE_SERVICE_ROLE_KEY（Legacy service_role JWT，通常以 eyJ 开头）是否来自同一项目、无多余空格',
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const userId = await getClerkUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (skipAgentBilling() || !billingBackendConfigured()) {
    return res.status(200).json({
      billingEnabled: false,
      isPaid: true,
      freeDailyLimit: FREE_DAILY_LIMIT,
      usedToday: 0,
      remainingFreeToday: FREE_DAILY_LIMIT,
    });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(503).json({ error: 'billing_misconfigured' });
  }

  const today = utcTodayDateString();

  const billingRes = await supabase
    .from('todoagent_user_billing')
    .select('subscription_status, subscription_current_period_end')
    .eq('user_id', userId)
    .maybeSingle();

  if (billingRes.error) {
    console.error('[entitlement] todoagent_user_billing', billingRes.error);
    return res.status(500).json(jsonFromSupabaseError(billingRes.error, 'todoagent_user_billing'));
  }

  const usageRes = await supabase
    .from('todoagent_agent_daily_usage')
    .select('call_count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .maybeSingle();

  if (usageRes.error) {
    console.error('[entitlement] todoagent_agent_daily_usage', usageRes.error);
    return res.status(500).json(jsonFromSupabaseError(usageRes.error, 'todoagent_agent_daily_usage'));
  }

  const billingRow = billingRes.data;
  const usageRow = usageRes.data;

  const end = billingRow?.subscription_current_period_end
    ? new Date(billingRow.subscription_current_period_end as string)
    : null;
  const status = String(billingRow?.subscription_status || '');
  const isPaid =
    (status === 'active' || status === 'trialing') && (!end || end.getTime() > Date.now());

  const usedToday = Math.max(0, Number((usageRow as { call_count?: number } | null)?.call_count ?? 0));
  const remainingFreeToday = isPaid ? FREE_DAILY_LIMIT : Math.max(0, FREE_DAILY_LIMIT - usedToday);

  return res.status(200).json({
    billingEnabled: true,
    isPaid,
    freeDailyLimit: FREE_DAILY_LIMIT,
    usedToday,
    remainingFreeToday,
  });
}
