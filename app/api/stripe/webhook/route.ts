import type Stripe from "stripe";
import { recordDispute } from "@/lib/admin/ledger.server";
import { getCommerceConfig } from "@/config/commerce.server";
import { getStripe } from "@/lib/checkout/stripe.server";
import { handlePaidCheckout, handleRefund } from "@/lib/fulfillment/orders.server";

/**
 * Stripe webhook endpoint. Verifies the signature against the raw body, then
 * hands paid orders and refunds to the single order module. Responds quickly;
 * slow work belongs in a durable queue once fulfillment is connected.
 */
export async function POST(request: Request) {
  const { stripe } = getCommerceConfig();
  if (!stripe.secretKey || !stripe.webhookSecret) {
    return new Response("Stripe webhook is not configured", { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(await request.text(), signature, stripe.webhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      if (session.payment_status === "paid" || session.payment_status === "no_payment_required") {
        await handlePaidCheckout(session);
      }
      break;
    }
    case "charge.dispute.created":
    case "charge.dispute.updated":
    case "charge.dispute.closed":
      await recordDispute(event.data.object,event.created);
      break;
    case "charge.refunded":
      await handleRefund(event.data.object);
      break;
    default:
      break;
  }
  return Response.json({ received: true });
}
