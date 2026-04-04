import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Stripe expandable fields may arrive as id string or as `{ id }` in some payloads. */
export function stripeExpandableId(
  value: string | { id: string } | null | undefined
): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string') {
    return (value as { id: string }).id;
  }
  return null;
}

export async function upsertSubscriptionBilling(
  supabase: SupabaseClient,
  userId: string,
  sub: Stripe.Subscription,
  customerId: string
): Promise<boolean> {
  const row = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    subscription_current_period_end: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('todoagent_user_billing').upsert(row, { onConflict: 'user_id' });
  if (error) console.error('[stripe billing] upsert', error);
  return !error;
}
