import {describe,it,expect,vi} from 'vitest';
import {readBody,readObject,RequestError,SESSION_ID} from '@/lib/security';
vi.mock('next/headers',()=>({headers:vi.fn()}));
vi.mock('@/lib/admin/db.server',()=>({rateLimit:vi.fn(),runtime:()=>'',cleanup:vi.fn()}));
import {clientAddress} from '@/lib/abuse.server';
import {proxy} from '@/proxy';
import {NextRequest} from 'next/server';
function json(body:string){return new Request('https://example.com',{method:'POST',body,headers:{'content-type':'application/json'}});}
describe('bounded JSON and trust boundaries',()=>{
 it.each(['null','[]','false','123','"hello"','{bad'])('rejects non-object payload %s',async raw=>{await expect(readObject(json(raw))).rejects.toMatchObject({status:400});});
 it('enforces bytes, not characters or a claimed content-length',async()=>{await expect(readBody(json('é'.repeat(100)),150)).rejects.toMatchObject({status:413});});
 it('requires a JSON content type',async()=>{await expect(readObject(new Request('https://example.com',{method:'POST',body:'{}'}))).rejects.toMatchObject({status:415});});
 it('parses a valid bounded payload',async()=>{expect(await readObject(json('{"password":"example"}'))).toEqual({password:'example'});});
 it('trusts forwarded IPs only on Vercel',()=>{
  const h=new Headers({'x-vercel-forwarded-for':'203.0.113.1','x-forwarded-for':'198.51.100.1'});
  expect(clientAddress(h,true)).toBe('203.0.113.1');expect(clientAddress(h,false)).toBe('local');
  expect(clientAddress(new Headers({'x-forwarded-for':'arbitrary-attacker-value'}),true)).toBe('unknown');
 });
 it('bounds Stripe order lookup identifiers',()=>{expect(SESSION_ID.test('cs_live_'+'a'.repeat(32))).toBe(true);expect(SESSION_ID.test('cs_live_'+ 'a'.repeat(10000))).toBe(false);expect(SESSION_ID.test('cs_anything')).toBe(false);});
 it('generates fresh CSP nonces and marks customer orders private',()=>{
  const first=proxy(new NextRequest('https://example.com/order/confirmed'));
  const second=proxy(new NextRequest('https://example.com/order/confirmed'));
  expect(first.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
  expect(first.headers.get('content-security-policy')).toContain("'strict-dynamic'");
  expect(first.headers.get('content-security-policy')).not.toBe(second.headers.get('content-security-policy'));
  expect(first.headers.get('cache-control')).toContain('no-store');
  expect(first.headers.get('x-robots-tag')).toContain('noindex');
 });
});
