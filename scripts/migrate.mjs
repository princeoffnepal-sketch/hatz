import { createClient } from '@libsql/client';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const url = process.env.TURSO_DATABASE_URL;
if (!url) throw new Error('TURSO_DATABASE_URL is required. Set it in .env.local or the shell environment.');
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
try {
  await client.execute('CREATE TABLE IF NOT EXISTS app_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL)');
  const directory = fileURLToPath(new URL('../drizzle/', import.meta.url));
  for (const name of (await readdir(directory)).filter(n => n.endsWith('.sql')).sort()) {
    const sql = await readFile(`${directory}/${name}`, 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const transaction = await client.transaction('write');
    try {
      const prior = await transaction.execute({ sql: 'SELECT checksum FROM app_migrations WHERE name=?', args: [name] });
      if (prior.rows.length) {
        if (prior.rows[0].checksum !== checksum) throw new Error(`Previously applied migration changed: ${name}`);
      } else {
        for (const statement of sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)) await transaction.execute(statement);
        await transaction.execute({ sql: 'INSERT INTO app_migrations(name,checksum) VALUES(?,?)', args: [name, checksum] });
        console.log(`Applied ${name}`);
      }
      await transaction.commit();
    } catch (error) { await transaction.rollback(); throw error; }
    finally { transaction.close(); }
  }
  console.log('Database migrations are up to date.');
} finally { client.close(); }
