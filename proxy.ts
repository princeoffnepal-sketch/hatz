import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const dev = process.env.NODE_ENV === 'development';
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'", // Motion uses inline transforms.
    "img-src 'self' data: blob:", "font-src 'self'", "object-src 'none'",
    "base-uri 'self'", "frame-ancestors 'none'", "frame-src 'none'",
    `connect-src 'self'${dev ? ' ws: wss:' : ''}`,
    "form-action 'self' https://checkout.stripe.com",
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
  const h = new Headers(request.headers);
  h.set('x-nonce',nonce);
  h.set('Content-Security-Policy',policy);
  const response = NextResponse.next({request:{headers:h}});
  response.headers.set('Content-Security-Policy',policy);
  if (/^\/(admin|api\/admin|order|checkout|launch-readiness)(\/|$)/.test(request.nextUrl.pathname)) {
    response.headers.set('Cache-Control','private, no-store, max-age=0');
    response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
  }
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|products-images/|brand/|robots.txt|sitemap.xml).*)'] };
