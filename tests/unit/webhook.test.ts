import { describe,it,expect,vi,beforeEach } from 'vitest';
import Stripe from 'stripe';
const mocks=vi.hoisted(()=>({paid:vi.fn(),refund:vi.fn(),dispute:vi.fn()}));
vi.mock('@/config/commerce.server',()=>({getCommerceConfig:()=>({stripe:{secretKey:'sk_test_local_fixture',webhookSecret:'whsec_local_fixture'}})}));
vi.mock('@/lib/checkout/stripe.server',()=>({getStripe:()=>new Stripe('sk_test_local_fixture')}));
vi.mock('@/lib/fulfillment/orders.server',()=>({handlePaidCheckout:mocks.paid,handleRefund:mocks.refund}));
vi.mock('@/lib/admin/ledger.server',()=>({recordDispute:mocks.dispute}));
import { POST } from '@/app/api/stripe/webhook/route';
const stripe=new Stripe('sk_test_local_fixture');
function request(type:string,object:object,signed=true){const body=JSON.stringify({id:'evt_local',type,created:1700000000,data:{object}});const signature=stripe.webhooks.generateTestHeaderString({payload:body,secret:'whsec_local_fixture'});return new Request('https://example.com/api/stripe/webhook',{method:'POST',body,headers:signed?{'stripe-signature':signature}:{}});}
beforeEach(()=>vi.clearAllMocks());
describe('Stripe webhook trust boundary',()=>{
 it('rejects unsigned events',async()=>expect((await POST(request('checkout.session.completed',{payment_status:'paid'},false))).status).toBe(400));
 it('rejects a forged signature',async()=>{const req=request('checkout.session.completed',{});req.headers.set('stripe-signature','forged');expect((await POST(req)).status).toBe(400);expect(mocks.paid).not.toHaveBeenCalled();});
 it('ignores unpaid checkout completions',async()=>{await POST(request('checkout.session.completed',{payment_status:'unpaid'}));expect(mocks.paid).not.toHaveBeenCalled();});
 it('routes a verified paid session',async()=>{expect((await POST(request('checkout.session.completed',{id:'cs_local',payment_status:'paid'}))).status).toBe(200);expect(mocks.paid).toHaveBeenCalledOnce();});
 it('routes delayed successful payments',async()=>{await POST(request('checkout.session.async_payment_succeeded',{payment_status:'paid'}));expect(mocks.paid).toHaveBeenCalledOnce();});
 it('routes refunds',async()=>{await POST(request('charge.refunded',{id:'ch_local'}));expect(mocks.refund).toHaveBeenCalledOnce();});
 it('routes dispute updates with event time',async()=>{await POST(request('charge.dispute.closed',{id:'dp_local',status:'won'}));expect(mocks.dispute).toHaveBeenCalledWith({id:'dp_local',status:'won'},1700000000);});
});
