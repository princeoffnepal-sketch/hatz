import { createClient } from '@libsql/client';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { createDatabase } from '@/lib/admin/database-client';
import { readdirSync, readFileSync } from 'node:fs';

describe('Vercel database adapter', () => {
  let client: ReturnType<typeof createClient>;
  let db: ReturnType<typeof createDatabase>;
  beforeEach(async () => {
    client = createClient({ url: ':memory:' });
    db = createDatabase(client);
    for (const file of readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort()) {
      for (const statement of readFileSync(`drizzle/${file}`, 'utf8').split('--> statement-breakpoint').filter(s => s.trim())) await client.execute(statement);
    }
  });
  afterEach(() => client.close());
  it('runs existing SQLite schema and bound statements without changing user text', async () => {
    const email = "o'connor@example.com";
    await db.prepare('INSERT INTO submissions(id,kind,email,created) VALUES(?,?,?,?)').bind('one','newsletter',email,1).run();
    expect(await db.prepare('SELECT email FROM submissions WHERE id=?').bind('one').first()).toMatchObject({ email });
    expect((await db.prepare('SELECT id FROM submissions').all()).results).toHaveLength(1);
    expect(await db.prepare('SELECT id FROM submissions WHERE id=?').bind('absent').first()).toBeNull();
  });
  it('rolls back an audit batch if a unique transfer reference fails', async () => {
    const payout = (id:string) => db.prepare('INSERT INTO payouts(id,amount,reference,created,live) VALUES(?,?,?,?,?)').bind(id,700,'same-reference',1,0);
    await payout('a').run();
    await expect(db.batch([
      db.prepare('INSERT INTO admin_audit(id,action,detail,created) VALUES(?,?,?,?)').bind('audit','record_payout','{}',1),
      payout('b'),
    ])).rejects.toThrow();
    expect((await db.prepare('SELECT id FROM admin_audit').all()).results).toEqual([]);
    expect((await db.prepare('SELECT id FROM payouts').all()).results).toHaveLength(1);
  });
  it('atomically increments rate limits and returns the new count', async () => {
    const increment = () => db.prepare('INSERT INTO rate_limits(id,count,expires) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind('login:1',10).first<{count:number}>();
    expect(await increment()).toEqual({ count: 1 });
    expect(await increment()).toEqual({ count: 2 });
  });
});
