import 'server-only';
import { drizzle } from 'drizzle-orm/libsql';
import { getDatabaseClient } from '@/lib/admin/database-client';
import * as schema from './schema';
export function getDb() { return drizzle(getDatabaseClient(), { schema }); }
