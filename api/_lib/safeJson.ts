import type { VercelResponse } from '@vercel/node';

/** 避免 res.json 在部分运行时下异常导致 FUNCTION_INVOCATION_FAILED */
export function sendJson(res: VercelResponse, statusCode: number, body: unknown): void {
  if (res.writableEnded) return;
  const payload = JSON.stringify(body);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(payload, 'utf8'));
  res.end(payload);
}
