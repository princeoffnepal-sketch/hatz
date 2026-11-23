import { allowRequest } from '@/lib/abuse.server';
import { readObject, RequestError } from '@/lib/security';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE,privateJson,sameOrigin } from '@/lib/admin/auth.server';
import { database,runtime,cleanup } from '@/lib/admin/db.server';
import { verifyPassword,digest,randomToken } from '@/lib/admin/crypto';
async function login(request:Request){
 if(!sameOrigin(request))return privateJson({error:'Request not allowed.'},403);
 if(!runtime('ADMIN_PASSWORD_HASH'))return privateJson({error:'Admin access has not been configured.'},503);
 if(!await allowRequest('admin-login',8,900,request.headers))return privateJson({error:'Too many attempts. Please wait 15 minutes.'},429);
 const {password}=await readObject(request,2048);
 if(typeof password!=='string' || password.length>256 || !await verifyPassword(password,runtime('ADMIN_PASSWORD_HASH')))return privateJson({error:'Incorrect password.'},401);
 const token=randomToken(), expires=Math.floor(Date.now()/1000)+8*3600;
 await database().prepare('INSERT INTO admin_sessions(token_hash,expires,version) VALUES(?,?,?)').bind(await digest(token),expires,await digest(runtime('ADMIN_PASSWORD_HASH'))).run();
 (await cookies()).set(ADMIN_COOKIE,token,{httpOnly:true,secure:new URL(request.url).protocol==='https:',sameSite:'strict',path:'/',maxAge:8*3600});
 await cleanup(); return privateJson({ok:true});
}

export async function POST(request:Request){try{return await login(request);}catch(error){if(error instanceof RequestError)return privateJson({error:error.message},error.status);console.error('[admin] Login failed',error instanceof Error?error.name:'UnknownError');return privateJson({error:'Sign-in is temporarily unavailable. Please try again.'},503);}}
