import { cookies } from 'next/headers';
import { ADMIN_COOKIE,privateJson,sameOrigin } from '@/lib/admin/auth.server';
import { database,runtime,rateLimit,cleanup } from '@/lib/admin/db.server';
import { verifyPassword,digest,randomToken } from '@/lib/admin/crypto';
async function login(request:Request){
 if(!sameOrigin(request))return privateJson({error:'Request not allowed.'},403);
 if(!runtime('ADMIN_PASSWORD_HASH'))return privateJson({error:'Admin access has not been configured.'},503);
 if(Number(request.headers.get('content-length')??0)>2048)return privateJson({error:'Request too large.'},413);
 if(!await rateLimit('admin-login',12,900))return privateJson({error:'Too many attempts. Please wait 15 minutes.'},429);
 const raw=await request.text(); if(raw.length>2048)return privateJson({error:'Request too large.'},413);
 let password='';try {password=JSON.parse(raw).password;}catch{return privateJson({error:'Invalid request.'},400);}
 if(typeof password!=='string' || password.length>256 || !await verifyPassword(password,runtime('ADMIN_PASSWORD_HASH')))return privateJson({error:'Incorrect password.'},401);
 const token=randomToken(), expires=Math.floor(Date.now()/1000)+8*3600;
 await database().prepare('INSERT INTO admin_sessions(token_hash,expires,version) VALUES(?,?,?)').bind(await digest(token),expires,await digest(runtime('ADMIN_PASSWORD_HASH'))).run();
 (await cookies()).set(ADMIN_COOKIE,token,{httpOnly:true,secure:new URL(request.url).protocol==='https:',sameSite:'strict',path:'/',maxAge:8*3600});
 await cleanup(); return privateJson({ok:true});
}

export async function POST(request:Request){try{return await login(request);}catch(error){console.error('[admin] Login failed',error instanceof Error?error.name:'UnknownError');return privateJson({error:'Sign-in is temporarily unavailable. Please try again.'},503);}}
