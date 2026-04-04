/** 未配置 Stripe/用量表时跳过计费（仅适合开发/自托管） */
export function skipAgentBilling(): boolean {
  return process.env.SKIP_AGENT_BILLING === 'true' || process.env.SKIP_AGENT_BILLING === '1';
}

export function billingBackendConfigured(): boolean {
  if (skipAgentBilling()) return false;
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return !!(url && key);
}
