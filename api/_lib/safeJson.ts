import type { VercelResponse } from '@vercel/node';

function safeStringify(body: unknown): string {
  try {
    return JSON.stringify(body, (_key, value) => {
      if (typeof value === 'string' && value.length > 12_000) {
        return `${value.slice(0, 12_000)}…`;
      }
      return value;
    });
  } catch {
    return '{"error":"stringify_failed"}';
  }
}

/**
 * 显式写 JSON。不在开头用 writableEnded 直接 return（否则易出现 500 且无 body）。
 */
export function sendJson(res: VercelResponse, statusCode: number, body: unknown): void {
  const payload = safeStringify(body);
  try {
    if (res.headersSent) {
      console.error('[sendJson] headers already sent, status was', res.statusCode);
      return;
    }
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(payload);
  } catch (e) {
    console.error('[sendJson] end failed', e);
    try {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('{"error":"response_write_failed"}');
      }
    } catch {
      /* ignore */
    }
  }
}
