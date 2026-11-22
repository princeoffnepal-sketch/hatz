import 'server-only';
import type Stripe from 'stripe';
import { database } from './db.server';
import { COMMISSION_PER_HAT,commissionFor,type LedgerOrder } from './commission';
import { getStripe } from '@/lib/checkout/stripe.server';
export async function recordOrder(session:Stripe.Checkout.Session){
 if(session.payment_status!=='paid' || !session.amount_total || session.metadata?.store!=='exclusive-hatz')return;
 const existing=await database().prepare('SELECT id FROM orders WHERE id=?').bind(session.id).first(); if(existing)return;
 const items=[];let quantity=0;
 for await (const li of getStripe().checkout.sessions.listLineItems(session.id,{limit:100,expand:['data.price.product']})){
  const product=li.price?.product;
  if(!product || typeof product==='string' || ('deleted' in product && product.deleted) || product.metadata?.store!=='exclusive-hatz')throw new Error('Unexpected order item');
  quantity+=li.quantity??0;items.push({name:li.description,quantity:li.quantity,amount:li.amount_subtotal,variant:product.metadata.variant_id});
 }
 if(session.currency!=='usd')throw new Error('Unexpected order currency');
 if(quantity<1)throw new Error('Order has no hats');
 const intent=typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id;
 if(!intent)throw new Error('Payment intent missing');
 await database().prepare('INSERT INTO orders(id,payment_intent,created,live,currency,subtotal,total,quantity,items,commission_rate,fulfillment) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(session.id,intent,session.created,session.livemode?1:0,session.currency??'usd',session.amount_subtotal??0,session.amount_total,quantity,JSON.stringify(items),COMMISSION_PER_HAT,'awaiting_supplier').run();
}
export async function recordRefund(charge:Stripe.Charge){
 const intent=typeof charge.payment_intent==='string'?charge.payment_intent:charge.payment_intent?.id;if(!intent)return;
 await database().prepare('INSERT INTO refunds(payment_intent,amount,updated) VALUES(?,?,?) ON CONFLICT(payment_intent) DO UPDATE SET amount=MAX(amount,excluded.amount),updated=excluded.updated').bind(intent,charge.amount_refunded,Math.floor(Date.now()/1000)).run();
}
export async function allOrders(live:number){return (await database().prepare('SELECT o.*,COALESCE(r.amount,0) refund_amount,d.status dispute_status FROM orders o LEFT JOIN refunds r ON r.payment_intent=o.payment_intent LEFT JOIN disputes d ON d.payment_intent=o.payment_intent WHERE o.live=? ORDER BY created DESC').bind(live).all<LedgerOrder>()).results;}
export async function dashboard(live:number,days:number){
 const all=await allOrders(live),since=Math.floor(Date.now()/1000)-days*86400,orders=all.filter(o=>o.created>=since);
 const payouts=(await database().prepare('SELECT * FROM payouts WHERE live=? ORDER BY created DESC').bind(live).all<{id:string;amount:number;reference:string;created:number}>()).results;
 const events=(await database().prepare('SELECT event,COUNT(*) count,COUNT(DISTINCT session) sessions FROM events WHERE created>=? AND mode=? GROUP BY event').bind(since,live?'live':'demo').all<{event:string;count:number;sessions:number}>()).results;
 const daily=Array.from({length:days},(_,i)=>{const date=new Date(Date.now()-(days-1-i)*86400000).toISOString().slice(0,10);const rows=orders.filter(o=>new Date(o.created*1000).toISOString().slice(0,10)===date);return {date,revenue:rows.reduce((s,o)=>s+o.total,0),units:rows.reduce((s,o)=>s+o.quantity,0)};});
 const totalEarned=all.reduce((s,o)=>s+commissionFor(o).earned,0),paid=payouts.reduce((s,p)=>s+p.amount,0);
 return {days,live,orders:orders.map(o=>({...o,commission:commissionFor(o)})),payouts,events,daily,totals:{orders:orders.length,units:orders.reduce((s,o)=>s+o.quantity,0),gross:orders.reduce((s,o)=>s+o.total,0),refunds:orders.reduce((s,o)=>s+o.refund_amount,0),earned:orders.reduce((s,o)=>s+commissionFor(o).earned,0),held:orders.reduce((s,o)=>s+commissionFor(o).held,0),totalEarned,paid,balance:totalEarned-paid}};
}

export async function recordDispute(dispute:Stripe.Dispute,created:number){
 const intent=typeof dispute.payment_intent==='string'?dispute.payment_intent:dispute.payment_intent?.id;if(!intent)return;
 await database().prepare('INSERT INTO disputes(payment_intent,status,updated) VALUES(?,?,?) ON CONFLICT(payment_intent) DO UPDATE SET status=excluded.status,updated=excluded.updated WHERE excluded.updated>=updated').bind(intent,dispute.status,created).run();
}
