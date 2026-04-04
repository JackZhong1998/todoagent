import { verifyToken } from '@clerk/backend';
import type { VercelRequest } from '@vercel/node';

export async function getClerkUserIdFromRequest(req: VercelRequest): Promise<string | null> {
  const raw = req.headers.authorization;
  if (!raw || typeof raw !== 'string' || !raw.startsWith('Bearer ')) return null;
  const token = raw.slice(7).trim();
  if (!token) return null;
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!secret) return null;
  try {
    const payload = await verifyToken(token, { secretKey: secret });
    const sub = payload.sub;
    return typeof sub === 'string' && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
}
