export const fulfillmentLabels = { awaiting_supplier: 'Awaiting fulfillment', in_production: 'In production', shipped: 'Shipped', delivered: 'Delivered' } as const;
export function validateFulfillment(input: Record<string, unknown>) {
  const status = String(input.status ?? '');
  if (!(status in fulfillmentLabels) || !Object.hasOwn(fulfillmentLabels, status)) throw new Error('Choose a valid fulfillment status.');
  const carrier = typeof input.carrier === 'string' ? input.carrier.trim() : '';
  const tracking = typeof input.tracking === 'string' ? input.tracking.trim() : '';
  const url = typeof input.url === 'string' ? input.url.trim() : '';
  if (carrier.length > 80 || tracking.length > 160 || url.length > 500) throw new Error('Tracking details are too long.');
  if ((status === 'shipped' || status === 'delivered') && (!carrier || !tracking)) throw new Error('Add the carrier and tracking number before marking an order shipped.');
  if (url) {
    let parsed: URL;
    try { parsed = new URL(url); } catch { throw new Error('Enter a valid HTTPS tracking link.'); }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('Enter a valid HTTPS tracking link.');
  }
  return { status, carrier: carrier || null, tracking: tracking || null, url: url || null };
}
