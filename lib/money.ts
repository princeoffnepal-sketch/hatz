import type { CurrencyCode, Money } from "./types";

export function money(amount: number, currency: CurrencyCode = "USD"): Money {
  if (!Number.isInteger(amount)) {
    throw new Error(`Money amounts must be integer minor units, received ${amount}`);
  }
  return { amount, currency };
}

export function multiply(price: Money, quantity: number): Money {
  return money(price.amount * quantity, price.currency);
}

export function sum(values: Money[], currency: CurrencyCode = "USD"): Money {
  let total = 0;
  for (const value of values) {
    if (value.currency !== currency) {
      throw new Error(`Cannot add ${value.currency} to ${currency}`);
    }
    total += value.amount;
  }
  return money(total, currency);
}

const formatters = new Map<string, Intl.NumberFormat>();

/** Formats whole-dollar prices without cents ("$45") and others with cents. */
export function formatMoney(value: Money): string {
  const whole = value.amount % 100 === 0;
  const key = `${value.currency}-${whole}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: value.currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    });
    formatters.set(key, formatter);
  }
  return formatter.format(value.amount / 100);
}
