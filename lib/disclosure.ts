import { delivery as deliverySettings, type DeliverySettings } from "@/config/delivery";
import { formatDayRange, isDeliveryConfigured } from "./delivery";
import { formatMoney, money } from "./money";
import type { Product } from "./types";

/** "Embroidered to order" only when embroidery is confirmed for the product. */
export function madeToOrderLine(product?: Pick<Product, "production"> | null): string {
  if (product?.production.decorationConfirmed && product.production.decorationMethod === "embroidery") {
    return "This hat is embroidered to order.";
  }
  return "This hat is made or decorated after you order.";
}

export type DeliveryCopy =
  | { configured: false; production: string; shipping: string }
  | { configured: true; production: string; shipping: string; splitNote: string | null; expressNote: string | null };

export function deliveryCopy(settings: DeliverySettings = deliverySettings): DeliveryCopy {
  if (!isDeliveryConfigured(settings)) {
    return {
      configured: false,
      production: "Made to order. Production happens before dispatch.",
      shipping: settings.services[0]?.transitBusinessDays
        ? `U.S. shipping: $7.50 for one hat, free with 2+ hats. Estimated ${formatDayRange(settings.services[0].transitBusinessDays)} after dispatch.`
        : "Shipping price and delivery estimate will be confirmed before launch.",
    };
  }
  const services = settings.services;
  const standard = services[0];
  const price = standard.priceCents === 0 ? "free" : formatMoney(money(standard.priceCents!));
  const threshold =
    standard.freeMinQuantity ? ` Free with ${standard.freeMinQuantity}+ hats.` : standard.freeOverCents !== null ? ` Free on orders of ${formatMoney(money(standard.freeOverCents))} or more.` : "";
  return {
    configured: true,
    production: `Production: ${formatDayRange(settings.productionBusinessDays!)} after your order is accepted.`,
    shipping: `${standard.label}: ${formatDayRange(standard.transitBusinessDays!)} in transit after it ships, ${price}.${threshold}`,
    splitNote:
      settings.splitShipment === "may-ship-separately"
        ? "Orders with more than one hat may arrive in separate packages."
        : null,
    expressNote: services.length > 1 ? "Faster shipping shortens transit only. Production time stays the same." : null,
  };
}
