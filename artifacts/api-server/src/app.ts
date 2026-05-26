import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import router from "./routes";
import { handleStripeWebhook } from "./lib/stripe";

const app: Express = express();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

// ── Stripe webhook — must be registered BEFORE express.json() ─────────────────
// Stripe requires the raw request body to verify the signature.
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    if (!sig) { res.status(400).json({ error: "Missing stripe-signature header" }); return; }
    try {
      await handleStripeWebhook(req.body as Buffer, Array.isArray(sig) ? sig[0] : sig);
      res.json({ received: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Webhook error";
      console.error("[stripe] webhook error:", msg);
      res.status(400).json({ error: msg });
    }
  }
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Serve locally-uploaded avatars at /api/storage/local/*
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/api/storage/local", express.static(uploadsDir));

app.use("/api", router);

const frontendDist =
  process.env.FRONTEND_DIST ??
  path.join(process.cwd(), "artifacts/writers-room/dist/public");

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
