"use client";

import Link from "next/link";
import { useEffect, type ComponentProps } from "react";
import { track, type AnalyticsItem } from "@/lib/analytics";

/** Fires view_item_list once per mount. */
export function ListViewTracker({ listId, items }: { listId: string; items: AnalyticsItem[] }) {
  const key = items.map((i) => i.item_id).join(",");
  useEffect(() => {
    track("view_item_list", { item_list_id: listId, items });
    // Re-fire only when the list contents change (e.g. new sort/filter).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId, key]);
  return null;
}

/** Link that records select_item for on-site product clickthrough. */
export function ProductLink({
  listId,
  item,
  ...props
}: ComponentProps<typeof Link> & { listId: string; item: AnalyticsItem }) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        track("select_item", { item_list_id: listId, items: [item] });
        props.onClick?.(event);
      }}
    />
  );
}
