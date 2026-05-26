import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq, gt } from "drizzle-orm";
import Stripe from "stripe";
import { db, usersTable, userSessionsTable } from "@workspace/db";
import { getStripeClient, getPriceId, getBaseUrl } from "../lib/stripe";

const router: IRouter = Router();

async function getSessionUser(req: Request) {
  const sessionToken = req.cookies?.["wr_session"];
  if (!sessionToken) return null;
  const [session] = await db
    .select({ userId: userSessionsTable.userId })
    .from(userSessionsTable)
    .where(and(eq(userSessionsTable.token, sessionToken), gt(userSessionsTable.expiresAt, new Date())));
  if (!session) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  return user ?? null;
}

// GET /stripe/subscription — current plan details for logged-in user
router.get("/stripe/subscription", async (req: Request, res: Response) => {
  const user = await getSessionUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorised" }); return; }

  if (user.subscriptionTier === "pro" && !user.stripeCustomerId) {
    res.json({ tier: "pro", isBeta: true, subscription: null });
    return;
  }

  if (!user.stripeCustomerId) {
    res.json({ tier: "free", isBeta: false, subscription: null });
    return;
  }

  try {
    const stripe = getStripeClient();
    const subs = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      limit: 1,
      status: "active",
    });
    const sub = subs.data[0] ?? null;
    res.json({
      tier: user.subscriptionTier,
      isBeta: false,
      subscription: sub
        ? { status: sub.status, currentPeriodEnd: sub.current_period_end }
        : null,
    });
  } catch {
    res.json({ tier: user.subscriptionTier, isBeta: false, subscription: null });
  }
});

// POST /stripe/checkout — start a Stripe Checkout session
router.post("/stripe/checkout", async (req: Request, res: Response) => {
  const user = await getSessionUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorised" }); return; }

  const { plan } = req.body as { plan?: string };
  if (plan !== "monthly" && plan !== "yearly") {
    res.status(400).json({ error: "plan must be 'monthly' or 'yearly'" });
    return;
  }

  try {
    const stripe = getStripeClient();
    const priceId = getPriceId(plan);
    const baseUrl = getBaseUrl();

    const params: Stripe.Checkout.SessionCreateParams = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/?checkout=success`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: { userId: String(user.id) },
    };

    if (user.stripeCustomerId) {
      params.customer = user.stripeCustomerId;
    } else {
      params.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(params);
    res.json({ url: session.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create checkout session";
    console.error("[stripe] checkout error:", msg);
    res.status(500).json({ error: msg });
  }
});

// POST /stripe/portal — open Stripe customer portal to manage/cancel subscription
router.post("/stripe/portal", async (req: Request, res: Response) => {
  const user = await getSessionUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorised" }); return; }

  if (!user.stripeCustomerId) {
    res.status(400).json({ error: "No active Stripe subscription to manage." });
    return;
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getBaseUrl()}/profile`,
    });
    res.json({ url: session.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create portal session";
    console.error("[stripe] portal error:", msg);
    res.status(500).json({ error: msg });
  }
});

export default router;
