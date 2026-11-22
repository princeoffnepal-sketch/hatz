import { createClient, type Client, type InValue } from '@libsql/client';

/** Thin SQLite adapter: retains parameterized statements and atomic write batches. */
export function createDatabase(client: Client) {
  class Statement {
    constructor(readonly sql: string, readonly args: InValue[] = []) {}
    bind(...args: InValue[]) { return new Statement(this.sql, args); }
    async first<T = Record<string, unknown>>(): Promise<T | null> {
      const result = await client.execute({ sql: this.sql, args: this.args });
      return (result.rows[0] as unknown as T) ?? null;
    }
    async all<T = Record<string, unknown>>() {
      const result = await client.execute({ sql: this.sql, args: this.args });
      return { results: result.rows as unknown as T[] };
    }
    async run() { return client.execute({ sql: this.sql, args: this.args }); }
  }
  return {
    prepare: (sql: string) => new Statement(sql),
    batch: (statements: Statement[]) => client.batch(statements.map(s => ({ sql: s.sql, args: s.args })), 'write'),
  };
}

let client: Client | undefined;
export function databaseConfigured() { return Boolean(process.env.TURSO_DATABASE_URL); }
export function getDatabaseClient() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN, then run npm run db:migrate.');
  if (process.env.VERCEL && /^(file:|:memory:)/.test(url)) {
    throw new Error('Vercel requires a remote database. Local SQLite is for development only.');
  }
  if (!client) client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return client;
}
