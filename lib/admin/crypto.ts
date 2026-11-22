import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
const encoder=new TextEncoder();
export async function digest(value:string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))),b=>b.toString(16).padStart(2,'0')).join(''); }
export async function verifyPassword(password:string,encoded:string) {
 const [scheme,iterations,salt,expected]=encoded.split('$');
 if(scheme!=='pbkdf2' || !/^\d+$/.test(iterations??'') || Number(iterations)<100000 || Number(iterations)>1000000 || !/^[a-f0-9]{32}$/.test(salt??'') || !/^[a-f0-9]{64}$/.test(expected??'')) return false;
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 let bits:ArrayBuffer|Uint8Array;
 try { bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:Number(iterations),hash:'SHA-256'},key,256); }
 catch(error) {
   if(!(error instanceof Error) || error.name!=='NotSupportedError')throw error;
   // Cloudflare production caps native PBKDF2. Preserve the exact standard
   // 600,000-iteration hash using the vetted JS implementation, not a weaker KDF.
   bits=await pbkdf2Async(sha256,encoder.encode(password),encoder.encode(salt),{c:Number(iterations),dkLen:32,asyncTick:10});
 }
 const actual=Array.from(new Uint8Array(bits),b=>b.toString(16).padStart(2,'0')).join('');
 let diff=0; for(let i=0;i<64;i++) diff|=actual.charCodeAt(i)^expected.charCodeAt(i); return diff===0;
}
export function randomToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');}
