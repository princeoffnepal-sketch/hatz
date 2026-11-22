import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

/**
 * The full cart blocks on the server instead of streaming, so its contents are
 * in the initial HTML and it keeps working if client scripts fail to load.
 */
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function CheckoutNotice({ searchParams }: { searchParams: SearchParams }) {
  const status = (await searchParams).checkout;
  if (status === "cancelled") {
    return <p className="notice mb-8">Checkout was cancelled. Your bag is saved, and you haven&apos;t been charged.</p>;
  }
  if (status === "incomplete") {
    return <p className="notice mb-8">We couldn&apos;t confirm a completed payment. Your bag is saved. If you were charged, please contact us.</p>;
  }
  return null;
}

/** Full cart page. Server-rendered with plain forms, so it works even if the drawer script fails. */
export default async function CartPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="container-site pt-10 md:pt-14">
      <h1 className="display mb-8 text-5xl sm:text-6xl">Your bag</h1>
      <CheckoutNotice searchParams={searchParams} />
      <CartView variant="page" />
    </div>
  );
}
