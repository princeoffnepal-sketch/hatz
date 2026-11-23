import { readObject,RequestError } from '@/lib/security';
import { isAdmin,privateJson,sameOrigin } from '@/lib/admin/auth.server';
import { database } from '@/lib/admin/db.server';
import { validateFulfillment } from '@/lib/admin/fulfillment';
export async function POST(request:Request){
 if(!sameOrigin(request) || !await isAdmin())return privateJson({error:'Access denied.'},403);
 let data;try{data=await readObject(request);}catch(error){return privateJson({error:error instanceof RequestError?error.message:'Invalid request.'},error instanceof RequestError?error.status:400);}
 const now=Math.floor(Date.now()/1000),db=database();
 if(data.action==='fulfillment'){
  const order=await db.prepare('SELECT id FROM orders WHERE id=?').bind(String(data.order)).first();
  if(!order)return privateJson({error:'Order not found.'},404);
  let update;try{update=validateFulfillment(data);}catch(e){return privateJson({error:(e as Error).message},400);}
  await db.batch([db.prepare('UPDATE orders SET fulfillment=?,carrier=?,tracking_number=?,tracking_url=? WHERE id=?').bind(update.status,update.carrier,update.tracking,update.url,String(data.order)),db.prepare('INSERT INTO admin_audit(id,action,detail,created) VALUES(?,?,?,?)').bind(crypto.randomUUID(),'fulfillment',JSON.stringify({order:data.order,...update}),now)]);
 }else if(data.action==='owner_payment'){
  if(!Number.isSafeInteger(data.amount) || Number(data.amount)<=0 || Number(data.amount)>100000000 || typeof data.reference!=='string' || data.reference.trim().length<3 || data.reference.length>120 || typeof data.live!=='number' || ![0,1].includes(data.live))return privateJson({error:'Enter a positive amount and a transfer reference.'},400);
  try{await db.batch([db.prepare('INSERT INTO owner_payments(id,amount,reference,created,live) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),Number(data.amount),data.reference.trim(),now,Number(data.live)),db.prepare('INSERT INTO admin_audit(id,action,detail,created) VALUES(?,?,?,?)').bind(crypto.randomUUID(),'record_owner_payment',JSON.stringify({amount:data.amount,reference:data.reference.trim(),live:data.live}),now)]);}catch{return privateJson({error:'That transfer reference is already recorded, or the database is unavailable.'},409);}
 }else if(data.action==='payout'){
  if(!Number.isSafeInteger(data.amount) || Number(data.amount)<=0 || Number(data.amount)>100000000 || typeof data.reference!=='string' || data.reference.trim().length<3 || data.reference.length>120)return privateJson({error:'Enter a positive amount and a transfer reference.'},400);
  try{await db.batch([db.prepare('INSERT INTO payouts(id,amount,reference,created,live) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),Number(data.amount),data.reference.trim(),now,data.live===0?0:1),db.prepare('INSERT INTO admin_audit(id,action,detail,created) VALUES(?,?,?,?)').bind(crypto.randomUUID(),'record_payout',JSON.stringify({amount:data.amount,reference:data.reference.trim(),live:data.live}),now)]);}catch{return privateJson({error:'That transfer reference is already recorded, or the database is unavailable.'},409);}
 }else if(data.action==='refund_units'){
  const order=await db.prepare('SELECT o.quantity,o.total,COALESCE(r.amount,0) amount FROM orders o LEFT JOIN refunds r ON o.payment_intent=r.payment_intent WHERE o.id=?').bind(String(data.order)).first<{quantity:number;total:number;amount:number}>();
  if(!order || order.amount<=0 || order.amount>=order.total || !Number.isInteger(data.units) || Number(data.units)<0 || Number(data.units)>order.quantity)return privateJson({error:'Invalid refund allocation.'},400);
  await db.batch([db.prepare('UPDATE orders SET refunded_units=?,reviewed_refund=? WHERE id=?').bind(Number(data.units),order.amount,String(data.order)),db.prepare('INSERT INTO admin_audit(id,action,detail,created) VALUES(?,?,?,?)').bind(crypto.randomUUID(),'refund_units',JSON.stringify({order:data.order,units:data.units,refundAmount:order.amount}),now)]);
 }else return privateJson({error:'Unknown action.'},400);
 return privateJson({ok:true});
}
