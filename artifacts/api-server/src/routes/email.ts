import { Router, type IRouter } from "express";
import { requireAdmin } from "../middleware/require-admin";
import { sendEmail } from "../lib/email";

const router: IRouter = Router();

/**
 * POST /admin/email/test
 * Admin-only smoke test — sends a real email to confirm Resend is wired up correctly.
 * Body: { to: string }
 */
router.post("/admin/email/test", requireAdmin, async (req, res): Promise<void> => {
  const { to } = req.body as { to?: string };

  if (!to || typeof to !== "string" || !to.includes("@")) {
    res.status(400).json({ error: "A valid 'to' email address is required." });
    return;
  }

  if (!process.env["RESEND_API_KEY"]) {
    res.status(503).json({ error: "RESEND_API_KEY is not configured. Add it in the project secrets." });
    return;
  }

  try {
    await sendEmail({
      to,
      subject: "The Writers Room — email test",
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1A1614;">
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #E8B84B; margin: 0 0 8px;">The Writers Room</p>
          <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 24px;">Email integration working</h1>
          <p style="font-size: 15px; line-height: 1.7; color: #4A3F38;">
            This is a test email confirming that Resend is correctly integrated with
            The Writers Room platform. Transactional email is ready to use.
          </p>
          <hr style="border: none; border-top: 1px solid #E8E0D8; margin: 32px 0;" />
          <p style="font-size: 11px; color: #9A8C82;">
            Sent from the Admin panel · The Writers Room
          </p>
        </div>
      `,
    });

    res.json({ ok: true, message: `Test email sent to ${to}` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;
