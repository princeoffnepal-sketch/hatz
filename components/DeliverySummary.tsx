"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { delivery } from "@/config/delivery";
import { policies } from "@/config/policies";
import { estimateDelivery, formatCalendarDate } from "@/lib/delivery";
import { deliveryCopy, madeToOrderLine } from "@/lib/disclosure";
import type { Product } from "@/lib/types";
import { Icon } from "./ui/Icon";

/**
 * Made-to-order, production, shipping and returns summary shown before the
 * Add to bag button. Arrival dates are computed in the browser from the
 * configured calendars (so they reflect the visitor's "now") and only when
 * the delivery configuration is complete.
 */
export function DeliverySummary({
  product,
  compact = false,
  id,
}: {
  product?: Pick<Product, "production"> | null;
  compact?: boolean;
  id?: string;
}) {
  const copy = deliveryCopy();
  const [arrival, setArrival] = useState<string | null>(null);

  useEffect(() => {
    if (!copy.configured) return;
    const estimate = estimateDelivery(delivery, delivery.services[0].id, new Date());
    if (estimate) {
      // Client-only: depends on the current time, so it can't be prerendered.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setArrival(`${formatCalendarDate(estimate.arrival.earliest)} – ${formatCalendarDate(estimate.arrival.latest)}`);
    }
  }, [copy.configured]);

  return (
    <div id={id} className="border-y hairline py-4 text-sm leading-relaxed">
      <p className="flex gap-2.5 font-semibold text-ink">
        <Icon name="needle" size={18} className="mt-0.5 shrink-0 text-green" />
        {madeToOrderLine(product)}
      </p>
      <ul className="mt-2 space-y-1.5 pl-[1.75rem] text-ink-soft">
        {copy.configured && <li>{copy.production}</li>}
        <li>{copy.shipping}</li>
        {copy.configured && arrival && (
          <li className="text-ink">
            Estimated arrival (U.S.): <strong className="font-semibold">{arrival}</strong>
          </li>
        )}
        {copy.configured && copy.splitNote && <li>{copy.splitNote}</li>}
        {copy.configured && copy.expressNote && <li>{copy.expressNote}</li>}
        {!compact && <li>{policies.returns.summary}</li>}
      </ul>
      {!copy.configured && (
        <p className="mt-3 pl-[1.75rem] text-xs text-ink-soft">
          Shipping time starts after dispatch. Production time is additional; orders are not open yet.
        </p>
      )}
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 pl-[1.75rem] text-xs">
        <Link href="/shipping" className="link">
          Shipping &amp; delivery
        </Link>
        <Link href="/returns" className="link">
          Returns &amp; cancellations
        </Link>
      </p>
    </div>
  );
}
