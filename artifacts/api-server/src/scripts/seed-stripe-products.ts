/**
 * Creates the Writers Room Pro subscription products and prices in Stripe.
 *
 * Run once after adding STRIPE_SECRET_KEY to your environment:
 *   pnpm --filter @workspace/api-server exec tsx src/scripts/seed-stripe-products.ts
 *
 * Copy the printed price IDs into your environment variables:
 *   STRIPE_MONTHLY_PRICE_ID=price_xxx
 *   STRIPE_YEARLY_PRICE_ID=price_xxx
 */

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("❌  STRIPE_SECRET_KEY is not set. Add it to your Replit secrets first.");
  process.exit(1);
}

const stripe = new Stripe(key);

async function run() {
  console.log("Checking for existing Writers Room Pro product...");

  const existing = await stripe.products.search({ query: "name:'Writers Room Pro'" });

  let product: Stripe.Product;
  if (existing.data.length > 0) {
    product = existing.data[0];
    console.log(`✓ Product already exists: ${product.id}`);
  } else {
    product = await stripe.products.create({
      name: "Writers Room Pro",
      description: "Unlimited Writing Rooms, Pro badge, and priority on the Pitches board.",
    });
    console.log(`✓ Created product: ${product.id}`);
  }

  const existingPrices = await stripe.prices.list({ product: product.id, active: true });
  const existingMonthly = existingPrices.data.find(p => p.recurring?.interval === "month");
  const existingYearly = existingPrices.data.find(p => p.recurring?.interval === "year");

  let monthlyPrice: Stripe.Price;
  if (existingMonthly) {
    monthlyPrice = existingMonthly;
    console.log(`✓ Monthly price already exists: ${monthlyPrice.id}`);
  } else {
    monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 500, // £5.00
      currency: "gbp",
      recurring: { interval: "month" },
    });
    console.log(`✓ Created monthly price: ${monthlyPrice.id}`);
  }

  let yearlyPrice: Stripe.Price;
  if (existingYearly) {
    yearlyPrice = existingYearly;
    console.log(`✓ Yearly price already exists: ${yearlyPrice.id}`);
  } else {
    yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 5000, // £50.00
      currency: "gbp",
      recurring: { interval: "year" },
    });
    console.log(`✓ Created yearly price: ${yearlyPrice.id}`);
  }

  console.log("\n─────────────────────────────────────────────────");
  console.log("Add these to your Replit secrets (and Hostinger hPanel):");
  console.log(`STRIPE_MONTHLY_PRICE_ID=${monthlyPrice.id}`);
  console.log(`STRIPE_YEARLY_PRICE_ID=${yearlyPrice.id}`);
  console.log("─────────────────────────────────────────────────\n");
}

run().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
