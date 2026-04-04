import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getClerkUserIdFromRequest } from '../_lib/auth';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin';
import { billingBackendConfigured } from '../_lib/billingFlags';

const MOONSHOT_URL = 'https://api.moonshot.cn/v1/chat/completions';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const userId = await getClerkUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  let body: {
    billingKind?: string;
    dedupeKey?: string;
    moonshotBody?: Record<string, unknown>;
  };
  try {
    body =
      typeof req.body === 'string'
        ? (JSON.parse(req.body) as typeof body)
        : (req.body as typeof body);
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }

  const billingKind = body.billingKind === 'sop' ? 'sop' : 'agent';
  const moonshotBody = body.moonshotBody;
  if (!moonshotBody || typeof moonshotBody !== 'object') {
    return res.status(400).json({ error: 'missing_moonshot_body' });
  }

  if (billingKind === 'agent' && billingBackendConfigured()) {
    const dedupeKey = typeof body.dedupeKey === 'string' ? body.dedupeKey.trim() : '';
    if (!dedupeKey) {
      return res.status(400).json({ error: 'missing_dedupe_key' });
    }
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(503).json({ error: 'billing_misconfigured' });
    }
    const { data, error } = await supabase.rpc('agent_moonshot_precheck', {
      p_user_id: userId,
      p_dedupe_key: dedupeKey,
    });
    if (error) {
      console.error('[moonshot] precheck rpc', error);
      return res.status(500).json({ error: 'precheck_failed' });
    }
    const row = data as unknown as { ok?: boolean; code?: string } | null;
    if (!row || row.ok !== true) {
      if (row?.code === 'agent_quota_exceeded') {
        return res.status(403).json({ error: 'agent_quota_exceeded' });
      }
      return res.status(403).json({ error: row?.code || 'forbidden' });
    }
  }

  const apiKey = process.env.MOONSHOT_API_KEY?.trim();
  if (!apiKey) {
    return res.status(503).json({ error: 'moonshot_not_configured' });
  }

  const msRes = await fetch(MOONSHOT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(moonshotBody),
  });

  const text = await msRes.text();
  const ct = msRes.headers.get('content-type') || 'application/json';
  res.status(msRes.status);
  res.setHeader('Content-Type', ct);
  return res.send(text);
}
