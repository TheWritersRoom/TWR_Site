import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Download, BookOpen, CheckCircle2, AlertCircle,
  ExternalLink, FileText, FileCode2, ChevronRight, ChevronLeft, FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Project = {
  id: number;
  title: string;
  type: string;
  synopsis?: string | null;
  content?: string | null;
  ownerName?: string | null;
  genres?: string | null;
};

type Platform = "kdp" | "kobo" | "apple" | "pdf";

type CheckItem = {
  label: string;
  passed: boolean;
  hint?: string;
};

const PLATFORMS: { id: Platform; name: string; subtitle: string; logo: string }[] = [
  { id: "kdp",   name: "Amazon KDP",          subtitle: "Kindle Direct Publishing", logo: "🟠" },
  { id: "kobo",  name: "Kobo Writing Life",   subtitle: "Rakuten Kobo",             logo: "🔵" },
  { id: "apple", name: "Apple Books",          subtitle: "Books for Authors",        logo: "⬛" },
];

function countWords(text: string): number {
  const stripped = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return stripped ? stripped.split(" ").filter(Boolean).length : 0;
}

function buildChecks(platform: Platform, project: Project, wordCount: number, parsedGenres: string[]): CheckItem[] {
  const minWords = platform === "kdp" ? 2500 : 1000;
  const minWordsLabel = platform === "kdp" ? "2,500" : "1,000";

  const base: CheckItem[] = [
    {
      label: "Title set",
      passed: !!project.title?.trim(),
      hint: "Your project title becomes the published book title.",
    },
    {
      label: "Author name set",
      passed: !!project.ownerName?.trim(),
      hint: "Your display name is used as the author.",
    },
    {
      label: "Synopsis / description",
      passed: !!project.synopsis?.trim(),
      hint: `${PLATFORMS.find(p => p.id === platform)!.name} requires a book description. Add it in your project settings.`,
    },
    {
      label: "Genre tags added",
      passed: parsedGenres.length > 0,
      hint: "Genre tags help the platform categorise your book.",
    },
    {
      label: `Word count (${wordCount.toLocaleString()} words)`,
      passed: wordCount >= minWords,
      hint: wordCount < minWords
        ? `${PLATFORMS.find(p => p.id === platform)!.name} recommends at least ${minWordsLabel} words (yours: ${wordCount.toLocaleString()}).`
        : `Your manuscript meets the recommended minimum length.`,
    },
    {
      label: "Prose project (not a script)",
      passed: project.type !== "script",
      hint: "Scripts require different publishing paths (e.g. Final Draft, screenplay platforms).",
    },
  ];

  return base;
}

const NEXT_STEPS: Record<Platform, { steps: string[]; url: string; urlLabel: string }> = {
  kdp: {
    steps: [
      "Sign in or create your account on Amazon KDP",
      "Click + Create → Kindle eBook",
      "Enter your title, author, description and keywords",
      "Upload your EPUB or DOCX file in the Kindle eBook Content step",
      "Set your pricing and territories, then publish",
    ],
    url: "https://kdp.amazon.com/en_US/title-setup/kindle/new/details",
    urlLabel: "Open Amazon KDP",
  },
  kobo: {
    steps: [
      "Sign in or create your account on Kobo Writing Life",
      "Click Add a Book and enter your title, author and description",
      "Upload your EPUB file — Kobo accepts EPUB only",
      "Set categories, language and pricing",
      "Submit for review — books typically go live within 24–72 hours",
    ],
    url: "https://www.kobowritinglife.com/",
    urlLabel: "Open Kobo Writing Life",
  },
  apple: {
    steps: [
      "Sign in to Apple Books for Authors with your Apple ID",
      "Click My Books → + Add New Book",
      "Fill in metadata: title, author, description, language and categories",
      "Upload your EPUB file — Apple Books requires EPUB format",
      "Submit for review — books typically go live within 1–2 business days",
    ],
    url: "https://authors.apple.com/",
    urlLabel: "Open Apple Books for Authors",
  },
};

export function KdpExportModal({
  project,
  userId,
  onClose,
}: {
  project: Project;
  userId: number;
  onClose: () => void;
}) {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [downloading, setDownloading] = useState<"epub" | "docx" | "pdf" | null>(null);
  const [step, setStep] = useState<"platform" | "checklist" | "export">("platform");

  const wordCount = useMemo(() => countWords(project.content ?? ""), [project.content]);

  let parsedGenres: string[] = [];
  try { parsedGenres = JSON.parse(project.genres ?? "[]"); } catch {}

  const checks = useMemo(
    () => (platform && platform !== "pdf") ? buildChecks(platform, project, wordCount, parsedGenres) : [],
    [platform, project, wordCount, parsedGenres]
  );

  const passedCount = checks.filter((c) => c.passed).length;
  const allPassed = checks.length > 0 && passedCount === checks.length;

  const handleDownload = async (format: "epub" | "docx" | "pdf") => {
    setDownloading(format);
    try {
      const res = await fetch(`/api/projects/${project.id}/export/${format}?userId=${userId}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const ext = format;
      const filename = `${project.title.replace(/[^a-z0-9]/gi, "_")}.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore — user will see no download
    } finally {
      setDownloading(null);
    }
  };

  const selectedPlatform = PLATFORMS.find(p => p.id === platform);
  const nextSteps = platform ? NEXT_STEPS[platform] : null;

  const STEPS: Array<"platform" | "checklist" | "export"> = ["platform", "checklist", "export"];
  const stepIndex = STEPS.indexOf(step);
  const STEP_LABELS = ["Platform", "Pre-flight", "Export"];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.96, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 16 }}
          transition={{ type: "spring", bounce: 0.3 }}
          className="bg-[#F9F6EE] border border-[#1A1614]/15 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#1A1614]/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1A1614] flex items-center justify-center">
                <BookOpen className="w-4.5 h-4.5 text-[#F9F6EE]" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h2 className="font-serif font-bold text-lg text-[#1A1614] leading-tight">
                  {selectedPlatform ? `Export for ${selectedPlatform.name}` : "Export Manuscript"}
                </h2>
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mt-0.5">
                  {selectedPlatform ? selectedPlatform.subtitle : "Choose a publishing platform"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#1A1614]/8 transition-colors text-[#7A6B5E] hover:text-[#1A1614]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step tabs */}
          <div className="flex border-b border-[#1A1614]/10 shrink-0">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => {
                  if (i < stepIndex && (s !== "checklist" || platform)) setStep(s);
                }}
                disabled={i > stepIndex}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-[0.12em] transition-colors border-b-2 -mb-px ${
                  step === s
                    ? "border-[#E8B84B] text-[#1A1614]"
                    : i < stepIndex
                    ? "border-transparent text-[#7A6B5E] hover:text-[#1A1614] cursor-pointer"
                    : "border-transparent text-[#1A1614]/25 cursor-default"
                }`}
              >
                {i + 1}. {STEP_LABELS[i]}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">

              {/* ── PLATFORM SELECTION ── */}
              {step === "platform" && (
                <motion.div
                  key="platform"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="p-6 space-y-3"
                >
                  <p className="text-sm text-[#7A6B5E] mb-4">
                    Choose where you're publishing. Each platform has different submission requirements — we'll walk you through them.
                  </p>

                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setPlatform(p.id); setStep("checklist"); }}
                      className={`w-full flex items-center gap-4 p-4 border-2 text-left transition-all hover:border-[#E8B84B] hover:shadow-sm group ${
                        platform === p.id ? "border-[#E8B84B] bg-[#E8B84B]/5" : "border-[#1A1614]/15 bg-white"
                      }`}
                    >
                      <span className="text-2xl">{p.logo}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#1A1614]">{p.name}</p>
                        <p className="text-xs text-[#7A6B5E]">{p.subtitle}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#7A6B5E]/40 group-hover:text-[#1A1614] shrink-0 transition-colors" />
                    </button>
                  ))}

                  <div className="pt-3 border-t border-[#1A1614]/10">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#7A6B5E] mb-2">Or just download a copy</p>
                    <button
                      onClick={() => handleDownload("pdf")}
                      disabled={downloading !== null}
                      className="w-full flex items-center gap-4 p-4 border border-dashed border-[#1A1614]/20 bg-white text-left transition-all hover:border-[#1A1614]/40 hover:shadow-sm group"
                    >
                      <div className="w-8 h-8 bg-[#1A1614]/6 flex items-center justify-center shrink-0">
                        <FileDown className="w-4 h-4 text-[#7A6B5E]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#1A1614]">
                          {downloading === "pdf" ? "Generating PDF…" : "Download as PDF"}
                        </p>
                        <p className="text-xs text-[#7A6B5E]">A4, print-ready — no publishing submission needed</p>
                      </div>
                      {downloading === "pdf"
                        ? <div className="w-4 h-4 border-2 border-[#7A6B5E]/30 border-t-[#7A6B5E] rounded-full animate-spin shrink-0" />
                        : <Download className="w-4 h-4 text-[#7A6B5E]/40 group-hover:text-[#1A1614] shrink-0 transition-colors" />
                      }
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── CHECKLIST ── */}
              {step === "checklist" && platform && (
                <motion.div
                  key="checklist"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="p-6 space-y-3"
                >
                  <p className="text-sm text-[#7A6B5E] mb-4">
                    Review these requirements before exporting. {selectedPlatform?.name} needs all of these to list your book.
                  </p>
                  {checks.map((c) => (
                    <div
                      key={c.label}
                      className={`flex items-start gap-3 p-3 border ${
                        c.passed
                          ? "border-emerald-200 bg-emerald-50/60"
                          : "border-amber-200 bg-amber-50/60"
                      }`}
                    >
                      {c.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${c.passed ? "text-emerald-800" : "text-amber-800"}`}>
                          {c.label}
                        </p>
                        {c.hint && !c.passed && (
                          <p className="text-xs text-amber-700 mt-0.5">{c.hint}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="pt-2">
                    <div className="w-full bg-[#1A1614]/10 h-1.5">
                      <div
                        className="h-full bg-[#E8B84B] transition-all"
                        style={{ width: `${(passedCount / checks.length) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#7A6B5E] mt-2">
                      {passedCount} of {checks.length} requirements met
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setStep("platform")}
                      className="flex items-center gap-1.5 px-4 py-2.5 border border-[#1A1614]/20 text-[11px] uppercase tracking-[0.12em] font-bold text-[#7A6B5E] hover:text-[#1A1614] hover:border-[#1A1614] transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <Button
                      onClick={() => setStep("export")}
                      className="flex-1 h-10 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        Continue to Export <ChevronRight className="w-4 h-4" />
                      </span>
                    </Button>
                  </div>
                  {!allPassed && (
                    <button
                      onClick={() => setStep("export")}
                      className="w-full text-xs text-[#7A6B5E] hover:text-[#1A1614] transition-colors text-center"
                    >
                      Skip to export anyway
                    </button>
                  )}
                </motion.div>
              )}

              {/* ── EXPORT ── */}
              {step === "export" && platform && nextSteps && (
                <motion.div
                  key="export"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="p-6 space-y-5"
                >
                  <p className="text-sm text-[#7A6B5E]">
                    Download your manuscript, then follow the steps below to submit it to {selectedPlatform?.name}.
                  </p>

                  {/* EPUB — available for all platforms */}
                  <div className="border border-[#1A1614]/15 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-[#E8B84B]/15 flex items-center justify-center shrink-0">
                        <FileCode2 className="w-4 h-4 text-[#E8B84B]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#1A1614]">EPUB
                          <span className="ml-2 text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">Recommended</span>
                        </p>
                        <p className="text-xs text-[#7A6B5E] mt-0.5">
                          {platform === "kdp"
                            ? "KDP's preferred format. Produces the best Kindle reading experience with reflowable text."
                            : platform === "kobo"
                            ? "Kobo Writing Life accepts EPUB only. This is the format you'll upload directly."
                            : "Apple Books requires EPUB format. Upload this file directly to Books for Authors."}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownload("epub")}
                      disabled={downloading !== null}
                      className="w-full mt-3 h-9 text-xs gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {downloading === "epub" ? "Generating…" : `Download ${project.title.slice(0, 24)}.epub`}
                    </Button>
                  </div>

                  {/* DOCX — KDP only */}
                  {platform === "kdp" && (
                    <div className="border border-[#1A1614]/15 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-[#7A6B5E]/10 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-[#7A6B5E]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[#1A1614]">Microsoft Word (DOCX)</p>
                          <p className="text-xs text-[#7A6B5E] mt-0.5">
                            Good for further editing before upload. KDP will convert it to Kindle format automatically.
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleDownload("docx")}
                        disabled={downloading !== null}
                        className="w-full mt-3 h-9 text-xs gap-2 border-[#1A1614]/20 text-[#1A1614] hover:bg-[#1A1614]/5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {downloading === "docx" ? "Generating…" : `Download ${project.title.slice(0, 24)}.docx`}
                      </Button>
                    </div>
                  )}

                  {/* Next steps */}
                  <div className="border border-[#1A1614]/10 bg-[#1A1614]/3 p-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A6B5E]">
                      Next steps on {selectedPlatform?.name}
                    </p>
                    <ol className="text-xs text-[#7A6B5E] space-y-1.5 list-decimal list-inside leading-relaxed">
                      {nextSteps.steps.map((s, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: s.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#1A1614]">$1</strong>') }} />
                      ))}
                    </ol>
                    <a
                      href={nextSteps.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 w-full h-9 border border-[#1A1614]/25 text-xs font-bold uppercase tracking-[0.12em] text-[#1A1614] hover:bg-[#1A1614]/5 transition-colors"
                    >
                      {nextSteps.urlLabel} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <button
                    onClick={() => setStep("platform")}
                    className="flex items-center gap-1.5 text-xs text-[#7A6B5E] hover:text-[#1A1614] transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Switch platform
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
