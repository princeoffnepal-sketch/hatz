import { afterEach,beforeEach,describe,it,expect,vi } from 'vitest';
import { createClient } from '@libsql/client';
import { readdirSync,readFileSync } from 'node:fs';
import type Stripe from 'stripe';
import { createDatabase } from '@/lib/admin/database-client';
const mocks=vi.hoisted(()=>({db:null as ReturnType<typeof createDatabase>|null}));
vi.mock('@/lib/admin/db.server',()=>({database:()=>mocks.db!}));
vi.mock('@/lib/checkout/stripe.server',()=>({getStripe:()=>({checkout:{sessions:{async *listLineItems(){yield {description:'Hat',quantity:2,amount_subtotal:13000,price:{product:{metadata:{store:'exclusive-hatz',variant_id:'design-01-as-shown'}}}};}}}})}));
import { recordOrder,recordRefund,dashboard } from '@/lib/admin/ledger.server';
let client:ReturnType<typeof createClient>;
const session=()=>({id:'cs_test_order_fixture',payment_status:'paid',amount_total:13000,amount_subtotal:13000,metadata:{store:'exclusive-hatz'},currency:'usd',payment_intent:'pi_fixture',created:Math.floor(Date.now()/1000),livemode:false,customer_details:{email:'customer@example.test',name:'Test Customer'},collected_information:{shipping_details:{name:'Test Recipient',address:{line1:'123 Test Street',line2:null,city:'Test City',state:'NY',postal_code:'10001',country:'US'}}}} as unknown as Stripe.Checkout.Session);
beforeEach(async()=>{client=createClient({url:':memory:'});mocks.db=createDatabase(client);for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())for(const sql of readFileSync(`drizzle/${f}`,'utf8').split('--> statement-breakpoint').filter(s=>s.trim()))await client.execute(sql);});
afterEach(()=>client.close());
describe('paid order capture and commission',()=>{
 it('records recipient, address and $14 once when webhook and return both process the order',async()=>{
  await recordOrder(session());await recordOrder(session());
  const data=await dashboard(0,30);
  expect(data.orders).toHaveLength(1);
  expect(data.orders[0]).toMatchObject({customer_name:'Test Recipient',customer_email:'customer@example.test',quantity:2,fulfillment:'awaiting_supplier'});
  expect(JSON.parse(data.orders[0].shipping_address!)).toMatchObject({line1:'123 Test Street',country:'US'});
  expect(data.totals.earned).toBe(1400);
 });
 it('does not record unpaid sessions or orders from the other storefront',async()=>{
  await recordOrder({...session(),payment_status:'unpaid'});
  await recordOrder({...session(),metadata:{store:'mogfit'}});
  expect((await dashboard(0,30)).orders).toHaveLength(0);
 });
 it('reverses commission on a full refund without duplicating the order',async()=>{
  await recordOrder(session());
  await recordRefund({payment_intent:'pi_fixture',amount_refunded:13000} as Stripe.Charge);
  expect((await dashboard(0,30)).totals.earned).toBe(0);
 });
 it('keeps owner remittances separate from retained commission',async()=>{
  await recordOrder(session());
  await mocks.db!.prepare('INSERT INTO owner_payments(id,amount,reference,created,live) VALUES(?,?,?,?,?)').bind('owner-transfer',10000,'bank-fixture',1,0).run();
  const data=await dashboard(0,30);
  expect(data.totals.ownerPaid).toBe(10000);
  expect(data.totals.totalEarned).toBe(1400);
  expect(data.payouts).toHaveLength(0);
 });
});
