import Stripe from "stripe";

// Stripe is optional by design: keys absent => card payments disabled and the
// UI says so. No simulated payments are ever created.

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function cardPaymentsEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function webhookSecretConfigured(): boolean {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET);
}
