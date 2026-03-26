import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, projectsTable, usersTable } from "@workspace/db";
import JSZip from "jszip";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  convertInchesToTwip,
} from "docx";

const router: IRouter = Router();

// ─── helpers ────────────────────────────────────────────────────────────────

function splitIntoChapters(raw: string): { title: string; body: string }[] {
  const chapterRe = /^(chapter\s+\w+[^\n]*|#\s+[^\n]+)/im;
  const lines = raw.split("\n");
  const chapters: { title: string; body: string }[] = [];
  let currentTitle = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    if (chapterRe.test(line.trim())) {
      if (currentLines.length || currentTitle) {
        chapters.push({ title: currentTitle, body: currentLines.join("\n").trim() });
      }
      currentTitle = line.trim().replace(/^#+\s*/, "");
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length || currentTitle) {
    chapters.push({ title: currentTitle, body: currentLines.join("\n").trim() });
  }

  if (chapters.length === 0) {
    chapters.push({ title: "", body: raw.trim() });
  }

  return chapters;
}

function textToXhtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── EPUB export ─────────────────────────────────────────────────────────────

router.get("/projects/:id/export/epub", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const userId = parseInt(req.query.userId as string, 10);

  if (isNaN(projectId) || isNaN(userId)) {
    res.status(400).json({ error: "Invalid projectId or userId" });
    return;
  }

  const rows = await db
    .select({
      id: projectsTable.id,
      title: projectsTable.title,
      type: projectsTable.type,
      synopsis: projectsTable.synopsis,
      content: projectsTable.content,
      ownerId: projectsTable.ownerId,
      ownerName: usersTable.name,
    })
    .from(projectsTable)
    .innerJoin(usersTable, eq(projectsTable.ownerId, usersTable.id))
    .where(eq(projectsTable.id, projectId))
    .limit(1);

  const project = rows[0];
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (!project.content) { res.status(400).json({ error: "No content to export" }); return; }

  const chapters = splitIntoChapters(project.content);
  const safeTitle = textToXhtml(project.title);
  const safeAuthor = textToXhtml(project.ownerName ?? "Unknown Author");
  const uid = `wr-${project.id}-${Date.now()}`;

  const zip = new JSZip();

  // mimetype (must be first, uncompressed)
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // META-INF/container.xml
  zip.folder("META-INF")!.file("container.xml", `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  const oebps = zip.folder("OEBPS")!;

  // Stylesheet
  oebps.file("styles.css", `
body { font-family: Georgia, "Times New Roman", serif; font-size: 1em; line-height: 1.7; margin: 1em 2em; color: #1a1a1a; }
h1 { font-size: 1.8em; text-align: center; margin: 2em 0 1em; }
h2 { font-size: 1.3em; margin: 1.5em 0 0.8em; }
p { margin: 0 0 0.8em; text-indent: 1.5em; }
p.first { text-indent: 0; }
.title-page { text-align: center; padding: 4em 0; }
.title-page h1 { font-size: 2.2em; }
.title-page .author { font-size: 1.2em; color: #555; margin-top: 0.5em; }
`);

  // Title page
  oebps.file("title.xhtml", `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${safeTitle}</title><link rel="stylesheet" href="styles.css"/></head>
<body>
  <div class="title-page">
    <h1>${safeTitle}</h1>
    <p class="author">${safeAuthor}</p>
    ${project.synopsis ? `<p style="margin-top:2em;font-style:italic;color:#666">${textToXhtml(project.synopsis)}</p>` : ""}
  </div>
</body>
</html>`);

  // Chapter files
  const chapterItems: string[] = [];
  chapters.forEach((ch, i) => {
    const filename = `chapter${String(i + 1).padStart(3, "0")}.xhtml`;
    chapterItems.push(filename);
    const paragraphs = ch.body
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p, pi) => `    <p${pi === 0 ? ' class="first"' : ""}>${textToXhtml(p.replace(/\n/g, " "))}</p>`)
      .join("\n");

    oebps.file(filename, `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${ch.title ? textToXhtml(ch.title) : safeTitle}</title><link rel="stylesheet" href="styles.css"/></head>
<body>
  ${ch.title ? `<h2>${textToXhtml(ch.title)}</h2>` : ""}
${paragraphs}
</body>
</html>`);
  });

  // content.opf
  const manifestItems = [
    `<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>`,
    `<item id="css" href="styles.css" media-type="text/css"/>`,
    `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    ...chapterItems.map((f, i) => `<item id="ch${i + 1}" href="${f}" media-type="application/xhtml+xml"/>`),
  ].join("\n    ");

  const spineItems = [
    `<itemref idref="title"/>`,
    ...chapterItems.map((_, i) => `<itemref idref="ch${i + 1}"/>`),
  ].join("\n    ");

  const navPoints = [
    `<navPoint id="np0"><navLabel><text>Title Page</text></navLabel><content src="title.xhtml"/></navPoint>`,
    ...chapters.map((ch, i) =>
      `<navPoint id="np${i + 1}"><navLabel><text>${ch.title ? textToXhtml(ch.title) : `Chapter ${i + 1}`}</text></navLabel><content src="${chapterItems[i]}"/></navPoint>`
    ),
  ].join("\n    ");

  oebps.file("content.opf", `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${safeTitle}</dc:title>
    <dc:creator>${safeAuthor}</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="bookid">${uid}</dc:identifier>
    ${project.synopsis ? `<dc:description>${textToXhtml(project.synopsis)}</dc:description>` : ""}
  </metadata>
  <manifest>
    ${manifestItems}
  </manifest>
  <spine toc="ncx">
    ${spineItems}
  </spine>
</package>`);

  // toc.ncx
  oebps.file("toc.ncx", `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="${uid}"/></head>
  <docTitle><text>${safeTitle}</text></docTitle>
  <navMap>
    ${navPoints}
  </navMap>
</ncx>`);

  const buffer = await zip.generateAsync({ type: "nodebuffer", mimeType: "application/epub+zip" });
  const filename = `${project.title.replace(/[^a-z0-9]/gi, "_")}.epub`;

  res.setHeader("Content-Type", "application/epub+zip");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
});

// ─── DOCX export ─────────────────────────────────────────────────────────────

router.get("/projects/:id/export/docx", async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  const userId = parseInt(req.query.userId as string, 10);

  if (isNaN(projectId) || isNaN(userId)) {
    res.status(400).json({ error: "Invalid projectId or userId" });
    return;
  }

  const rows = await db
    .select({
      id: projectsTable.id,
      title: projectsTable.title,
      type: projectsTable.type,
      synopsis: projectsTable.synopsis,
      content: projectsTable.content,
      ownerId: projectsTable.ownerId,
      ownerName: usersTable.name,
    })
    .from(projectsTable)
    .innerJoin(usersTable, eq(projectsTable.ownerId, usersTable.id))
    .where(eq(projectsTable.id, projectId))
    .limit(1);

  const project = rows[0];
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.ownerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (!project.content) { res.status(400).json({ error: "No content to export" }); return; }

  const chapters = splitIntoChapters(project.content);

  const docChildren: Paragraph[] = [
    // Title page
    new Paragraph({
      text: project.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: convertInchesToTwip(2), after: convertInchesToTwip(0.5) },
    }),
    new Paragraph({
      children: [new TextRun({ text: project.ownerName ?? "Unknown Author", size: 28, color: "555555" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: convertInchesToTwip(0.3) },
    }),
    ...(project.synopsis
      ? [new Paragraph({
          children: [new TextRun({ text: project.synopsis, italics: true, color: "666666", size: 22 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: convertInchesToTwip(2) },
        })]
      : [new Paragraph({ text: "", spacing: { after: convertInchesToTwip(2) } })]),
  ];

  for (const ch of chapters) {
    if (ch.title) {
      docChildren.push(
        new Paragraph({
          text: ch.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: convertInchesToTwip(1), after: convertInchesToTwip(0.4) },
          pageBreakBefore: true,
        })
      );
    }

    const blocks = ch.body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
    for (const block of blocks) {
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: block.replace(/\n/g, " "), size: 24 })],
          spacing: { after: 0 },
          indent: { firstLine: convertInchesToTwip(0.5) },
        })
      );
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.25),
            right: convertInchesToTwip(1.25),
          },
        },
      },
      children: docChildren,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `${project.title.replace(/[^a-z0-9]/gi, "_")}.docx`;

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
});

export default router;
