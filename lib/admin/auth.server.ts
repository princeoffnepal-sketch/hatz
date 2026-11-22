import 'server-only';
import { cookies } from 'next/headers';
import { database,runtime } from './db.server';
import { digest } from './crypto';
export const ADMIN_COOKIE='eh_admin';
export async function isAdmin(){
 const token=(await cookies()).get(ADMIN_COOKIE)?.value;
 if(!token || !/^[a-f0-9]{64}$/.test(token) || !runtime('ADMIN_PASSWORD_HASH'))return false;
 const row=await database().prepare('SELECT expires,version FROM admin_sessions WHERE token_hash=?').bind(await digest(token)).first<{expires:number;version:string}>();
 return !!row && row.expires>Math.floor(Date.now()/1000) && row.version===await digest(runtime('ADMIN_PASSWORD_HASH'));
}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !!origin && origin===new URL(request.url).origin;}
export function privateJson(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});}
