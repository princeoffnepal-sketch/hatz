import { describe,it,expect,vi,beforeEach } from 'vitest';
import { catalog } from '@/data/catalog';
import { delivery } from '@/config/delivery';
import { buildCart } from '@/lib/cart/core';
import { isPaidStoreSession } from '@/lib/checkout/session';
const mocks=vi.hoisted(()=>({create:vi.fn()}));
vi.mock('@/config/commerce.server',()=>({getCommerceConfig:()=>({mode:'live',siteUrl:'https://hatz.example',stripe:{secretKey:'sk_test_fixture',automaticTax:true}})}));
vi.mock('stripe',()=>({default:class { checkout={sessions:{create:mocks.create}}; }}));
import { createCheckoutSession } from '@/lib/checkout/stripe.server';
beforeEach(()=>{vi.clearAllMocks();mocks.create.mockResolvedValue({url:'https://checkout.stripe.com/example'});});
describe('hosted checkout parameters',()=>{
 it.each([[1,750,700],[2,0,1400]])('prices %i hats and uses the same shipping threshold',async(quantity,shipping,commission)=>{
  const cart=buildCart([{v:catalog[0].variants[0].id,q:quantity}],catalog,delivery);
  await createCheckoutSession(cart);
  const params=mocks.create.mock.calls[0][0];
  expect(params.line_items[0].price_data.unit_amount).toBe(5500);
  expect(params.line_items[0].quantity).toBe(quantity);
  expect(params.allowed_payment_method_types).toEqual(['card','link']);
  expect(params.automatic_tax).toEqual({enabled:true});
  expect(params.line_items[0].price_data.tax_behavior).toBe('exclusive');
  expect(params.line_items[0].price_data.product_data.tax_code).toBe('txcd_30060006');
  expect(params.shipping_options[0].shipping_rate_data.tax_behavior).toBe('exclusive');
  expect(params.shipping_options[0].shipping_rate_data.fixed_amount.amount).toBe(shipping);
  expect(Number(params.payment_intent_data.metadata.commission_per_hat_cents)*quantity).toBe(commission);
  expect(params.shipping_options[0].shipping_rate_data.delivery_estimate).toEqual({minimum:{unit:'business_day',value:3},maximum:{unit:'business_day',value:5}});
  expect(params.metadata.promised_arrival_earliest).toBe('');
  expect(params.custom_text.submit.message).toContain('MOGFIT');
  expect(params.shipping_address_collection.allowed_countries).toEqual(['US']);
 });
 it('charges both price tiers correctly with free shipping and a fixed $7 per hat',async()=>{
  const cart=buildCart([{v:catalog[0].variants[0].id,q:1},{v:catalog[2].variants[0].id,q:1}],catalog,delivery);
  await createCheckoutSession(cart);
  const params=mocks.create.mock.calls[0][0];
  expect(params.line_items.map((line:{price_data:{unit_amount:number}})=>line.price_data.unit_amount)).toEqual([5500,5000]);
  expect(cart.subtotal.amount).toBe(10500);
  expect(params.shipping_options[0].shipping_rate_data.fixed_amount.amount).toBe(0);
  expect(params.payment_intent_data.metadata.commission_per_hat_cents).toBe('700');
  expect(params.success_url).toBe('https://hatz.example/checkout/complete?session_id={CHECKOUT_SESSION_ID}');
  expect(params.cancel_url).toBe('https://hatz.example/cart?checkout=cancelled');
 });
 it('does not accept a paid Mogfit session belonging to another storefront',()=>{
  const paid={status:'complete' as const,payment_status:'paid' as const,livemode:true,metadata:{store:'mogfit'}};
  expect(isPaidStoreSession(paid,'live')).toBe(false);
  expect(isPaidStoreSession({...paid,metadata:{store:'exclusive-hatz'}},'live')).toBe(true);
  expect(isPaidStoreSession({...paid,metadata:{store:'exclusive-hatz'},livemode:false},'live')).toBe(false);
  expect(isPaidStoreSession({...paid,metadata:{store:'exclusive-hatz'}},'demo')).toBe(false);
 });
});
