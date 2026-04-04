/** 浏览器侧：经 Vercel /api/moonshot/completions 代理 Kimi（密钥在服务端） */

export class AgentQuotaExceededError extends Error {
  constructor() {
    super('agent_quota_exceeded');
    this.name = 'AgentQuotaExceededError';
  }
}

export function moonshotProxyEnabled(): boolean {
  return import.meta.env.VITE_MOONSHOT_USE_PROXY === 'true';
}

export function moonshotDirectApiKey(): string {
  return import.meta.env.VITE_MOONSHOT_API_KEY || '';
}

export const MOONSHOT_MODEL_DEFAULT = import.meta.env.VITE_MOONSHOT_MODEL || 'kimi-k2.5';

export async function moonshotFetchCompletion(
  getToken: () => Promise<string | null>,
  input: {
    billingKind: 'agent' | 'sop';
    dedupeKey?: string;
    body: Record<string, unknown>;
  }
): Promise<Response> {
  const token = await getToken();
  if (!token) throw new Error('not_signed_in');
  return fetch('/api/moonshot/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      billingKind: input.billingKind,
      dedupeKey: input.dedupeKey,
      moonshotBody: input.body,
    }),
  });
}

export async function moonshotParseCompletionJson(res: Response): Promise<{
  choices?: Array<{ message?: { content?: string } }>;
}> {
  const text = await res.text();
  if (!res.ok) {
    try {
      const j = JSON.parse(text) as { error?: string | { message?: string } };
      const flat = typeof j?.error === 'string' ? j.error : undefined;
      if (flat === 'agent_quota_exceeded') {
        throw new AgentQuotaExceededError();
      }
    } catch (e) {
      if (e instanceof AgentQuotaExceededError) throw e;
    }
    let detail = text;
    try {
      const j = JSON.parse(text) as { error?: { message?: string } };
      detail = j?.error?.message ?? text;
    } catch {
      /* keep text */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return JSON.parse(text) as { choices?: Array<{ message?: { content?: string } }> };
}

export async function moonshotChatJson(
  getToken: () => Promise<string | null>,
  input: { billingKind: 'agent' | 'sop'; dedupeKey?: string; body: Record<string, unknown> }
): Promise<{ choices?: Array<{ message?: { content?: string } }> }> {
  const res = await moonshotFetchCompletion(getToken, input);
  return moonshotParseCompletionJson(res);
}
