import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import {createClient} from '@libsql/client';
import {createDatabase} from '@/lib/admin/database-client';
import {readdirSync,readFileSync} from 'node:fs';
const mocks=vi.hoisted(()=>({db:null as ReturnType<typeof createDatabase>|null,retrieve:vi.fn()}));
vi.mock('@/lib/admin/db.server',()=>({database:()=>mocks.db!}));
vi.mock('@/lib/checkout/stripe.server',()=>({getStripe:()=>({paymentIntents:{retrieve:mocks.retrieve}})}));
import {claimEvent,finishEvent,isHatzPayment} from '@/lib/checkout/webhook.server';
let client:ReturnType<typeof createClient>;
beforeEach(async()=>{client=createClient({url:':memory:'});mocks.db=createDatabase(client);for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())for(const sql of readFileSync(`drizzle/${f}`,'utf8').split('--> statement-breakpoint').filter(s=>s.trim()))await client.execute(sql);});
afterEach(()=>client.close());
describe('durable webhook handling',()=>{
 it('permits one worker, retries failures, and acknowledges completed repeats',async()=>{
  expect(await claimEvent('evt_one')).toBe('claimed');expect(await claimEvent('evt_one')).toBe('busy');
  await finishEvent('evt_one',false);expect(await claimEvent('evt_one')).toBe('claimed');
  await finishEvent('evt_one',true);expect(await claimEvent('evt_one')).toBe('done');
 });
 it('recovers work after a server crash and expired lease',async()=>{
  await claimEvent('evt_crash');await mocks.db!.prepare('UPDATE stripe_events SET lease_until=0 WHERE id=?').bind('evt_crash').run();
  expect(await claimEvent('evt_crash')).toBe('claimed');
 });
 it('preserves out-of-order Hatz refunds but rejects other storefronts',async()=>{
  mocks.retrieve.mockResolvedValue({metadata:{store:'exclusive-hatz'}});expect(await isHatzPayment('pi_hatz')).toBe(true);
  mocks.retrieve.mockResolvedValue({metadata:{store:'mogfit'}});expect(await isHatzPayment('pi_other')).toBe(false);
  expect(await isHatzPayment(null)).toBe(false);
 });
});
