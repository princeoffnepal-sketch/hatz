import { describe,it,expect } from 'vitest';
import { commissionFor,type LedgerOrder } from '@/lib/admin/commission';
const order:LedgerOrder={id:'cs_1',payment_intent:'pi_1',created:1,live:1,currency:'usd',subtotal:11000,total:11500,quantity:2,items:'[]',commission_rate:700,fulfillment:'awaiting_supplier',refund_amount:0,refunded_units:null,reviewed_refund:null};
describe('per-hat revenue share',()=>{
 it('earns $14 for two hats regardless of product price',()=>expect(commissionFor(order).earned).toBe(1400));
 it('holds disputed orders',()=>expect(commissionFor({...order,dispute_status:'needs_response'})).toMatchObject({earned:0,held:1400}));
 it('restores commission when a dispute is won',()=>expect(commissionFor({...order,dispute_status:'won'}).earned).toBe(1400));
 it('fully reverses a full refund',()=>expect(commissionFor({...order,refund_amount:11500})).toMatchObject({earned:0,reversed:1400,held:0}));
 it('holds all commission when a partial refund has no unit allocation',()=>expect(commissionFor({...order,refund_amount:4500})).toMatchObject({earned:0,held:1400,review:true}));
 it('reverses one refunded hat when allocation matches the current refund',()=>expect(commissionFor({...order,refund_amount:4500,refunded_units:1,reviewed_refund:4500})).toMatchObject({earned:700,reversed:700,review:false}));
 it('requires review again if another refund arrives',()=>expect(commissionFor({...order,refund_amount:6500,refunded_units:1,reviewed_refund:4500})).toMatchObject({earned:0,held:1400,review:true}));
 it('retains commission for an allocated shipping-only refund',()=>expect(commissionFor({...order,refund_amount:500,refunded_units:0,reviewed_refund:500}).earned).toBe(1400));
});
