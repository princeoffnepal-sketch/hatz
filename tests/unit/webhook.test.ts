import { describe,it,expect,vi,beforeEach } from 'vitest';
import Stripe from 'stripe';
const mocks=vi.hoisted(()=>({paid:vi.fn(),refund:vi.fn(),dispute:vi.fn(),claim:vi.fn(),finish:vi.fn(),belongs:vi.fn()}));
vi.mock('@/config/commerce.server',()=>({getCommerceConfig:()=>({mode:'stripe-test',stripe:{secretKey:'sk_test_local_fixture',webhookSecret:'whsec_local_fixture'}})}));
vi.mock('@/lib/checkout/stripe.server',()=>({getStripe:()=>new Stripe('sk_test_local_fixture')}));
vi.mock('@/lib/fulfillment/orders.server',()=>({handlePaidCheckout:mocks.paid,handleRefund:mocks.refund}));
vi.mock('@/lib/admin/ledger.server',()=>({recordDispute:mocks.dispute}));
vi.mock('@/lib/checkout/webhook.server',()=>({claimEvent:mocks.claim,finishEvent:mocks.finish,isHatzPayment:mocks.belongs}));
import { POST } from '@/app/api/stripe/webhook/route';
const stripe=new Stripe('sk_test_local_fixture');
function request(type:string,object:object,signed=true){const body=JSON.stringify({id:'evt_local',type,created:1700000000,livemode:false,data:{object}});const signature=stripe.webhooks.generateTestHeaderString({payload:body,secret:'whsec_local_fixture'});return new Request('https://example.com/api/stripe/webhook',{method:'POST',body,headers:signed?{'stripe-signature':signature}:{}});}
beforeEach(()=>{vi.clearAllMocks();mocks.claim.mockResolvedValue('claimed');mocks.finish.mockResolvedValue(undefined);mocks.belongs.mockResolvedValue(true);mocks.paid.mockResolvedValue(undefined);});
describe('Stripe webhook trust boundary',()=>{
 it('rejects unsigned events',async()=>expect((await POST(request('checkout.session.completed',{payment_status:'paid',metadata:{store:'exclusive-hatz'}},false))).status).toBe(400));
 it('rejects a forged signature',async()=>{const req=request('checkout.session.completed',{});req.headers.set('stripe-signature','forged');expect((await POST(req)).status).toBe(400);expect(mocks.paid).not.toHaveBeenCalled();});
 it('ignores unpaid checkout completions',async()=>{await POST(request('checkout.session.completed',{payment_status:'unpaid'}));expect(mocks.paid).not.toHaveBeenCalled();});
 it('routes a verified paid session',async()=>{expect((await POST(request('checkout.session.completed',{id:'cs_local',payment_status:'paid',metadata:{store:'exclusive-hatz'}}))).status).toBe(200);expect(mocks.paid).toHaveBeenCalledOnce();});
 it('routes delayed successful payments',async()=>{await POST(request('checkout.session.async_payment_succeeded',{payment_status:'paid',metadata:{store:'exclusive-hatz'}}));expect(mocks.paid).toHaveBeenCalledOnce();});
 it('routes refunds',async()=>{await POST(request('charge.refunded',{id:'ch_local'}));expect(mocks.refund).toHaveBeenCalledOnce();});
 it('ignores unrelated paid storefront sessions',async()=>{await POST(request('checkout.session.completed',{payment_status:'paid',metadata:{store:'mogfit'}}));expect(mocks.paid).not.toHaveBeenCalled();});
 it('acknowledges already processed deliveries without repeating work',async()=>{mocks.claim.mockResolvedValue('done');await POST(request('checkout.session.completed',{payment_status:'paid',metadata:{store:'exclusive-hatz'}}));expect(mocks.paid).not.toHaveBeenCalled();});
 it('retries after processing fails instead of losing the order',async()=>{mocks.paid.mockRejectedValueOnce(new Error('database unavailable'));expect((await POST(request('checkout.session.completed',{payment_status:'paid',metadata:{store:'exclusive-hatz'}}))).status).toBe(503);expect(mocks.finish).toHaveBeenCalledWith('evt_local',false);});
 it('ignores refunds belonging to Mogfit app payments',async()=>{mocks.belongs.mockResolvedValue(false);await POST(request('charge.refunded',{id:'ch_other'}));expect(mocks.refund).not.toHaveBeenCalled();});
 it('routes dispute updates with event time',async()=>{await POST(request('charge.dispute.closed',{id:'dp_local',status:'won'}));expect(mocks.dispute).toHaveBeenCalledWith({id:'dp_local',status:'won'},1700000000);});
});
