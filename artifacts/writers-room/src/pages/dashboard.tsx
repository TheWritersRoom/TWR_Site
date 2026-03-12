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
import { Button } from "@/components/ui/button";

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
        // Strip RTF control codes for a best-effort plain text extraction
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
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      import.meta.url
    ).toString();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
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

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<CreationMode | null>(null);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", user?.id],
    enabled: !!user,
    queryFn: () =>
      fetch(`/api/projects?userId=${user!.id}`).then((r) => r.json()),
  });

  const createProject = useCreateProject();
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"book" | "script">("book");
  const [newContent, setNewContent] = useState("");

  // Upload state
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
    setUploadedFile(null);
    setExtractError("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle || !newContent) return;

    await createProject.mutateAsync({
      data: { title: newTitle, type: newType, content: newContent, userId: user.id },
    });

    queryClient.invalidateQueries({ queryKey: ["/api/projects", user?.id] });
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground tracking-tight">Your Projects</h1>
          <p className="text-muted-foreground mt-2 text-lg flex items-center gap-2">
            {user?.role === "contributor"
              ? `Welcome back, ${user?.name.split(" ")[0]}. You're contributing to others' projects.`
              : `Continue where you left off, ${user?.name.split(" ")[0]}.`}
            <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              user?.role === "author"
                ? "bg-blue-100 text-blue-700"
                : user?.role === "contributor"
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            }`}>
              {user?.role === "author" ? "Author" : user?.role === "contributor" ? "Contributor" : "Author & Contributor"}
            </span>
          </p>
        </div>
        {!mode && user?.role !== "contributor" && (
          <Button onClick={() => setMode("choose")} size="lg" className="rounded-full shadow-lg">
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        )}
      </header>

      <AnimatePresence mode="wait">
        {mode === "choose" && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mb-10 bg-card rounded-3xl border border-border shadow-xl shadow-black/5 overflow-hidden"
          >
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <h2 className="text-2xl font-serif font-bold">Start a new project</h2>
              <button onClick={resetForm} className="p-2 rounded-full hover:bg-accent transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              <button
                onClick={() => setMode("upload")}
                className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/30 transition-all text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-serif font-bold text-xl text-foreground">Upload a file</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Import from <span className="font-medium text-foreground">PDF, DOCX, TXT, MD, RTF</span>
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>

              <button
                onClick={() => setMode("write")}
                className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/30 transition-all text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <PenLine className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-serif font-bold text-xl text-foreground">Start writing</p>
                  <p className="text-sm text-muted-foreground mt-1">Begin with a blank page</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
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
            className="mb-10 bg-card rounded-3xl border border-border shadow-xl shadow-black/5 overflow-hidden"
          >
            <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-border">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMode("choose")}
                  className="p-1.5 rounded-full hover:bg-accent transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
                </button>
                <h2 className="text-2xl font-serif font-bold">
                  {mode === "upload" ? "Upload your manuscript" : "Start a new draft"}
                </h2>
              </div>
              <button onClick={resetForm} className="p-2 rounded-full hover:bg-accent transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-8 space-y-5">
              {/* Title + Type row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-3">
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Title</label>
                  <input
                    type="text"
                    placeholder="Project title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background border-2 border-input focus:border-primary outline-none text-lg font-medium transition-colors"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as "book" | "script")}
                    className="w-full px-4 py-3 rounded-xl bg-background border-2 border-input focus:border-primary outline-none text-base transition-colors h-[52px]"
                  >
                    <option value="book">📖 Book</option>
                    <option value="script">🎬 Script</option>
                  </select>
                </div>
              </div>

              {/* Upload zone (upload mode only) */}
              {mode === "upload" && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">File</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center gap-3 px-6 py-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                      isDragging
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : uploadedFile
                        ? "border-green-400 bg-green-50/50"
                        : "border-input hover:border-primary/50 hover:bg-accent/20"
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
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-sm font-medium text-muted-foreground">Extracting text…</p>
                      </>
                    ) : uploadedFile && !extractError ? (
                      <>
                        <FileUp className="w-10 h-10 text-green-600" />
                        <div className="text-center">
                          <p className="font-semibold text-foreground">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {(uploadedFile.size / 1024).toFixed(1)} KB — text extracted successfully
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setNewContent(""); }}
                          className="text-xs text-muted-foreground underline hover:text-foreground"
                        >
                          Remove file
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-muted-foreground" />
                        <div className="text-center">
                          <p className="font-medium text-foreground">Drop your file here or click to browse</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Supports <span className="font-semibold">PDF, DOCX, TXT, MD, RTF</span>
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {extractError && (
                    <p className="mt-2 text-sm text-destructive flex items-center gap-1.5">
                      <X className="w-4 h-4" /> {extractError}
                    </p>
                  )}
                </div>
              )}

              {/* Content textarea */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Content
                  {mode === "upload" && uploadedFile && !extractError && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      — extracted from {uploadedFile.name}, you can edit below
                    </span>
                  )}
                </label>
                <textarea
                  placeholder={mode === "upload" ? "Content will appear here after upload…" : "Start typing your manuscript…"}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl bg-background border-2 border-input focus:border-primary outline-none font-serif text-base min-h-[240px] resize-y transition-colors"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
                <Button
                  type="submit"
                  disabled={createProject.isPending || !newTitle || !newContent}
                  className="px-8"
                >
                  {createProject.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</>
                  ) : "Save Project"}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {projects?.length === 0 && !mode ? (
        <div className="text-center py-20 px-4 bg-card rounded-3xl border border-border shadow-sm">
          <img
            src={`${import.meta.env.BASE_URL}images/empty-desk.png`}
            alt="No projects yet"
            className="w-72 h-auto mx-auto mb-8 rounded-2xl opacity-95"
          />
          <h3 className="text-2xl font-serif font-semibold text-foreground">No projects yet</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Your workspace is clear. Upload a manuscript or start writing to begin collaborating.
          </p>
          {user?.role !== "contributor" && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button onClick={() => setMode("upload")} variant="outline" className="rounded-full gap-2">
                <Upload className="w-4 h-4" /> Upload file
              </Button>
              <Button onClick={() => setMode("write")} className="rounded-full gap-2">
                <PenLine className="w-4 h-4" /> Start writing
              </Button>
            </div>
          )}
          {user?.role === "contributor" && (
            <p className="text-sm text-muted-foreground mt-4">
              Ask an author to invite you to their project to get started.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={project.id}
            >
              <Link
                href={`/project/${project.id}`}
                className="block h-full bg-card rounded-3xl p-6 border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-2xl bg-accent/50 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {project.type === "book" ? <BookText className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>
                  {project.pendingSuggestionsCount > 0 && (
                    <div className="flex items-center gap-1.5 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                      <MessageSquareQuote className="w-3.5 h-3.5" />
                      {project.pendingSuggestionsCount} Pending
                    </div>
                  )}
                </div>

                <h3 className="text-2xl font-serif font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {project.title}
                </h3>

                <div className="mt-6 space-y-2 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-foreground">
                        {project.ownerName.charAt(0)}
                      </div>
                      {project.ownerName}
                    </span>
                    <span>
                      {project.collaboratorsCount}{" "}
                      {project.collaboratorsCount === 1 ? "collab" : "collabs"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
