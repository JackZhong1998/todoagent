import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getClerkUserIdFromRequest } from '../_lib/auth.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import { sendJson } from '../_lib/safeJson.js';

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
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return sendJson(res, 405, { error: 'method_not_allowed' });
    }

    const userId = await getClerkUserIdFromRequest(req);
    if (!userId) {
      return sendJson(res, 401, { error: 'unauthorized' });
    }

    const secret = process.env.STRIPE_SECRET_KEY?.trim();
    const priceId = process.env.STRIPE_PRICE_ID?.trim();
    if (!secret || !priceId) {
      return sendJson(res, 503, { error: 'stripe_not_configured' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return sendJson(res, 503, { error: 'supabase_not_configured' });
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
      return sendJson(res, 500, {
        error: 'billing_read_failed',
        code: billingReadErr.code,
        supabaseMessage: billingReadErr.message,
        supabaseDetails: billingReadErr.details,
        supabaseHint: billingReadErr.hint,
        hint: missingRelation
          ? 'Supabase 缺少 todoagent_user_billing 表，或 Data API / schema 未暴露：请执行 migration 并检查 Settings → API'
          : '请核对 SUPABASE_URL 与 Legacy service_role 密钥（eyJ 开头）是否同属一个 Supabase 项目',
      });
    }

    const existingCustomerId =
      row && typeof (row as { stripe_customer_id?: string }).stripe_customer_id === 'string'
        ? (row as { stripe_customer_id: string }).stripe_customer_id.trim()
        : '';

    const { default: Stripe } = await import('stripe');
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
        ...(existingCustomerId ? { customer: existingCustomerId } : {}),
      });

      return sendJson(res, 200, { url: session.url });
    } catch (e: unknown) {
      console.error('[checkout] stripe', e);
      const message = e instanceof Error ? e.message : String(e);
      return sendJson(res, 502, {
        error: 'stripe_checkout_failed',
        message,
      });
    }
  } catch (e: unknown) {
    console.error('[checkout] unhandled', e);
    const message = e instanceof Error ? e.message : String(e);
    return sendJson(res, 500, {
      error: 'internal_crash',
      message,
    });
  }
}
