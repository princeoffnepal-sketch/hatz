import { databaseConfigured } from '@/lib/admin/db.server';
import { database,rateLimit } from '@/lib/admin/db.server';
import { sameOrigin } from '@/lib/admin/auth.server';
import { getCommerceConfig } from '@/config/commerce.server';
const allowed=new Set(['page_view','view_item','select_item','add_to_cart','begin_checkout','view_cart','fit_guide_opened','add_to_cart_failed']);
export async function POST(request:Request){
 if(!databaseConfigured()) return new Response(null,{status:204});
 if(!sameOrigin(request))return new Response(null,{status:403});
 if(Number(request.headers.get('content-length')??0)>2048)return new Response(null,{status:413});
 const raw=await request.text();if(raw.length>2048)return new Response(null,{status:413});
 let data;try{data=JSON.parse(raw);}catch{return new Response(null,{status:400});}
 if(!allowed.has(data.event) || !/^[a-f0-9-]{36}$/.test(data.session??'') || !/^[a-f0-9-]{36}$/.test(data.id??'') || typeof data.path!=='string' || !/^\/[a-z0-9\-/]*$/.test(data.path) || data.path.length>120 || data.path.startsWith('/admin'))return new Response(null,{status:400});
 if(!await rateLimit(`events:${data.session}`,90,60))return new Response(null,{status:429});
 const item=typeof data.item==='string' && /^design-\d\d$/.test(data.item)?data.item:null;
 await database().prepare('INSERT INTO events(id,session,event,path,item,created,mode) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(data.id,data.session,data.event,data.path,item,Math.floor(Date.now()/1000),getCommerceConfig().mode==='live'?'live':'demo').run();
 return new Response(null,{status:204});
}
