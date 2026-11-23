import type Stripe from 'stripe';
import { recordDispute } from '@/lib/admin/ledger.server';
import { getCommerceConfig } from '@/config/commerce.server';
import { getStripe } from '@/lib/checkout/stripe.server';
import { handlePaidCheckout, handleRefund } from '@/lib/fulfillment/orders.server';
import { claimEvent, finishEvent, isHatzPayment } from '@/lib/checkout/webhook.server';
import { readBody,RequestError } from '@/lib/security';
const supported=new Set(['checkout.session.completed','checkout.session.async_payment_succeeded','charge.refunded','charge.dispute.created','charge.dispute.updated','charge.dispute.closed']);
export async function POST(request:Request){
 const {stripe,mode}=getCommerceConfig();
 if(!stripe.secretKey || !stripe.webhookSecret)return new Response('Webhook unavailable',{status:503});
 const signature=request.headers.get('stripe-signature');
 if(!signature)return new Response('Missing signature',{status:400});
 let event:Stripe.Event;
 try {event=await getStripe().webhooks.constructEventAsync(await readBody(request,262144),signature,stripe.webhookSecret);}
 catch(error){return new Response('Invalid webhook',{status:error instanceof RequestError?error.status:400});}
 if(mode==='demo' || event.livemode!==(mode==='live') || !supported.has(event.type))return Response.json({received:true});
 let claimed=false;
 try{
  const state=await claimEvent(event.id);
  if(state==='done')return Response.json({received:true});
  if(state==='busy')return new Response('Retry later',{status:503});
  claimed=true;
  switch(event.type){
   case 'checkout.session.completed':
   case 'checkout.session.async_payment_succeeded': {
    const session=event.data.object;
    if(session.payment_status==='paid' && session.metadata?.store==='exclusive-hatz')await handlePaidCheckout(session);
    break;
   }
   case 'charge.refunded': {
    const charge=event.data.object, pi=charge.payment_intent;
    if(await isHatzPayment(typeof pi==='string'?pi:pi?.id??null))await handleRefund(charge);
    break;
   }
   case 'charge.dispute.created':
   case 'charge.dispute.updated':
   case 'charge.dispute.closed': {
    const dispute=event.data.object,pi=dispute.payment_intent;
    if(await isHatzPayment(typeof pi==='string'?pi:pi?.id??null))await recordDispute(dispute,event.created);
    break;
   }
  }
  await finishEvent(event.id,true);
  return Response.json({received:true});
 }catch(error){
  if(claimed)await finishEvent(event.id,false).catch(()=>{});
  console.error('[stripe] Webhook processing failed',error instanceof Error?error.name:'UnknownError');
  return new Response('Temporarily unavailable; retry this event',{status:503});
 }
}
