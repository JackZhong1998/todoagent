import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getClerkUserIdFromRequest } from '../_lib/auth.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import { sendJson } from '../_lib/safeJson.js';
import { stripeExpandableId, upsertSubscriptionBilling } from '../_lib/stripeBillingUpsert.js';

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

    const raw = req.body as unknown;
    let body: { sessionId?: string };
    if (typeof raw === 'string') {
      try {
        body = JSON.parse(raw) as { sessionId?: string };
      } catch {
        return sendJson(res, 400, { error: 'invalid_json' });
      }
    } else if (raw && typeof raw === 'object') {
      body = raw as { sessionId?: string };
    } else {
      body = {};
    }
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    if (!sessionId || !/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
      return sendJson(res, 400, { error: 'invalid_session_id' });
    }

    const secret = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secret) {
      return sendJson(res, 503, { error: 'stripe_not_configured' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return sendJson(res, 503, { error: 'supabase_not_configured' });
    }

    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(secret, { apiVersion: '2025-02-24.acacia' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.mode !== 'subscription') {
      return sendJson(res, 400, { error: 'not_subscription_checkout' });
    }
    if (session.payment_status !== 'paid') {
      return sendJson(res, 400, { error: 'not_paid', payment_status: session.payment_status });
    }

    const refUser =
      session.client_reference_id ||
      (typeof session.metadata?.clerk_user_id === 'string' ? session.metadata.clerk_user_id : null);
    if (!refUser || refUser !== userId) {
      return sendJson(res, 403, { error: 'session_user_mismatch' });
    }

    const subId = stripeExpandableId(
      session.subscription as string | { id: string } | null | undefined
    );
    const customerId = stripeExpandableId(
      session.customer as string | { id: string } | null | undefined
    );
    if (!subId || !customerId) {
      return sendJson(res, 400, { error: 'missing_subscription_or_customer' });
    }

    const sub = await stripe.subscriptions.retrieve(subId);
    const synced = await upsertSubscriptionBilling(supabase, userId, sub, customerId);
    if (!synced) {
      return sendJson(res, 500, { error: 'billing_upsert_failed' });
    }

    return sendJson(res, 200, { ok: true, synced: true });
  } catch (e: unknown) {
    console.error('[confirm-checkout] unhandled', e);
    const message = e instanceof Error ? e.message : String(e);
    return sendJson(res, 500, { error: 'confirm_failed', message });
  }
}
