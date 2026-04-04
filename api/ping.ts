/**
 * 健康检查：不引用 _lib，避免共享模块在 Edge/打包下出问题。
 * 仅类型依赖 @vercel/node（编译后无运行时 import）。
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const body = JSON.stringify({ ok: true, service: 'todoagent-api', t: Date.now() });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
}
