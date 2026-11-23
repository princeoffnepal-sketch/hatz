import { databaseConfigured, database, rateLimit } from '@/lib/admin/db.server';
import { sameOrigin } from '@/lib/admin/auth.server';
import { getCommerceConfig } from '@/config/commerce.server';
import { allowRequest } from '@/lib/abuse.server';
import { readObject, RequestError } from '@/lib/security';
const allowed=new Set(['page_view','view_item','select_item','add_to_cart','begin_checkout','view_cart','fit_guide_opened','add_to_cart_failed']);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export async function POST(request:Request){
 if(!databaseConfigured()) return new Response(null,{status:204});
 if(!sameOrigin(request))return new Response(null,{status:403});
 if(request.headers.get('dnt')==='1' || request.headers.get('sec-gpc')==='1')return new Response(null,{status:204});
 try {
  const data=await readObject(request,2048);
  if(typeof data.event!=='string' || !allowed.has(data.event) || typeof data.session!=='string' || !uuid.test(data.session) || typeof data.id!=='string' || !uuid.test(data.id) || typeof data.path!=='string' || !/^\/[a-z0-9\-/]*$/.test(data.path) || data.path.length>120 || /^\/(admin|api|order|checkout|launch-readiness)(\/|$)/.test(data.path))return new Response(null,{status:400});
  if(!await allowRequest('events',180,60,request.headers) || !await rateLimit(`events-session:${data.session}`,90,60))return new Response(null,{status:429,headers:{'Retry-After':'60'}});
  const item=typeof data.item==='string' && /^design-\d\d$/.test(data.item)?data.item:null;
  await database().prepare('INSERT INTO events(id,session,event,path,item,created,mode) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(data.id,data.session,data.event,data.path,item,Math.floor(Date.now()/1000),getCommerceConfig().mode==='live'?'live':'demo').run();
  return new Response(null,{status:204});
 }catch(error){return new Response(null,{status:error instanceof RequestError?error.status:503});}
}
