import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { getClerkUserIdFromRequest } from '../_lib/auth';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin';

function siteOrigin(req: VercelRequest): string {
  const env = process.env.SITE_URL?.trim() || process.env.VITE_SITE_URL?.trim();
  if (env) return env.replace(/\/$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  if (typeof host === 'string' && host.length > 0) {
    return `${proto}://${host}`.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const userId = await getClerkUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  const priceId = process.env.STRIPE_PRICE_ID?.trim();
  if (!secret || !priceId) {
    return res.status(503).json({ error: 'stripe_not_configured' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(503).json({ error: 'supabase_not_configured' });
  }

  const { data: row, error: billingReadErr } = await supabase
    .from('todoagent_user_billing')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (billingReadErr) {
    console.error('[checkout] billing read', billingReadErr);
    const msg = billingReadErr.message || String(billingReadErr);
    const missingRelation = /does not exist|schema cache/i.test(msg);
    return res.status(500).json({
      error: 'billing_read_failed',
      hint: missingRelation
        ? 'Supabase 缺少 todoagent_user_billing 表：请执行 migration 20250404120000_user_billing_agent_usage.sql'
        : '请核对 SUPABASE_SERVICE_ROLE_KEY 与 SUPABASE_URL',
    });
  }

  const existingCustomerId =
    row && typeof (row as { stripe_customer_id?: string }).stripe_customer_id === 'string'
      ? (row as { stripe_customer_id: string }).stripe_customer_id.trim()
      : '';

  const stripe = new Stripe(secret, { apiVersion: '2025-02-24.acacia' });
  const origin = siteOrigin(req);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/app/todo?billing=success`,
      cancel_url: `${origin}/app/todo?billing=cancel`,
      client_reference_id: userId,
      subscription_data: {
        metadata: { clerk_user_id: userId },
      },
      metadata: { clerk_user_id: userId },
      ...(existingCustomerId
        ? { customer: existingCustomerId }
        : { customer_creation: 'always' as const }),
    });

    return res.status(200).json({ url: session.url });
  } catch (e: unknown) {
    console.error('[checkout] stripe', e);
    const message = e instanceof Error ? e.message : String(e);
    return res.status(502).json({
      error: 'stripe_checkout_failed',
      message,
    });
  }
}
