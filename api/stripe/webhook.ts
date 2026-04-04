import { buffer } from 'micro';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import { stripeExpandableId, upsertSubscriptionBilling } from '../_lib/stripeBillingUpsert.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || !whSecret) {
    return res.status(503).json({ error: 'stripe_not_configured' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(503).json({ error: 'supabase_not_configured' });
  }

  const stripe = new Stripe(secret, { apiVersion: '2025-02-24.acacia' });

  let event: Stripe.Event;
  try {
    const rawBody = await buffer(req);
    const sig = req.headers['stripe-signature'];
    if (!sig || typeof sig !== 'string') {
      return res.status(400).json({ error: 'missing_signature' });
    }
    event = stripe.webhooks.constructEvent(rawBody, sig, whSecret);
  } catch (e) {
    console.error('[stripe webhook] verify', e);
    return res.status(400).json({ error: 'invalid_payload' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;
        const subId = stripeExpandableId(
          session.subscription as string | { id: string } | null | undefined
        );
        const customerId = stripeExpandableId(
          session.customer as string | { id: string } | null | undefined
        );
        const userId =
          session.client_reference_id ||
          (typeof session.metadata?.clerk_user_id === 'string' ? session.metadata.clerk_user_id : null);
        if (!userId || !subId || !customerId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        await upsertSubscriptionBilling(supabase, userId, sub, customerId);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = stripeExpandableId(
          sub.customer as string | { id: string } | null | undefined
        );
        let userId = sub.metadata?.clerk_user_id;
        if (!userId && customerId) {
          const { data: billing } = await supabase
            .from('todoagent_user_billing')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .maybeSingle();
          if (billing && typeof (billing as { user_id?: string }).user_id === 'string') {
            userId = (billing as { user_id: string }).user_id;
          }
        }
        if (!userId || !customerId) break;
        if (event.type === 'customer.subscription.deleted') {
          await supabase
            .from('todoagent_user_billing')
            .upsert(
              {
                user_id: userId,
                stripe_customer_id: customerId,
                stripe_subscription_id: sub.id,
                subscription_status: 'canceled',
                subscription_current_period_end: null,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );
        } else {
          await upsertSubscriptionBilling(supabase, userId, sub, customerId);
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error('[stripe webhook] handler', e);
    return res.status(500).json({ error: 'handler_failed' });
  }

  return res.status(200).json({ received: true });
}
