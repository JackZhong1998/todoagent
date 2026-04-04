import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getClerkUserIdFromRequest } from '../_lib/auth.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import { billingBackendConfigured, skipAgentBilling } from '../_lib/billingFlags.js';
import { sendJson } from '../_lib/safeJson.js';

const FREE_DAILY_LIMIT = 10;

function utcTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

type PgErr = { message?: string; code?: string; details?: string; hint?: string };

function jsonFromSupabaseError(err: PgErr, step: string) {
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
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return sendJson(res, 405, { error: 'method_not_allowed' });
    }

    const userId = await getClerkUserIdFromRequest(req);
    if (!userId) {
      return sendJson(res, 401, { error: 'unauthorized' });
    }

    if (skipAgentBilling() || !billingBackendConfigured()) {
      return sendJson(res, 200, {
        billingEnabled: false,
        isPaid: true,
        freeDailyLimit: FREE_DAILY_LIMIT,
        usedToday: 0,
        remainingFreeToday: FREE_DAILY_LIMIT,
      });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return sendJson(res, 503, { error: 'billing_misconfigured' });
    }

    const today = utcTodayDateString();

    const billingRes = await supabase
      .from('todoagent_user_billing')
      .select('subscription_status, subscription_current_period_end')
      .eq('user_id', userId)
      .maybeSingle();

    if (billingRes.error) {
      console.error('[entitlement] todoagent_user_billing', billingRes.error);
      return sendJson(res, 500, jsonFromSupabaseError(billingRes.error as PgErr, 'todoagent_user_billing'));
    }

    const usageRes = await supabase
      .from('todoagent_agent_daily_usage')
      .select('call_count')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .maybeSingle();

    if (usageRes.error) {
      console.error('[entitlement] todoagent_agent_daily_usage', usageRes.error);
      return sendJson(
        res,
        500,
        jsonFromSupabaseError(usageRes.error as PgErr, 'todoagent_agent_daily_usage')
      );
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

    return sendJson(res, 200, {
      billingEnabled: true,
      isPaid,
      freeDailyLimit: FREE_DAILY_LIMIT,
      usedToday,
      remainingFreeToday,
    });
  } catch (e: unknown) {
    console.error('[entitlement] unhandled', e);
    const message = e instanceof Error ? e.message : String(e);
    return sendJson(res, 500, {
      error: 'internal_crash',
      message,
      hint: 'Vercel 函数未捕获异常；请查看 Functions 日志。若为 ESM/依赖问题，可检查 @vercel/node 与 package.json type 字段。',
    });
  }
}
