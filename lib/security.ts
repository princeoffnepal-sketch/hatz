/** Request parsing shared by public endpoints. Bound bytes before parsing JSON. */
export class RequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
export async function readBody(request: Request, maxBytes: number): Promise<string> {
  const declared = request.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) throw new RequestError('Request too large.', 413);
  if (!request.body) return '';
  const reader = request.body.getReader(), decoder = new TextDecoder();
  let size = 0, body = '';
  try {
    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new RequestError('Request too large.', 413); }
      body += decoder.decode(value, {stream:true});
    }
    return body + decoder.decode();
  } finally { reader.releaseLock(); }
}
export async function readObject(request: Request, maxBytes = 4096): Promise<Record<string, unknown>> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new RequestError('Expected JSON.', 415);
  let value: unknown;
  try { value = JSON.parse(await readBody(request,maxBytes)); }
  catch (error) { if (error instanceof RequestError) throw error; throw new RequestError('Invalid JSON.',400); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RequestError('Expected an object.',400);
  return value as Record<string, unknown>;
}
export const SESSION_ID = /^cs_(?:live|test)_[A-Za-z0-9]{16,240}$/;
