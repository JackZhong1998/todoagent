import type { VercelResponse } from '@vercel/node';

/**
 * 显式写 JSON，避免 res.json 在部分环境下异常。
 * 不使用 Buffer（Edge 无 Buffer 时会直接崩溃）。
 */
export function sendJson(res: VercelResponse, statusCode: number, body: unknown): void {
  if (res.writableEnded) return;
  const payload = JSON.stringify(body);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(payload);
}
