import { NextResponse, type NextRequest } from "next/server";
import { getCommerceConfig } from "@/config/commerce.server";
import { CART_COOKIE } from "@/lib/cart/server";
import { getStripe } from "@/lib/checkout/stripe.server";
import { isPaidStoreSession } from "@/lib/checkout/session";
import { handlePaidCheckout } from "@/lib/fulfillment/orders.server";

/**
 * Stripe redirects here after payment. We verify the session server-side
 * before clearing the bag and showing a confirmation; a URL alone never
 * produces a success page.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const { mode } = getCommerceConfig();
  const cartUrl = new URL("/cart?checkout=incomplete", request.url);
  if (mode === "demo" || !sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    return NextResponse.redirect(cartUrl);
  }
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (!isPaidStoreSession(session, mode)) {
      return NextResponse.redirect(cartUrl);
    }
    // Idempotent backup if the payment webhook has not arrived yet.
    await handlePaidCheckout(session);
  } catch {
    return NextResponse.redirect(cartUrl);
  }
  const response = NextResponse.redirect(new URL(`/order/confirmed?session_id=${sessionId}`, request.url));
  response.cookies.delete(CART_COOKIE);
  return response;
}
