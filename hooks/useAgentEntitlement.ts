import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { moonshotProxyEnabled } from '../utils/moonshotClient';

export function useAgentEntitlement() {
  const { getClerkToken, isLoggedIn } = useAuth();

  const checkCanOpenAgent = useCallback(async (): Promise<boolean> => {
    if (!moonshotProxyEnabled()) return true;
    if (!isLoggedIn) return false;
    const token = await getClerkToken();
    if (!token) return false;
    const r = await fetch('/api/billing/entitlement', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return false;
    const j = (await r.json()) as {
      billingEnabled?: boolean;
      isPaid?: boolean;
      remainingFreeToday?: number;
    };
    if (j.billingEnabled === false) return true;
    return !!j.isPaid || (typeof j.remainingFreeToday === 'number' && j.remainingFreeToday > 0);
  }, [getClerkToken, isLoggedIn]);

  const startStripeCheckout = useCallback(async (): Promise<{ ok: boolean; detail?: string }> => {
    const token = await getClerkToken();
    if (!token) return { ok: false, detail: '未登录或无法获取会话令牌' };
    const r = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) {
      let detail = '';
      try {
        const j = (await r.json()) as { error?: string; hint?: string; message?: string };
        detail = [j.hint, j.message, j.error].filter(Boolean).join('\n');
      } catch {
        detail = await r.text();
      }
      return { ok: false, detail: detail || `HTTP ${r.status}` };
    }
    const j = (await r.json()) as { url?: string };
    if (j.url) {
      window.location.href = j.url;
      return { ok: true };
    }
    return { ok: false, detail: '未返回支付链接' };
  }, [getClerkToken]);

  return { checkCanOpenAgent, startStripeCheckout };
}
