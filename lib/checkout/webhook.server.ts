import 'server-only';
import { database } from '@/lib/admin/db.server';
import { getStripe } from './stripe.server';
export async function claimEvent(id:string) {
 const now=Math.floor(Date.now()/1000);
 const row=await database().prepare('INSERT INTO stripe_events(id,processed,lease_until,updated) VALUES(?,0,?,?) ON CONFLICT(id) DO UPDATE SET lease_until=excluded.lease_until,updated=excluded.updated WHERE processed=0 AND lease_until<=? RETURNING id').bind(id,now+120,now,now).first();
 if(row)return 'claimed';
 const existing=await database().prepare('SELECT processed FROM stripe_events WHERE id=?').bind(id).first<{processed:number}>();
 return existing?.processed?'done':'busy';
}
export async function finishEvent(id:string,success:boolean) {
 await database().prepare('UPDATE stripe_events SET processed=?,lease_until=0,updated=? WHERE id=?').bind(success?1:0,Math.floor(Date.now()/1000),id).run();
}
export async function isHatzPayment(intent:string|null) {
 if(!intent)return false;
 const order=await database().prepare('SELECT id FROM orders WHERE payment_intent=?').bind(intent).first();
 if(order)return true;
 // Refund/dispute webhooks may arrive before checkout completion. Check Stripe
 // metadata instead of discarding those events, and never store Mogfit app sales.
 const payment=await getStripe().paymentIntents.retrieve(intent);
 return payment.metadata?.store==='exclusive-hatz';
}
