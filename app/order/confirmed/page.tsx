import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PurchaseTracker } from "@/components/cart/PurchaseTracker";
import { getCommerceConfig } from "@/config/commerce.server";
import { site } from "@/config/site";
import { getStripe } from "@/lib/checkout/stripe.server";
import { formatMoney, money } from "@/lib/money";
import { isPaidStoreSession } from "@/lib/checkout/session";
import { database } from "@/lib/admin/db.server";
import { fulfillmentLabels } from "@/lib/admin/fulfillment";

export const metadata: Metadata = { title: "Order received", robots: { index: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function formatIsoDate(iso: string | undefined) {
  if (!iso) return null;
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric" });
}

async function Confirmation({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).session_id;
  const sessionId = typeof raw === "string" && /^cs_[A-Za-z0-9_]+$/.test(raw) ? raw : null;
  if (getCommerceConfig().mode === "demo" || !sessionId) notFound();

  const session = await getStripe()
    .checkout.sessions.retrieve(sessionId, { expand: ["line_items"] })
    .catch(() => null);
  // Only a verified, paid session produces a confirmation.
  if (!session || !isPaidStoreSession(session, getCommerceConfig().mode)) {
    notFound();
  }

  const items = session.line_items?.data ?? [];
  const earliest = formatIsoDate(session.metadata?.promised_arrival_earliest);
  const latest = formatIsoDate(session.metadata?.promised_arrival_latest);
  const total = money(session.amount_total ?? 0);
  const order = await database().prepare('SELECT fulfillment,carrier,tracking_number,tracking_url FROM orders WHERE id=?').bind(session.id).first<{fulfillment:string;carrier:string|null;tracking_number:string|null;tracking_url:string|null}>();

  return (
    <>
      <PurchaseTracker
        payload={{
          transaction_id: session.id,
          currency: (session.currency ?? "usd").toUpperCase(),
          value: (session.amount_total ?? 0) / 100,
          shipping: (session.total_details?.amount_shipping ?? 0) / 100,
          tax: (session.total_details?.amount_tax ?? 0) / 100,
          items: items.map((li) => ({ item_id: li.price?.product?.toString() ?? li.id, item_name: li.description ?? "Hat", quantity: li.quantity ?? 1 })),
        }}
      />
      <p className="eyebrow text-green">Order received</p>
      <h1 className="display mt-4 text-5xl sm:text-6xl">Thank you. Your order is in.</h1>
      <p className="mt-5 max-w-xl text-ink-soft">
        Your payment was confirmed. Keep this page for your order reference and tracking updates. Your order will be prepared by our fulfillment partner and shipped to you.
      </p>
      <p className="mt-4 text-sm break-all">Order reference: <strong>{session.id.slice(-12)}</strong></p>
      {session.metadata?.delivery_business_days && <p className="mt-3 text-sm">Delivery estimate at purchase: {session.metadata.delivery_business_days.replace('-', '–')} business days, including production.</p>}
      <div className="mt-6 border hairline p-4 text-sm"><p>Status: <strong>{order ? (fulfillmentLabels[order.fulfillment as keyof typeof fulfillmentLabels] ?? 'Preparing your order') : 'Payment received; preparing your order'}</strong></p>{order?.tracking_number && <p className="mt-2">{order.carrier}: {order.tracking_number}</p>}{order?.tracking_url && <a className="link inline-block mt-2" href={order.tracking_url} target="_blank" rel="noreferrer">Track your package</a>}</div>
      {earliest && latest && (
        <p className="mt-6 border-l-[3px] border-green bg-green-tint px-4 py-3 text-sm">
          Estimated arrival when you ordered: <strong>{earliest} – {latest}</strong>. We&apos;ll email you if this changes.
        </p>
      )}
      <ul className="mt-8 max-w-xl divide-y divide-line border-y hairline">
        {items.map((li) => (
          <li key={li.id} className="flex justify-between gap-4 py-3 text-sm">
            <span>
              {li.description} × {li.quantity}
            </span>
            <span className="tabular-nums">{formatMoney(money(li.amount_total))}</span>
          </li>
        ))}
        <li className="flex justify-between gap-4 py-3 font-semibold">
          <span>Total paid</span>
          <span className="tabular-nums">{formatMoney(total)}</span>
        </li>
      </ul>
      <p className="mt-8 text-sm text-ink-soft">
        Questions? {site.support.email ? <a className="link text-ink" href={`mailto:${site.support.email}`}>{site.support.email}</a> : <Link className="link text-ink" href="/help">Contact us</Link>}
      </p>
    </>
  );
}

export default function OrderConfirmedPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="container-site py-14 md:py-20">
      <Suspense fallback={<p className="text-ink-soft">Confirming your order…</p>}>
        <Confirmation searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
