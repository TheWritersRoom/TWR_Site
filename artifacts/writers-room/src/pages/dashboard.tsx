import { useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, BookText, FileText, MessageSquareQuote, Calendar,
  Upload, PenLine, X, FileUp, Loader2, ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateProject } from "@workspace/api-client-react";
import type { Project } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      pages.push(pageText);
    }
    return pages.join("\n\n");
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
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<CreationMode | null>(null);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", user?.id],
    enabled: !!user,
    queryFn: () => fetch(`/api/projects?userId=${user!.id}`).then((r) => r.json()),
  });

  const createProject = useCreateProject();
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"book" | "script">("book");
  const [newContent, setNewContent] = useState("");
  const [newLimit, setNewLimit] = useState(6);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
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
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle || !newContent) return;
    await createProject.mutateAsync({
      data: { title: newTitle, type: newType, content: newContent, userId: user.id, collaboratorLimit: newLimit } as any,
    });
    queryClient.invalidateQueries({ queryKey: ["/api/projects", user?.id] });
    resetForm();
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

      {/* Page header */}
      <header className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">
          {user?.role === "contributor" ? "Contributor View" : "Your Workspace"}
        </p>
        <div className="border-t-2 border-[#1A1614] mb-3" />
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold text-[#1A1614]">Your Projects</h1>
            <p className="text-[#7A6B5E] mt-1 text-base">
              {user?.role === "contributor"
                ? `Welcome back, ${user?.name.split(" ")[0]}. You're contributing to others' projects.`
                : `Continue where you left off, ${user?.name.split(" ")[0]}.`}
            </p>
          </div>
          {!mode && user?.role !== "contributor" && (
            <button
              onClick={() => setMode("choose")}
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
                  disabled={createProject.isPending || !newTitle || !newContent}
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
            src={`${import.meta.env.BASE_URL}images/empty-desk.png`}
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
            >
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
    </div>
  );
}
