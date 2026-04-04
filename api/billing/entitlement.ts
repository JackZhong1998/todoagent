import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getClerkUserIdFromRequest } from '../_lib/auth';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin';
import { billingBackendConfigured, skipAgentBilling } from '../_lib/billingFlags';

const FREE_DAILY_LIMIT = 10;

function utcTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
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

  const [{ data: billingRow, error: bErr }, { data: usageRow, error: uErr }] = await Promise.all([
    supabase
      .from('todoagent_user_billing')
      .select('subscription_status, subscription_current_period_end')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('todoagent_agent_daily_usage')
      .select('call_count')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .maybeSingle(),
  ]);

  if (bErr || uErr) {
    console.error('[entitlement]', bErr || uErr);
    return res.status(500).json({ error: 'read_failed' });
  }

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
