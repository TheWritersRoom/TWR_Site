import { useState, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, BookText, FileText, MessageSquareQuote, Calendar,
  Upload, PenLine, X, FileUp, Loader2, ChevronRight, AlignLeft, Check,
  Shield, Users as UsersIcon, Zap, Trash2, LayoutGrid, Film, BookOpen, ArrowRight,
} from "lucide-react";
import { InkBadge } from "@/components/ink-badge";

import { useAuth } from "@/hooks/use-auth";
import { useCreateProject } from "@workspace/api-client-react";
import type { Project } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UpgradeModal } from "@/components/upgrade-modal";

const GENRES = [
  "Long-form Fiction", "Non-fiction", "Short Story", "Poetry",
  "Fan Fiction", "Graphic Novel / Comics", "Children's Literature",
  "Literary Fiction", "Thriller / Mystery", "Romance",
  "Science Fiction / Fantasy", "Horror",
  "Film & TV Script", "Screenwriting",
];

type CreationMode = "choose" | "write" | "upload";

async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "txt" || ext === "md") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
  if (ext === "rtf") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const raw = e.target?.result as string;
        const text = raw
          .replace(/\{[^{}]*\}/g, "")
          .replace(/\\[a-z]+\d*\s?/gi, "")
          .replace(/[{}\\]/g, "")
          .replace(/\r\n|\r/g, "\n")
          .trim();
        resolve(text);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
  if (ext === "pdf") {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageTexts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items as any[];
      if (!items.length) { pageTexts.push(""); continue; }

      // Group text items into lines by Y coordinate (rounded to integer)
      const buckets = new Map<number, string[]>();
      const ys: number[] = [];
      for (const item of items) {
        if (!item.str) continue;
        const y = Math.round(item.transform[5]);
        if (!buckets.has(y)) { buckets.set(y, []); ys.push(y); }
        buckets.get(y)!.push(item.str);
      }

      // Sort Y descending = top-to-bottom reading order
      ys.sort((a, b) => b - a);
      const lineObjs = ys
        .map(y => ({ y, text: buckets.get(y)!.join("").trim() }))
        .filter(l => l.text);

      // Find median line gap to detect paragraph breaks (gap > 1.8× median)
      const gaps: number[] = [];
      for (let j = 0; j < lineObjs.length - 1; j++) gaps.push(lineObjs[j].y - lineObjs[j + 1].y);
      const medianGap = gaps.length
        ? [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)]
        : 12;

      const lines: string[] = [];
      for (let j = 0; j < lineObjs.length; j++) {
        lines.push(lineObjs[j].text);
        if (j < lineObjs.length - 1 && lineObjs[j].y - lineObjs[j + 1].y > medianGap * 1.8) {
          lines.push(""); // blank line = paragraph break
        }
      }
      pageTexts.push(lines.join("\n"));
    }
    return pageTexts.join("\n\n");
  }
  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }
  throw new Error(`Unsupported file format: .${ext}`);
}

function guessTitleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const inputCls = "w-full px-4 py-3 bg-white border-2 border-[#1A1614]/20 focus:border-[#1A1614] outline-none text-base font-medium transition-colors text-[#1A1614]";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<CreationMode | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", user?.id],
    enabled: !!user,
    queryFn: () => fetch(`/api/projects?userId=${user!.id}`, { credentials: "include" }).then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }),
  });

  type PlannerSummary = {
    id: number; title: string; mediaType: string;
    cardCount: number; completeCount: number; updatedAt: string;
  };
  const { data: planners = [] } = useQuery<PlannerSummary[]>({
    queryKey: ["/api/planners", user?.id],
    enabled: !!user,
    queryFn: () => fetch(`/api/planners?userId=${user!.id}`, { credentials: "include" }).then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }),
  });

  const { data: inkData } = useQuery<{ balance: number }>({
    queryKey: ["/api/users", user?.id, "ink"],
    enabled: !!user,
    queryFn: () => fetch(`/api/users/${user!.id}/ink`, { credentials: "include" }).then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }),
  });

  const [showNewPlanner, setShowNewPlanner] = useState(false);
  const [newPlannerTitle, setNewPlannerTitle] = useState("");
  const [newPlannerType, setNewPlannerType] = useState<"tv" | "book" | "serial" | "other">("tv");
  const [creatingPlanner, setCreatingPlanner] = useState(false);

  const createPlanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPlannerTitle.trim()) return;
    setCreatingPlanner(true);
    try {
      const res = await fetch("/api/planners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: user.id, title: newPlannerTitle.trim(), mediaType: newPlannerType }),
      });
      const planner = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/planners", user?.id] });
      setShowNewPlanner(false);
      setNewPlannerTitle("");
      navigate(`/planner/${planner.id}`);
    } finally {
      setCreatingPlanner(false);
    }
  };

  const createProject = useCreateProject();
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"book" | "script">("book");
  const [newContent, setNewContent] = useState("");
  const [newLimit, setNewLimit] = useState(6);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [contentMode, setContentMode] = useState<"full" | "synopsis">("full");
  const [synopsis, setSynopsis] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const toggleGenre = (g: string) =>
    setSelectedGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  const [ownershipTerms, setOwnershipTerms] = useState<"sole" | "shared">("sole");
  const [ownershipNotes, setOwnershipNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ACCEPTED = ".txt,.md,.pdf,.docx,.rtf";

  const handleFileSelected = useCallback(async (file: File) => {
    setUploadedFile(file);
    setExtractError("");
    setExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      setNewContent(text);
      if (!newTitle) setNewTitle(guessTitleFromFilename(file.name));
    } catch (err: any) {
      setExtractError(err.message || "Could not read this file.");
      setNewContent("");
    } finally {
      setExtracting(false);
    }
  }, [newTitle]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  }, [handleFileSelected]);

  const resetForm = () => {
    setMode(null);
    setNewTitle("");
    setNewContent("");
    setNewType("book");
    setNewLimit(6);
    setUploadedFile(null);
    setExtractError("");
    setContentMode("full");
    setSynopsis("");
    setSelectedGenres([]);
    setOwnershipTerms("sole");
    setOwnershipNotes("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const canSubmit = newTitle && (contentMode === "full" ? newContent : synopsis);
    if (!user || !canSubmit) return;
    try {
      await createProject.mutateAsync({
        data: {
          title: newTitle,
          type: newType,
          content: newContent,
          userId: user.id,
          collaboratorLimit: newLimit,
          contentMode,
          synopsis: contentMode === "synopsis" ? synopsis : null,
          genres: JSON.stringify(selectedGenres),
          ownershipTerms,
          ownershipNotes: ownershipNotes.trim() || null,
        } as any,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", user?.id] });
      resetForm();
    } catch (err: any) {
      if (err?.status === 403 || err?.message?.includes("project_limit_reached")) {
        resetForm();
        setShowUpgradeModal(true);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="w-8 h-8 border-b-2 border-[#1A1614] animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}

      {/* Page header */}
      <header className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">
          {user?.role === "contributor" ? "Contributor View" : "Your Workspace"}
        </p>
        <div className="border-t-2 border-[#1A1614] mb-3" />
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl font-serif font-bold text-[#1A1614]">Your Projects</h1>
              {inkData != null && (
                <InkBadge balance={inkData.balance} size="sm" />
              )}
            </div>
            <p className="text-[#7A6B5E] mt-1 text-base">
              {user?.role === "contributor"
                ? `Welcome back, ${user?.name.split(" ")[0]}. You're contributing to others' projects.`
                : `Continue where you left off, ${user?.name.split(" ")[0]}.`}
            </p>
          </div>
          {!mode && user?.role !== "contributor" && (
            <button
              onClick={() => {
                const ownedProjects = (projects ?? []).filter(p => p.ownerId === user?.id);
                const tier = (user as any)?.subscriptionTier ?? "free";
                if (tier === "free" && ownedProjects.length >= 1) {
                  setShowUpgradeModal(true);
                } else {
                  setMode("choose");
                }
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1A1614] text-[#F9F6EE] text-[11px] uppercase tracking-[0.14em] font-bold hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
          )}
        </div>
        <div className="border-t border-[#1A1614]/15 mt-4" />
      </header>

      <AnimatePresence mode="wait">
        {mode === "choose" && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mb-10 bg-white border-2 border-[#1A1614] overflow-hidden"
          >
            <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-[#1A1614]/15">
              <h2 className="text-xl font-serif font-bold text-[#1A1614]">Start a new project</h2>
              <button onClick={resetForm} className="p-1.5 hover:bg-[#1A1614]/5 transition-colors">
                <X className="w-5 h-5 text-[#7A6B5E]" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <button
                onClick={() => setMode("upload")}
                className="group flex flex-col items-center gap-4 p-8 border-r border-[#1A1614]/15 hover:bg-[#E8B84B]/8 transition-all text-center"
              >
                <div className="w-14 h-14 border-2 border-[#1A1614]/20 flex items-center justify-center group-hover:border-[#E8B84B] group-hover:bg-[#E8B84B]/10 transition-colors">
                  <Upload className="w-7 h-7 text-[#1A1614]" />
                </div>
                <div>
                  <p className="font-serif font-bold text-lg text-[#1A1614]">Upload a file</p>
                  <p className="text-sm text-[#7A6B5E] mt-1">
                    Import from <span className="font-semibold text-[#1A1614]">PDF, DOCX, TXT, MD, RTF</span>
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode("write")}
                className="group flex flex-col items-center gap-4 p-8 hover:bg-[#F7C5D5]/15 transition-all text-center"
              >
                <div className="w-14 h-14 border-2 border-[#1A1614]/20 flex items-center justify-center group-hover:border-[#F7C5D5] group-hover:bg-[#F7C5D5]/20 transition-colors">
                  <PenLine className="w-7 h-7 text-[#1A1614]" />
                </div>
                <div>
                  <p className="font-serif font-bold text-lg text-[#1A1614]">Start writing</p>
                  <p className="text-sm text-[#7A6B5E] mt-1">Begin with a blank page</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {(mode === "upload" || mode === "write") && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mb-10 bg-white border-2 border-[#1A1614] overflow-hidden"
          >
            <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-[#1A1614]/15">
              <div className="flex items-center gap-3">
                <button onClick={() => setMode("choose")} className="p-1 hover:bg-[#1A1614]/5 transition-colors">
                  <ChevronRight className="w-4 h-4 text-[#7A6B5E] rotate-180" />
                </button>
                <h2 className="text-xl font-serif font-bold text-[#1A1614]">
                  {mode === "upload" ? "Upload your manuscript" : "Start a new draft"}
                </h2>
              </div>
              <button onClick={resetForm} className="p-1.5 hover:bg-[#1A1614]/5 transition-colors">
                <X className="w-5 h-5 text-[#7A6B5E]" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-3">
                  <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-2">Title</label>
                  <input
                    type="text"
                    placeholder="Project title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-2">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as "book" | "script")}
                    className={inputCls + " h-[52px]"}
                  >
                    <option value="book">Book</option>
                    <option value="script">Script</option>
                  </select>
                </div>
              </div>

              {/* Content sharing mode toggle */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-2">What to share with collaborators</label>
                <div className="grid grid-cols-2 gap-0 border-2 border-[#1A1614]/20 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setContentMode("full")}
                    className={`flex items-center gap-3 px-5 py-4 text-left transition-all border-r border-[#1A1614]/20 ${
                      contentMode === "full"
                        ? "bg-[#1A1614] text-[#F9F6EE]"
                        : "bg-white text-[#1A1614] hover:bg-[#F9F6EE]"
                    }`}
                  >
                    <FileText className="w-5 h-5 shrink-0 opacity-80" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] font-bold">Full text</p>
                      <p className={`text-xs mt-0.5 ${contentMode === "full" ? "text-[#F9F6EE]/70" : "text-[#7A6B5E]"}`}>
                        Collaborators read the entire manuscript
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentMode("synopsis")}
                    className={`flex items-center gap-3 px-5 py-4 text-left transition-all ${
                      contentMode === "synopsis"
                        ? "bg-[#1A1614] text-[#F9F6EE]"
                        : "bg-white text-[#1A1614] hover:bg-[#F9F6EE]"
                    }`}
                  >
                    <AlignLeft className="w-5 h-5 shrink-0 opacity-80" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] font-bold">Synopsis only</p>
                      <p className={`text-xs mt-0.5 ${contentMode === "synopsis" ? "text-[#F9F6EE]/70" : "text-[#7A6B5E]"}`}>
                        Share a summary — keep the full draft private
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Genre tags */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-3">
                  Genre tags
                  <span className="ml-2 normal-case tracking-normal font-normal text-[#7A6B5E]">— optional</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((g) => {
                    const sel = selectedGenres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGenre(g)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold border transition-all ${
                          sel
                            ? "bg-[#1A1614] text-[#F9F6EE] border-[#1A1614]"
                            : "bg-white border-[#1A1614]/20 text-[#7A6B5E] hover:border-[#1A1614] hover:text-[#1A1614]"
                        }`}
                      >
                        {sel && <Check className="w-3 h-3" />}
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {mode === "upload" && (
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-2">File</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center gap-3 px-6 py-10 border-2 border-dashed cursor-pointer transition-all ${
                      isDragging
                        ? "border-[#E8B84B] bg-[#E8B84B]/5"
                        : uploadedFile
                        ? "border-[#1A1614] bg-[#F9F6EE]"
                        : "border-[#1A1614]/25 hover:border-[#1A1614]/50 hover:bg-[#F9F6EE]"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelected(file);
                      }}
                    />
                    {extracting ? (
                      <>
                        <Loader2 className="w-10 h-10 text-[#1A1614] animate-spin" />
                        <p className="text-sm font-medium text-[#7A6B5E]">Extracting text…</p>
                      </>
                    ) : uploadedFile && !extractError ? (
                      <>
                        <FileUp className="w-10 h-10 text-[#1A1614]" />
                        <div className="text-center">
                          <p className="font-bold text-[#1A1614]">{uploadedFile.name}</p>
                          <p className="text-sm text-[#7A6B5E] mt-0.5">
                            {(uploadedFile.size / 1024).toFixed(1)} KB — text extracted
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setNewContent(""); }}
                          className="text-xs text-[#7A6B5E] underline hover:text-[#1A1614]"
                        >
                          Remove file
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-[#7A6B5E]" />
                        <div className="text-center">
                          <p className="font-medium text-[#1A1614]">Drop your file here or click to browse</p>
                          <p className="text-sm text-[#7A6B5E] mt-1">
                            Supports <span className="font-bold">PDF, DOCX, TXT, MD, RTF</span>
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  {extractError && (
                    <p className="mt-2 text-sm text-red-700 flex items-center gap-1.5">
                      <X className="w-4 h-4" /> {extractError}
                    </p>
                  )}
                </div>
              )}

              {contentMode === "synopsis" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-2">Synopsis</label>
                    <textarea
                      placeholder="Write a summary of your story, premise, or key ideas. Collaborators will see only this."
                      value={synopsis}
                      onChange={(e) => setSynopsis(e.target.value)}
                      className="w-full px-4 py-4 bg-white border-2 border-[#1A1614]/20 focus:border-[#1A1614] outline-none font-serif text-base min-h-[180px] resize-y transition-colors text-[#1A1614]"
                      required
                    />
                  </div>
                  {mode === "write" && (
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-2">
                        Manuscript
                        <span className="ml-2 text-[9px] font-normal text-[#7A6B5E] normal-case tracking-normal">— optional, stored privately</span>
                      </label>
                      <textarea
                        placeholder="Paste or type your draft here. Only you can see this."
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        className="w-full px-4 py-4 bg-white border-2 border-[#1A1614]/20 focus:border-[#1A1614] outline-none font-serif text-base min-h-[160px] resize-y transition-colors text-[#1A1614] opacity-70"
                      />
                    </div>
                  )}
                  {mode === "upload" && uploadedFile && !extractError && (
                    <p className="text-xs text-[#7A6B5E] flex items-center gap-1.5 bg-[#F9F6EE] px-3 py-2 border border-[#1A1614]/10">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      Manuscript text extracted and stored privately — only your synopsis will be visible to collaborators.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-2">
                    Content
                    {mode === "upload" && uploadedFile && !extractError && (
                      <span className="ml-2 text-[9px] font-normal text-[#7A6B5E] normal-case tracking-normal">
                        — extracted, you can edit below
                      </span>
                    )}
                  </label>
                  <textarea
                    placeholder={mode === "upload" ? "Content will appear here after upload…" : "Start typing your manuscript…"}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full px-4 py-4 bg-white border-2 border-[#1A1614]/20 focus:border-[#1A1614] outline-none font-serif text-base min-h-[240px] resize-y transition-colors text-[#1A1614]"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-1">Room size</label>
                <p className="text-xs text-[#7A6B5E] mb-3">Maximum number of collaborators you can invite.</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNewLimit(l => Math.max(1, l - 1))}
                    className="w-9 h-9 border-2 border-[#1A1614]/20 flex items-center justify-center hover:border-[#1A1614] transition-colors disabled:opacity-30"
                    disabled={newLimit <= 1}
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                  <span className="w-10 text-center text-xl font-bold text-[#1A1614] tabular-nums">{newLimit}</span>
                  <button
                    type="button"
                    onClick={() => setNewLimit(l => Math.min(50, l + 1))}
                    className="w-9 h-9 border-2 border-[#1A1614]/20 flex items-center justify-center hover:border-[#1A1614] transition-colors disabled:opacity-30"
                    disabled={newLimit >= 50}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-[#7A6B5E]">{newLimit === 1 ? "person" : "people"}</span>
                </div>
              </div>

              {/* Ownership Terms */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-1">Ownership Terms</label>
                <p className="text-xs text-[#7A6B5E] mb-3">
                  Set the intellectual property terms contributors agree to when joining this room.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-2 border-[#1A1614]/20 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOwnershipTerms("sole")}
                    className={`flex items-start gap-3 px-5 py-4 text-left transition-all border-b sm:border-b-0 sm:border-r border-[#1A1614]/20 ${
                      ownershipTerms === "sole"
                        ? "bg-[#1A1614] text-[#F9F6EE]"
                        : "bg-white text-[#1A1614] hover:bg-[#F9F6EE]"
                    }`}
                  >
                    <Shield className="w-5 h-5 shrink-0 mt-0.5 opacity-80" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] font-bold">Sole ownership</p>
                      <p className={`text-xs mt-1 leading-relaxed ${ownershipTerms === "sole" ? "text-[#F9F6EE]/70" : "text-[#7A6B5E]"}`}>
                        The author retains complete ownership of all work produced in this room.
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOwnershipTerms("shared")}
                    className={`flex items-start gap-3 px-5 py-4 text-left transition-all ${
                      ownershipTerms === "shared"
                        ? "bg-[#1A1614] text-[#F9F6EE]"
                        : "bg-white text-[#1A1614] hover:bg-[#F9F6EE]"
                    }`}
                  >
                    <UsersIcon className="w-5 h-5 shrink-0 mt-0.5 opacity-80" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] font-bold">Shared ownership</p>
                      <p className={`text-xs mt-1 leading-relaxed ${ownershipTerms === "shared" ? "text-[#F9F6EE]/70" : "text-[#7A6B5E]"}`}>
                        Ownership may be shared with contributors based on approved contributions in the final work.
                      </p>
                    </div>
                  </button>
                </div>
                {ownershipTerms === "shared" && (
                  <div className="mt-3">
                    <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-2">
                      Additional terms
                      <span className="ml-2 normal-case tracking-normal font-normal text-[#7A6B5E]">— optional</span>
                    </label>
                    <textarea
                      value={ownershipNotes}
                      onChange={(e) => setOwnershipNotes(e.target.value)}
                      placeholder="e.g. Contributors owning more than 20% of accepted edits will receive a credit and proportional royalty share…"
                      className="w-full px-4 py-3 bg-white border-2 border-[#1A1614]/20 focus:border-[#1A1614] outline-none text-sm min-h-[90px] resize-y transition-colors text-[#1A1614]"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-[#1A1614]/10">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 border border-[#1A1614]/25 text-[#7A6B5E] text-[11px] uppercase tracking-[0.14em] font-bold hover:border-[#1A1614] hover:text-[#1A1614] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProject.isPending || !newTitle || (contentMode === "full" ? !newContent : !synopsis)}
                  className="px-6 py-2.5 bg-[#1A1614] text-[#F9F6EE] text-[11px] uppercase tracking-[0.14em] font-bold hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors disabled:opacity-40"
                >
                  {createProject.isPending ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating…</span>
                  ) : "Save Project"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {projects?.length === 0 && !mode ? (
        <div className="text-center py-20 px-4 bg-white border-2 border-[#1A1614]/20">
          <img
            src={`${import.meta.env.BASE_URL}images/press-illustration.jpg`}
            alt="No projects yet"
            className="w-64 h-auto mx-auto mb-8 opacity-90"
          />
          <h3 className="text-2xl font-serif font-bold text-[#1A1614]">No projects yet</h3>
          <p className="text-[#7A6B5E] mt-2 max-w-md mx-auto">
            Your workspace is clear. Upload a manuscript or start writing to begin collaborating.
          </p>
          {user?.role !== "contributor" && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setMode("upload")}
                className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#1A1614] text-[#1A1614] text-[11px] uppercase tracking-[0.12em] font-bold hover:bg-[#1A1614] hover:text-[#F9F6EE] transition-colors"
              >
                <Upload className="w-4 h-4" /> Upload file
              </button>
              <button
                onClick={() => setMode("write")}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1614] text-[#F9F6EE] text-[11px] uppercase tracking-[0.12em] font-bold hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors"
              >
                <PenLine className="w-4 h-4" /> Start writing
              </button>
            </div>
          )}
          {user?.role === "contributor" && (
            <p className="text-sm text-[#7A6B5E] mt-4">
              Ask an author to invite you to their project to get started.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects?.map((project, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={project.id}
              className="relative group/card"
            >
              {user?.subscriptionTier === "pro" && project.ownerId === user?.id && (
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
                    await fetch(`/api/projects/${project.id}`, {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ userId: user.id }),
                    });
                    queryClient.invalidateQueries({ queryKey: ["/api/projects", user?.id] });
                  }}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-white border border-[#1A1614]/15 text-[#7A6B5E] hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors opacity-0 group-hover/card:opacity-100"
                  title="Delete project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <Link
                href={`/project/${project.id}`}
                className="block h-full bg-white border border-[#1A1614]/15 p-6 hover:border-[#E8B84B] hover:shadow-sm transition-all group"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className="p-2.5 border border-[#1A1614]/15 text-[#7A6B5E] group-hover:bg-[#E8B84B] group-hover:border-[#E8B84B] group-hover:text-[#1A1614] transition-colors">
                    {project.type === "book" ? <BookText className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  {project.pendingSuggestionsCount > 0 && (
                    <div className="flex items-center gap-1.5 bg-[#E8B84B]/20 text-[#1A1614] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]">
                      <MessageSquareQuote className="w-3 h-3" />
                      {project.pendingSuggestionsCount} Pending
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-serif font-bold text-[#1A1614] mb-2 line-clamp-2 group-hover:text-[#E8B84B] transition-colors">
                  {project.title}
                </h3>

                <div className="mt-6 space-y-2 pt-4 border-t border-[#1A1614]/10">
                  <div className="flex items-center justify-between text-sm text-[#7A6B5E]">
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#1A1614] flex items-center justify-center text-[#F9F6EE] text-[9px] font-bold">
                        {project.ownerName.charAt(0)}
                      </div>
                      {project.ownerName}
                    </span>
                    <span>{project.collaboratorsCount}{" "}{project.collaboratorsCount === 1 ? "collab" : "collabs"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#7A6B5E]">
                    <Calendar className="w-3.5 h-3.5" />
                    Updated {format(new Date(project.updatedAt), "MMM d, yyyy")}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Structure Planners section ── */}
      <section className="mt-16">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">Structure Planners</p>
            <div className="border-t-2 border-[#1A1614] mb-3" />
            <h2 className="text-2xl font-serif font-bold text-[#1A1614]">Plan your structure</h2>
            <p className="text-[#7A6B5E] text-sm mt-0.5">Map out episodes, chapters, or arcs before you write.</p>
          </div>
          <button
            onClick={() => setShowNewPlanner(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1614] text-[#F9F6EE] text-[11px] uppercase tracking-[0.14em] font-bold hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> New Planner
          </button>
        </div>

        <AnimatePresence>
          {showNewPlanner && (
            <motion.form
              key="new-planner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={createPlanner}
              className="mb-6 bg-white border-2 border-[#1A1614] px-6 py-5 flex flex-col sm:flex-row items-end gap-4"
            >
              <div className="flex-1 w-full">
                <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-1.5">Planner title</label>
                <input
                  autoFocus
                  value={newPlannerTitle}
                  onChange={(e) => setNewPlannerTitle(e.target.value)}
                  placeholder="e.g. Dark Waters — Series 1"
                  className="w-full px-4 py-2.5 bg-white border-2 border-[#1A1614]/20 focus:border-[#1A1614] outline-none text-sm font-medium text-[#1A1614]"
                />
              </div>
              <div className="w-full sm:w-44">
                <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-1.5">Type</label>
                <select
                  value={newPlannerType}
                  onChange={(e) => setNewPlannerType(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-white border-2 border-[#1A1614]/20 focus:border-[#1A1614] outline-none text-sm text-[#1A1614]"
                >
                  <option value="tv">TV Series</option>
                  <option value="book">Novel / Long-form</option>
                  <option value="serial">Serial Fiction</option>
                  <option value="other">Blank</option>
                </select>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowNewPlanner(false); setNewPlannerTitle(""); }}
                  className="px-4 py-2.5 border border-[#1A1614]/25 text-[#7A6B5E] text-[11px] uppercase tracking-[0.12em] font-bold hover:border-[#1A1614] hover:text-[#1A1614] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPlanner || !newPlannerTitle.trim()}
                  className="px-5 py-2.5 bg-[#1A1614] text-[#F9F6EE] text-[11px] uppercase tracking-[0.12em] font-bold hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors disabled:opacity-40"
                >
                  {creatingPlanner ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {planners.length === 0 && !showNewPlanner ? (
          <div className="border-2 border-dashed border-[#1A1614]/15 py-14 px-6 flex flex-col items-center gap-3 text-center">
            <LayoutGrid className="w-8 h-8 text-[#7A6B5E]/40" />
            <p className="text-[#1A1614] font-serif font-bold text-lg">No planners yet</p>
            <p className="text-sm text-[#7A6B5E] max-w-sm">
              Use a Structure Planner to map out your TV series, novel chapters, or serial arcs — episode by episode, card by card.
            </p>
            <button
              onClick={() => setShowNewPlanner(true)}
              className="mt-2 flex items-center gap-2 px-5 py-2 border-2 border-[#1A1614] text-[11px] uppercase tracking-[0.14em] font-bold text-[#1A1614] hover:bg-[#1A1614] hover:text-[#F9F6EE] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create your first planner
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {planners.map((p) => {
              const pct = p.cardCount ? Math.round((p.completeCount / p.cardCount) * 100) : 0;
              const MediaIcon = p.mediaType === "book" ? BookOpen : Film;
              return (
                <Link key={p.id} href={`/planner/${p.id}`}>
                  <div className="bg-white border border-[#1A1614]/15 px-6 py-4 flex items-center gap-5 hover:border-[#E8B84B] hover:shadow-sm transition-all cursor-pointer group">
                    <div className="p-2.5 border border-[#1A1614]/15 text-[#7A6B5E] group-hover:bg-[#E8B84B] group-hover:border-[#E8B84B] group-hover:text-[#1A1614] transition-colors shrink-0">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-serif font-bold text-base text-[#1A1614] group-hover:text-[#E8B84B] transition-colors truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {p.title}
                        </h3>
                        <span className="shrink-0 flex items-center gap-1 text-[10px] text-[#7A6B5E] border border-[#1A1614]/10 px-1.5 py-0.5 rounded-full">
                          <MediaIcon className="w-2.5 h-2.5" />
                          <span className="capitalize">{p.mediaType === "tv" ? "TV" : p.mediaType}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-1 bg-[#1A1614]/10 rounded-full overflow-hidden w-28">
                          <div className="h-full bg-[#E8B84B] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-[#7A6B5E]">
                          {p.completeCount}/{p.cardCount} complete · {p.cardCount} card{p.cardCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#7A6B5E]/30 group-hover:text-[#1A1614] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
