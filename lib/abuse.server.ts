import 'server-only';
import { headers } from 'next/headers';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { rateLimit, runtime, cleanup } from '@/lib/admin/db.server';

/** Only trust IP headers added by our Vercel edge. Never persist the raw IP. */
export function clientAddress(h: Pick<Headers,'get'>, vercel = Boolean(process.env.VERCEL)) {
  if (!vercel) return 'local';
  const ip = (h.get('x-vercel-forwarded-for') ?? h.get('x-forwarded-for') ?? '').split(',')[0].trim();
  return isIP(ip) ? ip : 'unknown';
}
export async function allowRequest(scope: string, max: number, seconds: number, incoming?: Headers): Promise<boolean> {
  const h = incoming ?? await headers();
  const secret = runtime('RATE_LIMIT_SECRET') || runtime('ADMIN_PASSWORD_HASH');
  if (!secret && process.env.NODE_ENV === 'production') return false;
  const day = Math.floor(Date.now()/86400000);
  const identity = createHmac('sha256',secret || 'local-development').update(`${day}:${clientAddress(h)}`).digest('hex');
  const allowed = await rateLimit(`${scope}:${identity}`, max, seconds);
  // Bounded opportunistic maintenance also runs on public traffic, not only logins.
  if (Math.random()<0.01) await cleanup().catch(()=>{});
  return allowed;
}
