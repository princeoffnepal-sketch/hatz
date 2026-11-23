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
  expect(params.line_items[0].price_data.unit_amount).toBe(6500);
  expect(params.line_items[0].quantity).toBe(quantity);
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
 it('does not accept a paid Mogfit session belonging to another storefront',()=>{
  const paid={status:'complete' as const,payment_status:'paid' as const,livemode:true,metadata:{store:'mogfit'}};
  expect(isPaidStoreSession(paid,'live')).toBe(false);
  expect(isPaidStoreSession({...paid,metadata:{store:'exclusive-hatz'}},'live')).toBe(true);
  expect(isPaidStoreSession({...paid,metadata:{store:'exclusive-hatz'},livemode:false},'live')).toBe(false);
  expect(isPaidStoreSession({...paid,metadata:{store:'exclusive-hatz'}},'demo')).toBe(false);
 });
});
