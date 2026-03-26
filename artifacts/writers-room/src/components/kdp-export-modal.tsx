import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Download, BookOpen, CheckCircle2, AlertCircle,
  ExternalLink, FileText, FileCode2, ChevronRight,
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

type CheckItem = {
  label: string;
  passed: boolean;
  hint?: string;
};

function countWords(text: string): number {
  const stripped = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return stripped ? stripped.split(" ").filter(Boolean).length : 0;
}

export function KdpExportModal({
  project,
  userId,
  onClose,
}: {
  project: Project;
  userId: number;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState<"epub" | "docx" | null>(null);
  const [step, setStep] = useState<"checklist" | "export">("checklist");

  const wordCount = useMemo(() => countWords(project.content ?? ""), [project.content]);

  let parsedGenres: string[] = [];
  try { parsedGenres = JSON.parse(project.genres ?? "[]"); } catch {}

  const checks: CheckItem[] = [
    {
      label: "Title set",
      passed: !!project.title?.trim(),
      hint: "Your project title becomes the Kindle book title.",
    },
    {
      label: "Author name set",
      passed: !!project.ownerName?.trim(),
      hint: "Your display name is used as the author.",
    },
    {
      label: "Synopsis / description",
      passed: !!project.synopsis?.trim(),
      hint: "KDP requires a book description. Edit it in your project settings.",
    },
    {
      label: "Genre tags added",
      passed: parsedGenres.length > 0,
      hint: "Genre tags help KDP categorise your book.",
    },
    {
      label: `Word count (${wordCount.toLocaleString()} words)`,
      passed: wordCount >= 2500,
      hint: wordCount < 2500
        ? `KDP requires at least 2,500 words for most formats (yours: ${wordCount.toLocaleString()}).`
        : "Your manuscript meets KDP's minimum length.",
    },
    {
      label: "Prose project (not a script)",
      passed: project.type !== "script",
      hint: "KDP is for novels, non-fiction, and other prose. Scripts use different publishing paths.",
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const allPassed = passedCount === checks.length;

  const handleDownload = async (format: "epub" | "docx") => {
    setDownloading(format);
    try {
      const res = await fetch(`/api/projects/${project.id}/export/${format}?userId=${userId}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const ext = format === "epub" ? "epub" : "docx";
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
                <h2 className="font-serif font-bold text-lg text-[#1A1614] leading-tight">Prepare for Amazon KDP</h2>
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mt-0.5">Kindle Direct Publishing</p>
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
            {(["checklist", "export"] as const).map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-[0.12em] transition-colors border-b-2 -mb-px ${
                  step === s
                    ? "border-[#E8B84B] text-[#1A1614]"
                    : "border-transparent text-[#7A6B5E] hover:text-[#1A1614]"
                }`}
              >
                {i + 1}. {s === "checklist" ? "Pre-flight check" : "Export & submit"}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {step === "checklist" && (
                <motion.div
                  key="checklist"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="p-6 space-y-3"
                >
                  <p className="text-sm text-[#7A6B5E] mb-4">
                    Review these requirements before exporting. KDP needs all of these to list your book.
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

                  <Button
                    onClick={() => setStep("export")}
                    className="w-full mt-4 h-11 text-sm"
                    disabled={!allPassed}
                  >
                    <span className="flex items-center gap-2">
                      Continue to Export <ChevronRight className="w-4 h-4" />
                    </span>
                  </Button>
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

              {step === "export" && (
                <motion.div
                  key="export"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="p-6 space-y-5"
                >
                  <p className="text-sm text-[#7A6B5E]">
                    Download your manuscript in a KDP-compatible format, then upload it on Amazon's publishing dashboard.
                  </p>

                  {/* EPUB */}
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
                          KDP's preferred format. Produces the best Kindle reading experience with reflowable text.
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

                  {/* DOCX */}
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

                  {/* KDP handoff */}
                  <div className="border border-[#1A1614]/10 bg-[#1A1614]/3 p-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A6B5E]">Next steps on KDP</p>
                    <ol className="text-xs text-[#7A6B5E] space-y-1.5 list-decimal list-inside leading-relaxed">
                      <li>Sign in or create your account on Amazon KDP</li>
                      <li>Click <strong className="text-[#1A1614]">+ Create</strong> → <strong className="text-[#1A1614]">Kindle eBook</strong></li>
                      <li>Enter your title, author, description and keywords</li>
                      <li>Upload your EPUB or DOCX file in the <em>Kindle eBook Content</em> step</li>
                      <li>Set your pricing and territories, then publish</li>
                    </ol>
                    <a
                      href="https://kdp.amazon.com/en_US/title-setup/kindle/new/details"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 w-full h-9 border border-[#1A1614]/25 text-xs font-bold uppercase tracking-[0.12em] text-[#1A1614] hover:bg-[#1A1614]/5 transition-colors"
                    >
                      Open Amazon KDP <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
