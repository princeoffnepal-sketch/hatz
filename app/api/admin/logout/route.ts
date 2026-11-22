import { cookies } from 'next/headers';
import { ADMIN_COOKIE,privateJson,sameOrigin } from '@/lib/admin/auth.server';
import { database } from '@/lib/admin/db.server';
import { digest } from '@/lib/admin/crypto';
export async function POST(request:Request){
 if(!sameOrigin(request))return privateJson({error:'Request not allowed.'},403);
 const jar=await cookies(),token=jar.get(ADMIN_COOKIE)?.value;
 if(token)await database().prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await digest(token)).run();
 jar.delete(ADMIN_COOKIE);return privateJson({ok:true});
}
