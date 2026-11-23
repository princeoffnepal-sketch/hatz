import "server-only";
import Stripe from "stripe";
import { getCommerceConfig } from "@/config/commerce.server";
import { delivery } from "@/config/delivery";
import { estimateDelivery, formatDayRange, shippingPriceFor, toIsoDate, totalBusinessDayRange } from "@/lib/delivery";
import type { Cart } from "@/lib/types";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const { stripe } = getCommerceConfig();
  if (!stripe.secretKey) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(stripe.secretKey, { appInfo: { name: "Exclusive Hatz" } });
  return client;
}

/**
 * Creates a Stripe-hosted Checkout Session from a server-built cart.
 * Prices come from the server catalog (never from the browser). The
 * customer-facing delivery promise is snapshotted in session metadata so the
 * original promise survives later changes to delivery settings.
 *
 * Wallets (Apple Pay, Google Pay, Link) appear automatically on the hosted page
 * when eligible for the device and enabled in the Stripe Dashboard.
 */
export async function createCheckoutSession(cart: Cart, now = new Date()): Promise<string> {
  const config = getCommerceConfig();
  const siteUrl = config.siteUrl;
  if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL is not set");
  const stripe = getStripe();

  const subtotal = cart.subtotal.amount;
  if (cart.lines.map(l => `${l.variantId}:${l.quantity}`).join(",").length > 500) throw new Error("Too many distinct items in this order");
  const countries = delivery.regions
    .filter((r) => r.enabled)
    .flatMap((r) => r.countries) as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];

  const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = delivery.services.map((service) => {
    const total = totalBusinessDayRange(delivery, service)!;
    return {
      shipping_rate_data: {
        type: "fixed_amount",
        display_name: service.label,
        tax_behavior: "exclusive",
        tax_code: "txcd_92010001",
        fixed_amount: { amount: shippingPriceFor(service, subtotal, cart.totalQuantity), currency: "usd" },
        delivery_estimate: {
          minimum: { unit: "business_day", value: total.min },
          maximum: { unit: "business_day", value: total.max },
        },
        metadata: { service_id: service.id },
      },
    };
  });

  const estimate = estimateDelivery(delivery, delivery.services[0].id, now, subtotal, cart.totalQuantity);
  const totalDays = totalBusinessDayRange(delivery, delivery.services[0])!;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: cart.lines
      .filter((line) => line.available)
      .map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: line.unitPrice.currency.toLowerCase(),
          unit_amount: line.unitPrice.amount,
          tax_behavior: "exclusive",
          product_data: {
            name: line.name,
            tax_code: "txcd_30060006", // Stripe Tax: Hats. Keep separate from Mogfit’s account default.
            description: [line.colorName, line.sizeName].filter(Boolean).join(" · "),
            // Stripe needs absolute URLs; only real photos are sent, never placeholders.
            images:
              line.image && line.image.kind === "photo"
                ? [new URL(line.image.src, siteUrl).toString()]
                : undefined,
            metadata: { store: "exclusive-hatz", variant_id: line.variantId, product_id: line.productId },
          },
        },
      })),
    shipping_address_collection: { allowed_countries: countries },
    shipping_options: shippingOptions,
    automatic_tax: config.stripe.automaticTax ? { enabled: true } : undefined,
    payment_intent_data: { metadata: { store: "exclusive-hatz", commission_per_hat_cents: "700" } },
    custom_text: {
      submit: {
        message: `Exclusive Hatz is operated by Mogfit. Your statement shows MOGFIT. Estimated delivery: ${formatDayRange(totalDays)} from purchase, including production.`,
      },
    },
    metadata: {
      store: "exclusive-hatz",
      variant_quantities: cart.lines.map((l) => `${l.variantId}:${l.quantity}`).join(","),
      delivery_config_version: delivery.version,
      delivery_business_days: `${totalDays.min}-${totalDays.max}`,
      promised_arrival_earliest: estimate ? toIsoDate(estimate.arrival.earliest) : "",
      promised_arrival_latest: estimate ? toIsoDate(estimate.arrival.latest) : "",
      split_shipment: delivery.splitShipment ?? "",
    },
    success_url: `${siteUrl}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/cart?checkout=cancelled`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}
