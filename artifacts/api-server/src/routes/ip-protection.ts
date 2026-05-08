import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, projectsTable, usersTable, suggestionsTable, collaboratorsTable } from "@workspace/db";
import crypto from "crypto";
import PDFDocument from "pdfkit";

const router: IRouter = Router();

function sha256(text: string): string {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

async function logAccess(projectId: number, userId: number, accessType = "view") {
  await db.execute(
    sql`INSERT INTO content_access_logs (project_id, user_id, access_type) VALUES (${projectId}, ${userId}, ${accessType})`
  );
}

// ── Content fingerprint ─────────────────────────────────────────────────────

router.get("/projects/:id/fingerprint", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const userId = parseInt(req.query.userId as string, 10);
  if (isNaN(projectId) || isNaN(userId)) { res.status(400).json({ error: "Invalid params" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const hash = sha256(project.content ?? "");
  const timestamp = new Date().toISOString();
  res.json({ hash, timestamp, projectId, title: project.title });
});

// ── Access logs ─────────────────────────────────────────────────────────────

router.post("/projects/:id/access-log", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const { userId, accessType = "view" } = req.body;
  if (isNaN(projectId) || !userId) { res.status(400).json({ error: "Invalid params" }); return; }
  await logAccess(projectId, userId, accessType);
  res.json({ ok: true });
});

router.get("/projects/:id/access-logs", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const userId = parseInt(req.query.userId as string, 10);
  if (isNaN(projectId) || isNaN(userId)) { res.status(400).json({ error: "Invalid params" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Not found" }); return; }
  if (project.ownerId !== userId) { res.status(403).json({ error: "Only the owner can view access logs" }); return; }

  const rows = await db.execute(
    sql`SELECT cal.id, cal.user_id, cal.access_type, cal.accessed_at, u.name as user_name
        FROM content_access_logs cal
        JOIN users u ON u.id = cal.user_id
        WHERE cal.project_id = ${projectId}
        ORDER BY cal.accessed_at DESC
        LIMIT 200`
  );
  res.json((rows as any).rows ?? rows);
});

// ── IP Agreement ────────────────────────────────────────────────────────────

router.get("/projects/:id/ip-agreement", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const userId = parseInt(req.query.userId as string, 10);
  if (isNaN(projectId) || isNaN(userId)) { res.status(400).json({ error: "Invalid params" }); return; }

  const [project] = await db
    .select({ ipAgreementText: projectsTable.ipAgreementText, ipAgreementRequired: projectsTable.ipAgreementRequired, ownerId: projectsTable.ownerId })
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Not found" }); return; }

  const signed = await db.execute(
    sql`SELECT id, agreed_at FROM ip_agreements WHERE project_id = ${projectId} AND user_id = ${userId}`
  );
  const signedRow = ((signed as any).rows ?? signed)[0] ?? null;

  res.json({
    required: project.ipAgreementRequired,
    text: project.ipAgreementText,
    signed: !!signedRow,
    agreedAt: signedRow?.agreed_at ?? null,
  });
});

router.patch("/projects/:id/ip-agreement", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const { userId, text, required } = req.body;
  if (isNaN(projectId) || !userId) { res.status(400).json({ error: "Invalid params" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Not found" }); return; }
  if (project.ownerId !== userId) { res.status(403).json({ error: "Only the owner can set the agreement" }); return; }

  await db.execute(
    sql`UPDATE projects SET ip_agreement_text = ${text ?? null}, ip_agreement_required = ${required ?? false} WHERE id = ${projectId}`
  );
  res.json({ ok: true });
});

router.post("/projects/:id/ip-agreement/sign", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const { userId } = req.body;
  if (isNaN(projectId) || !userId) { res.status(400).json({ error: "Invalid params" }); return; }

  const [project] = await db
    .select({ ipAgreementText: projectsTable.ipAgreementText, ipAgreementRequired: projectsTable.ipAgreementRequired })
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Not found" }); return; }
  if (!project.ipAgreementText) { res.status(400).json({ error: "No agreement text set" }); return; }

  await db.execute(
    sql`INSERT INTO ip_agreements (project_id, user_id, agreement_text)
        VALUES (${projectId}, ${userId}, ${project.ipAgreementText})
        ON CONFLICT (project_id, user_id) DO UPDATE SET agreed_at = NOW(), agreement_text = ${project.ipAgreementText}`
  );
  res.json({ ok: true, agreedAt: new Date().toISOString() });
});

router.get("/projects/:id/ip-agreement/signatories", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const userId = parseInt(req.query.userId as string, 10);
  if (isNaN(projectId) || isNaN(userId)) { res.status(400).json({ error: "Invalid params" }); return; }

  const [project] = await db.select({ ownerId: projectsTable.ownerId }).from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Not found" }); return; }
  if (project.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const rows = await db.execute(
    sql`SELECT ia.user_id, ia.agreed_at, u.name FROM ip_agreements ia JOIN users u ON u.id = ia.user_id WHERE ia.project_id = ${projectId} ORDER BY ia.agreed_at DESC`
  );
  res.json((rows as any).rows ?? rows);
});

// ── Contribution Certificate PDF ────────────────────────────────────────────

router.get("/projects/:id/certificate/:contributorId", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const contributorId = parseInt(req.params.contributorId, 10);
  const userId = parseInt(req.query.userId as string, 10);
  if (isNaN(projectId) || isNaN(contributorId) || isNaN(userId)) {
    res.status(400).json({ error: "Invalid params" }); return;
  }

  if (userId !== contributorId) {
    const [project] = await db.select({ ownerId: projectsTable.ownerId }).from(projectsTable).where(eq(projectsTable.id, projectId));
    if (!project || project.ownerId !== userId) {
      res.status(403).json({ error: "Only the contributor or project owner can download this certificate" }); return;
    }
  }

  const [project] = await db
    .select({ id: projectsTable.id, title: projectsTable.title, content: projectsTable.content, ownerId: projectsTable.ownerId, ownerName: usersTable.name, createdAt: projectsTable.createdAt })
    .from(projectsTable)
    .innerJoin(usersTable, eq(projectsTable.ownerId, usersTable.id))
    .where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [contributor] = await db
    .select({ id: usersTable.id, name: usersTable.name, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, contributorId));
  if (!contributor) { res.status(404).json({ error: "Contributor not found" }); return; }

  const acceptedSuggestions = await db
    .select({
      id: suggestionsTable.id,
      originalText: suggestionsTable.originalText,
      suggestedText: suggestionsTable.suggestedText,
      comment: suggestionsTable.comment,
      createdAt: suggestionsTable.createdAt,
      updatedAt: suggestionsTable.updatedAt,
    })
    .from(suggestionsTable)
    .where(and(
      eq(suggestionsTable.projectId, projectId),
      eq(suggestionsTable.submitterId, contributorId),
      eq(suggestionsTable.status, "accepted")
    ))
    .orderBy(suggestionsTable.updatedAt);

  const contentHash = sha256(project.content ?? "");
  const certId = `WR-${projectId}-${contributorId}-${Date.now()}`;
  const issuedAt = new Date();

  const doc = new PDFDocument({ size: "A4", margin: 60, info: { Title: "Contribution Certificate", Author: "Writers Room" } });

  const buffers: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => buffers.push(chunk));

  await new Promise<void>((resolve) => {
    doc.on("end", resolve);

    const W = doc.page.width;
    const M = 60;

    // Border
    doc.rect(M - 20, M - 20, W - 2 * (M - 20), doc.page.height - 2 * (M - 20))
      .lineWidth(2).strokeColor("#E8B84B").stroke();
    doc.rect(M - 14, M - 14, W - 2 * (M - 14), doc.page.height - 2 * (M - 14))
      .lineWidth(0.5).strokeColor("#E8B84B").stroke();

    // Header
    doc.fillColor("#1A1614").font("Helvetica-Bold").fontSize(9)
      .text("THE WRITERS ROOM", M, M + 6, { align: "center", width: W - 2 * M, characterSpacing: 3 });

    doc.moveDown(0.3);
    doc.fillColor("#7A6B5E").font("Helvetica").fontSize(7)
      .text("INTELLECTUAL PROPERTY · CONTRIBUTION CERTIFICATE", { align: "center", width: W - 2 * M, characterSpacing: 2 });

    // Divider
    const y1 = doc.y + 16;
    doc.moveTo(M, y1).lineTo(W - M, y1).lineWidth(1).strokeColor("#E8B84B").stroke();
    doc.y = y1 + 20;

    // Title
    doc.fillColor("#1A1614").font("Helvetica-Bold").fontSize(22)
      .text("Certificate of Contribution", { align: "center", width: W - 2 * M });

    doc.moveDown(0.6);
    doc.fillColor("#7A6B5E").font("Helvetica").fontSize(10)
      .text("This certifies that", { align: "center", width: W - 2 * M });

    doc.moveDown(0.5);
    doc.fillColor("#1A1614").font("Helvetica-Bold").fontSize(18)
      .text(contributor.name, { align: "center", width: W - 2 * M });

    doc.moveDown(0.4);
    doc.fillColor("#7A6B5E").font("Helvetica").fontSize(10)
      .text(`acting as ${contributor.role ?? "contributor"}, made the following accepted contributions to`, { align: "center", width: W - 2 * M });

    doc.moveDown(0.5);
    doc.fillColor("#1A1614").font("Helvetica-Bold").fontSize(14)
      .text(`"${project.title}"`, { align: "center", width: W - 2 * M });

    doc.moveDown(0.3);
    doc.fillColor("#7A6B5E").font("Helvetica").fontSize(9)
      .text(`authored by ${project.ownerName}`, { align: "center", width: W - 2 * M });

    // Divider
    const y2 = doc.y + 18;
    doc.moveTo(M, y2).lineTo(W - M, y2).lineWidth(0.5).strokeColor("#1A1614").opacity(0.15).stroke();
    doc.opacity(1);
    doc.y = y2 + 18;

    // Contribution count summary
    doc.fillColor("#1A1614").font("Helvetica-Bold").fontSize(11)
      .text(`${acceptedSuggestions.length} Accepted Suggestion${acceptedSuggestions.length !== 1 ? "s" : ""}`, M, doc.y, { width: W - 2 * M });

    doc.moveDown(0.5);

    if (acceptedSuggestions.length === 0) {
      doc.fillColor("#7A6B5E").font("Helvetica-Oblique").fontSize(9)
        .text("No accepted suggestions at time of certificate generation.", { width: W - 2 * M });
    } else {
      const maxToShow = 8;
      const shown = acceptedSuggestions.slice(0, maxToShow);

      for (const sug of shown) {
        if (doc.y > doc.page.height - 180) break;
        const dateStr = new Date(sug.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

        doc.fillColor("#7A6B5E").font("Helvetica").fontSize(7.5)
          .text(`Accepted ${dateStr}`, M, doc.y, { width: W - 2 * M });

        const original = sug.originalText.length > 90 ? sug.originalText.slice(0, 90) + "…" : sug.originalText;
        const suggested = sug.suggestedText.length > 90 ? sug.suggestedText.slice(0, 90) + "…" : sug.suggestedText;

        doc.fillColor("#C0392B").font("Helvetica").fontSize(8)
          .text(`− ${original}`, M + 8, doc.y + 2, { width: W - 2 * M - 8 });
        doc.fillColor("#1A6B3A").font("Helvetica").fontSize(8)
          .text(`+ ${suggested}`, M + 8, doc.y + 2, { width: W - 2 * M - 8 });

        if (sug.comment) {
          doc.fillColor("#7A6B5E").font("Helvetica-Oblique").fontSize(7.5)
            .text(`Note: ${sug.comment}`, M + 8, doc.y + 2, { width: W - 2 * M - 8 });
        }
        doc.moveDown(0.6);
      }

      if (acceptedSuggestions.length > maxToShow) {
        doc.fillColor("#7A6B5E").font("Helvetica-Oblique").fontSize(8)
          .text(`… and ${acceptedSuggestions.length - maxToShow} more accepted suggestions.`, { width: W - 2 * M });
        doc.moveDown(0.4);
      }
    }

    // Footer metadata
    const footerY = doc.page.height - 110;

    doc.moveTo(M, footerY).lineTo(W - M, footerY).lineWidth(0.5).strokeColor("#1A1614").opacity(0.12).stroke();
    doc.opacity(1);

    const col1 = M;
    const col2 = W / 2;
    const colW = W / 2 - M;
    const metaY = footerY + 14;

    doc.fillColor("#7A6B5E").font("Helvetica").fontSize(7).text("ISSUED", col1, metaY, { width: colW });
    doc.fillColor("#1A1614").font("Helvetica-Bold").fontSize(7.5)
      .text(issuedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), col1, metaY + 10, { width: colW });

    doc.fillColor("#7A6B5E").font("Helvetica").fontSize(7).text("CERTIFICATE ID", col2, metaY, { width: colW });
    doc.fillColor("#1A1614").font("Helvetica-Bold").fontSize(7.5).text(certId, col2, metaY + 10, { width: colW });

    const hashY = metaY + 30;
    doc.fillColor("#7A6B5E").font("Helvetica").fontSize(7).text("CONTENT FINGERPRINT (SHA-256 of manuscript at time of issue)", col1, hashY, { width: W - 2 * M });
    doc.fillColor("#1A1614").font("Courier").fontSize(6.5).text(contentHash, col1, hashY + 10, { width: W - 2 * M });

    const legalY = hashY + 26;
    doc.fillColor("#7A6B5E").font("Helvetica").fontSize(6.5)
      .text(
        "This document is generated by Writers Room and records intellectual contributions as of the issue date. It does not constitute legal advice or transfer of copyright. The content fingerprint (SHA-256 hash) provides cryptographic proof that the manuscript existed in this exact form at the time of issue.",
        col1, legalY, { width: W - 2 * M, lineGap: 1.5 }
      );

    doc.end();
  });

  const pdfBuffer = Buffer.concat(buffers);
  const filename = `WR_Certificate_${contributor.name.replace(/[^a-z0-9]/gi, "_")}_${project.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
});

export { logAccess, sha256 };
export default router;
