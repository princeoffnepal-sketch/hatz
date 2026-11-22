import { isAdmin,privateJson,sameOrigin } from '@/lib/admin/auth.server';
import { database } from '@/lib/admin/db.server';
export async function POST(request:Request){
 if(!sameOrigin(request) || !await isAdmin())return privateJson({error:'Access denied.'},403);
 const raw=await request.text();if(raw.length>4096)return privateJson({error:'Request too large.'},413);
 let data;try{data=JSON.parse(raw);}catch{return privateJson({error:'Invalid request.'},400);}
 const now=Math.floor(Date.now()/1000),db=database();
 if(data.action==='payout'){
  if(!Number.isSafeInteger(data.amount) || data.amount<=0 || data.amount>100000000 || typeof data.reference!=='string' || data.reference.trim().length<3 || data.reference.length>120)return privateJson({error:'Enter a positive amount and a transfer reference.'},400);
  try{await db.batch([db.prepare('INSERT INTO payouts(id,amount,reference,created,live) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),data.amount,data.reference.trim(),now,data.live===0?0:1),db.prepare('INSERT INTO admin_audit(id,action,detail,created) VALUES(?,?,?,?)').bind(crypto.randomUUID(),'record_payout',JSON.stringify({amount:data.amount,reference:data.reference.trim(),live:data.live}),now)]);}catch{return privateJson({error:'That transfer reference is already recorded, or the database is unavailable.'},409);}
 }else if(data.action==='refund_units'){
  const order=await db.prepare('SELECT o.quantity,o.total,COALESCE(r.amount,0) amount FROM orders o LEFT JOIN refunds r ON o.payment_intent=r.payment_intent WHERE o.id=?').bind(String(data.order)).first<{quantity:number;total:number;amount:number}>();
  if(!order || order.amount<=0 || order.amount>=order.total || !Number.isInteger(data.units) || data.units<0 || data.units>order.quantity)return privateJson({error:'Invalid refund allocation.'},400);
  await db.batch([db.prepare('UPDATE orders SET refunded_units=?,reviewed_refund=? WHERE id=?').bind(data.units,order.amount,data.order),db.prepare('INSERT INTO admin_audit(id,action,detail,created) VALUES(?,?,?,?)').bind(crypto.randomUUID(),'refund_units',JSON.stringify({order:data.order,units:data.units,refundAmount:order.amount}),now)]);
 }else return privateJson({error:'Unknown action.'},400);
 return privateJson({ok:true});
}
