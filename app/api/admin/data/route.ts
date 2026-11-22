import { isAdmin,privateJson } from '@/lib/admin/auth.server';
import { dashboard } from '@/lib/admin/ledger.server';
import { getGate } from '@/lib/checkout/gate.server';
import { runtime, database } from '@/lib/admin/db.server';
export async function GET(request:Request){
 if(!await isAdmin())return privateJson({error:'Sign in required.'},401);
 const url=new URL(request.url),days=Number(url.searchParams.get('days'))===7?7:30,live=url.searchParams.get('mode')==='test'?0:1;
 const inbox=(await database().prepare("SELECT id,kind,name,email,topic,message,created FROM submissions ORDER BY created DESC LIMIT 100").all()).results;
 return privateJson({...await dashboard(live,days),inbox,readiness:getGate().checks.map(c=>({id:c.id,label:c.label,ok:c.ok})),stripeConnected:!!runtime('STRIPE_SECRET_KEY'),webhookConnected:!!runtime('STRIPE_WEBHOOK_SECRET')});
}
