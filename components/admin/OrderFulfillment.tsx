'use client';
import type { LedgerOrder } from '@/lib/admin/commission';
import { fulfillmentLabels } from '@/lib/admin/fulfillment';
export function OrderFulfillment({ order, busy, save }: { order: LedgerOrder; busy: boolean; save: (payload: Record<string, unknown>) => Promise<boolean> }) {
  let address: Record<string, string | null> = {};
  let items: {name?: string; quantity?: number; variant?: string}[] = [];
  try { address = JSON.parse(order.shipping_address || '{}'); } catch {}
  try { items = JSON.parse(order.items); } catch {}
  return <details className="min-w-52"><summary className="cursor-pointer link">{fulfillmentLabels[order.fulfillment as keyof typeof fulfillmentLabels] ?? order.fulfillment}</summary>
    <div className="space-y-3 py-4 max-w-sm">
      <p className="font-semibold">{order.customer_name || 'Customer details unavailable'}</p>
      {order.customer_email && <a className="link break-all" href={`mailto:${order.customer_email}`}>{order.customer_email}</a>}
      <address className="not-italic whitespace-pre-line">{[address.line1,address.line2,[address.city,address.state,address.postal_code].filter(Boolean).join(', '),address.country].filter(Boolean).join('\n')}</address>
      <ul className="space-y-1">{items.map((item,i)=><li key={i}>{item.quantity} × {item.name}<span className="block text-xs text-ink-soft">{item.variant}</span></li>)}</ul>
      <form className="space-y-2" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);await save({action:'fulfillment',order:order.id,status:f.get('status'),carrier:f.get('carrier'),tracking:f.get('tracking'),url:f.get('url')});}}>
        <label className="block text-xs">Status<select name="status" defaultValue={order.fulfillment} className="field mt-1">{Object.entries(fulfillmentLabels).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
        <label className="block text-xs">Carrier<input name="carrier" defaultValue={order.carrier??''} maxLength={80} className="field mt-1" /></label>
        <label className="block text-xs">Tracking number<input name="tracking" defaultValue={order.tracking_number??''} maxLength={160} className="field mt-1" /></label>
        <label className="block text-xs">Tracking link (HTTPS)<input name="url" type="url" defaultValue={order.tracking_url??''} maxLength={500} className="field mt-1" /></label>
        <button disabled={busy} className="btn btn-outline">Save fulfillment</button>
      </form>
      <a className="link block" href={`/order/confirmed?session_id=${encodeURIComponent(order.id)}`} target="_blank" rel="noreferrer">Customer order & tracking page</a>
      <p className="text-xs text-ink-soft">Saving updates the order page. Send tracking to the customer manually; email notifications are not connected.</p>
    </div>
  </details>;
}
