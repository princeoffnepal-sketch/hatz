export const COMMISSION_PER_HAT=700;
export type LedgerOrder={id:string;payment_intent:string;created:number;live:number;currency:string;subtotal:number;total:number;quantity:number;items:string;commission_rate:number;fulfillment:string;refund_amount:number;refunded_units:number|null;reviewed_refund:number|null;dispute_status?:string|null};
/** Partial refunds do not identify returned hats. Hold commission until allocated by an admin. */
export function commissionFor(order:LedgerOrder){
 const gross=order.quantity*order.commission_rate;
 if(order.dispute_status && !['won','warning_closed'].includes(order.dispute_status))return {gross,earned:0,held:gross,reversed:0,review:false,netUnits:0};
 if(order.refund_amount>=order.total && order.total>0)return {gross,earned:0,held:0,reversed:gross,review:false,netUnits:0};
 if(order.refund_amount>0 && (order.refunded_units===null || order.reviewed_refund!==order.refund_amount))return {gross,earned:0,held:gross,reversed:0,review:true,netUnits:0};
 const units=Math.max(0,order.quantity-(order.refunded_units??0));
 return {gross,earned:units*order.commission_rate,held:0,reversed:gross-units*order.commission_rate,review:false,netUnits:units};
}
