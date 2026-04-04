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
    const entText = await r.text();
    if (!r.ok) {
      try {
        const errBody = JSON.parse(entText) as { message?: string; hint?: string; error?: string };
        console.warn('[entitlement]', r.status, errBody);
      } catch {
        console.warn('[entitlement]', r.status, entText.slice(0, 200));
      }
      return false;
    }
    let j: {
      billingEnabled?: boolean;
      isPaid?: boolean;
      remainingFreeToday?: number;
    };
    try {
      j = JSON.parse(entText) as typeof j;
    } catch {
      console.warn('[entitlement] invalid JSON', entText.slice(0, 120));
      return false;
    }
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
    const bodyText = await r.text();
    if (!r.ok) {
      let detail = bodyText;
      try {
        const j = JSON.parse(bodyText) as {
          error?: string;
          hint?: string;
          message?: string;
          supabaseMessage?: string;
        };
        detail = [j.hint, j.supabaseMessage, j.message, j.error].filter(Boolean).join('\n') || bodyText;
      } catch {
        /* 保持 bodyText */
      }
      return { ok: false, detail: detail.trim() || `HTTP ${r.status}` };
    }
    let j: { url?: string };
    try {
      j = JSON.parse(bodyText) as { url?: string };
    } catch {
      return { ok: false, detail: '服务器返回了非 JSON 响应' };
    }
    if (j.url) {
      window.location.href = j.url;
      return { ok: true };
    }
    return { ok: false, detail: '未返回支付链接' };
  }, [getClerkToken]);

  return { checkCanOpenAgent, startStripeCheckout };
}
