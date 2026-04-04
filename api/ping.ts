import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendJson } from './_lib/safeJson';

/** 无第三方依赖，用于确认 Vercel Functions 是否正常运行 */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  sendJson(res, 200, { ok: true, service: 'todoagent-api', t: Date.now() });
}
