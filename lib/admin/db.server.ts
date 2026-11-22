import 'server-only';
import { createDatabase, getDatabaseClient } from './database-client';
export { databaseConfigured } from './database-client';
export function database() { return createDatabase(getDatabaseClient()); }
export function runtime(key:string):string { return process.env[key] ?? ''; }
export async function rateLimit(id:string,max:number,windowSeconds:number) {
 const now=Math.floor(Date.now()/1000), bucket=Math.floor(now/windowSeconds);
 const row=await database().prepare('INSERT INTO rate_limits(id,count,expires) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(`${id}:${bucket}`,now+windowSeconds).first<{count:number}>();
 return Boolean(row && row.count<=max);
}
export async function cleanup() { const now=Math.floor(Date.now()/1000); await database().batch([database().prepare('DELETE FROM rate_limits WHERE expires < ?').bind(now-3600),database().prepare('DELETE FROM admin_sessions WHERE expires < ?').bind(now),database().prepare('DELETE FROM events WHERE created < ?').bind(now-90*86400)]); }
