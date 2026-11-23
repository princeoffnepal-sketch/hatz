import type Stripe from 'stripe';
export function isPaidStoreSession(session: Pick<Stripe.Checkout.Session, 'metadata'|'status'|'payment_status'|'livemode'>, mode: string) {
  return (mode === 'live' || mode === 'stripe-test') && session.metadata?.store === 'exclusive-hatz' && session.status === 'complete' && session.payment_status === 'paid' && session.livemode === (mode === 'live');
}
