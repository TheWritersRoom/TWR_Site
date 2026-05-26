import Stripe from "stripe";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  return new Stripe(key);
}

export function getPriceId(plan: "monthly" | "yearly"): string {
  const key = plan === "monthly" ? "STRIPE_MONTHLY_PRICE_ID" : "STRIPE_YEARLY_PRICE_ID";
  const id = process.env[key];
  if (!id) throw new Error(`${key} is not set. Run pnpm --filter @workspace/scripts exec tsx src/seed-stripe-products.ts first.`);
  return id;
}

export function getBaseUrl(): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, "");
  const replitDomain = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (replitDomain) return `https://${replitDomain}`;
  return "http://localhost:3000";
}

export async function handleStripeWebhook(payload: Buffer, signature: string): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set.");

  const stripe = getStripeClient();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;
      const userId = session.metadata?.userId;
      if (!userId) { console.warn("[stripe] checkout.session.completed: no userId in metadata"); break; }
      await db
        .update(usersTable)
        .set({ subscriptionTier: "pro", stripeCustomerId: String(session.customer) })
        .where(eq(usersTable.id, Number(userId)));
      console.log(`[stripe] Upgraded user ${userId} to Pro.`);
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = String(sub.customer);
      const isActive = sub.status === "active" || sub.status === "trialing";
      const tier = isActive ? "pro" : "free";
      await db
        .update(usersTable)
        .set({ subscriptionTier: tier })
        .where(eq(usersTable.stripeCustomerId, customerId));
      console.log(`[stripe] Subscription updated for customer ${customerId} → ${tier}`);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = String(sub.customer);
      await db
        .update(usersTable)
        .set({ subscriptionTier: "free" })
        .where(eq(usersTable.stripeCustomerId, customerId));
      console.log(`[stripe] Subscription cancelled for customer ${customerId} → free`);
      break;
    }
  }
}
