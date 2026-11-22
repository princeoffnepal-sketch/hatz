import { describe,it,expect,vi,afterEach } from 'vitest';
import {pbkdf2Sync} from 'node:crypto';
import {verifyPassword} from '@/lib/admin/crypto';
const salt='abcdef0123456789abcdef0123456789';
const hash='pbkdf2$600000$'+salt+'$'+pbkdf2Sync('public-test-fixture',salt,600000,32,'sha256').toString('hex');
afterEach(()=>vi.restoreAllMocks());
describe('admin password verification',()=>{
 it('accepts the correct password using native PBKDF2',async()=>expect(await verifyPassword('public-test-fixture',hash)).toBe(true));
 it('rejects the wrong password',async()=>expect(await verifyPassword('wrong',hash)).toBe(false));
 it('preserves 600000 iterations on Workers when native derivation is unsupported',async()=>{
  vi.spyOn(crypto.subtle,'deriveBits').mockRejectedValueOnce(new DOMException('Platform limit','NotSupportedError'));
  expect(await verifyPassword('public-test-fixture',hash)).toBe(true);
 });
 it('does not fall back on unrelated crypto failures',async()=>{
  vi.spyOn(crypto.subtle,'deriveBits').mockRejectedValueOnce(new Error('Unrelated failure'));
  await expect(verifyPassword('public-test-fixture',hash)).rejects.toThrow('Unrelated failure');
 });
 it('rejects malformed hash configuration',async()=>expect(await verifyPassword('anything','not-a-hash')).toBe(false));
});
