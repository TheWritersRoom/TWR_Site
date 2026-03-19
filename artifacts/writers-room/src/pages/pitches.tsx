import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import {
  Lightbulb, Plus, Search, BookText, FileText, Shapes,
  MessageCircle, HandHeart, X, ChevronRight, Check
} from "lucide-react";

const GENRES = [
  "Film & TV Script", "Long-form Fiction", "Non-fiction", "Short Story",
  "Poetry", "Fan Fiction", "Screenwriting", "Graphic Novel / Comics",
  "Children's Literature", "Literary Fiction", "Thriller / Mystery",
  "Romance", "Science Fiction / Fantasy", "Horror",
];

type PitchSummary = {
  id: number;
  title: string;
  description: string;
  type: "book" | "script" | "other";
  genres: string;
  status: "open" | "closed";
  ownerId: number;
  ownerName: string;
  createdAt: string;
  feedbackCount: number;
  interestCount: number;
};

const TYPE_META = {
  book:   { label: "Book",        icon: <BookText className="w-3.5 h-3.5" /> },
  script: { label: "Script",      icon: <FileText className="w-3.5 h-3.5" /> },
  other:  { label: "Open format", icon: <Shapes className="w-3.5 h-3.5" /> },
};

const inputCls = "w-full px-4 py-3 bg-white border-2 border-[#1A1614]/20 focus:border-[#1A1614] outline-none text-sm transition-colors text-[#1A1614] placeholder:text-[#7A6B5E]";

function NewPitchForm({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"book" | "script" | "other">("other");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleGenre = (g: string) =>
    setSelectedGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !description) return;
    setSubmitting(true);
    try {
      await fetch("/api/pitches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, type,
          genres: JSON.stringify(selectedGenres),
          userId: user.id,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pitches"] });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-white border-2 border-[#1A1614] mb-8 overflow-hidden"
    >
      <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b border-[#1A1614]/15">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-[#E8B84B]" />
          <h2 className="text-xl font-serif font-bold text-[#1A1614]">New Pitch</h2>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-[#1A1614]/5 transition-colors">
          <X className="w-4 h-4 text-[#7A6B5E]" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-7 space-y-6">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-2">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A working title for your idea…"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-2">Describe your idea</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="What's the story? What themes are you exploring? What kind of collaborator are you looking for?"
            className={inputCls + " resize-none"}
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-3">Format</label>
          <div className="flex gap-2">
            {(["book", "script", "other"] as const).map((t) => {
              const m = TYPE_META[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] border-2 transition-all ${
                    type === t
                      ? "border-[#1A1614] bg-[#1A1614] text-[#F9F6EE]"
                      : "border-[#1A1614]/20 text-[#7A6B5E] hover:border-[#1A1614]"
                  }`}
                >
                  {m.icon} {m.label}
                </button>
              );
            })}
          </div>
        </div>

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
                      : "bg-white border-[#1A1614]/20 text-[#7A6B5E] hover:border-[#1A1614]"
                  }`}
                >
                  {sel && <Check className="w-3 h-3" />}
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-[#1A1614]/10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-[#1A1614]/25 text-[#7A6B5E] text-[11px] uppercase tracking-[0.14em] font-bold hover:border-[#1A1614] hover:text-[#1A1614] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title || !description || submitting}
            className="px-6 py-2.5 bg-[#1A1614] text-[#F9F6EE] text-[11px] uppercase tracking-[0.14em] font-bold hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors disabled:opacity-40"
          >
            {submitting ? "Posting…" : "Post Pitch"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

export default function Pitches() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "book" | "script" | "other">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("open");
  const [showForm, setShowForm] = useState(false);

  const isAuthor = user?.role === "author" || user?.role === "both";

  const { data: pitches = [], isLoading } = useQuery<PitchSummary[]>({
    queryKey: ["/api/pitches"],
    enabled: !!user,
    queryFn: () => fetch("/api/pitches").then((r) => r.json()),
  });

  const filtered = pitches.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !p.title.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q) &&
        !(p.ownerName ?? "").toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">Ideas in progress</p>
        <div className="border-t-2 border-[#1A1614] mb-3" />
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold text-[#1A1614]">Pitches</h1>
            <p className="text-[#7A6B5E] mt-1">Early-stage ideas looking for feedback and collaborators</p>
          </div>
          {isAuthor && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1A1614] text-[#F9F6EE] text-[11px] uppercase tracking-[0.14em] font-bold hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> New Pitch
            </button>
          )}
        </div>
        <div className="border-t border-[#1A1614]/15 mt-4" />
      </motion.div>

      {/* New pitch form */}
      <AnimatePresence>
        {showForm && <NewPitchForm onClose={() => setShowForm(false)} />}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6B5E]" />
          <input
            type="text"
            placeholder="Search pitches…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#1A1614]/20 text-sm focus:border-[#1A1614] focus:outline-none text-[#1A1614]"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(["all", "open", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] border transition-all ${
                statusFilter === s
                  ? "bg-[#1A1614] text-[#F9F6EE] border-[#1A1614]"
                  : "bg-white text-[#7A6B5E] border-[#1A1614]/20 hover:border-[#1A1614]"
              }`}
            >
              {s === "all" ? "All statuses" : s}
            </button>
          ))}
          {(["all", "book", "script", "other"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] border transition-all ${
                typeFilter === t
                  ? "bg-[#1A1614] text-[#F9F6EE] border-[#1A1614]"
                  : "bg-white text-[#7A6B5E] border-[#1A1614]/20 hover:border-[#1A1614]"
              }`}
            >
              {t === "all" ? "All formats" : t === "other" ? "Open" : t === "book" ? "Book" : "Script"}
            </button>
          ))}
        </div>
      </div>

      {!isLoading && pitches.length > 0 && (
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-5">
          Showing <span className="text-[#1A1614]">{filtered.length}</span> of{" "}
          <span className="text-[#1A1614]">{pitches.length}</span> pitches
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-b-2 border-[#1A1614] animate-spin rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#1A1614]/15 p-16 text-center">
          <Lightbulb className="w-12 h-12 text-[#7A6B5E] mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-serif font-bold text-[#1A1614]">
            {pitches.length === 0 ? "No pitches yet" : "No results found"}
          </h3>
          <p className="text-sm text-[#7A6B5E] mt-2 max-w-sm mx-auto">
            {pitches.length === 0
              ? isAuthor
                ? 'Be the first to share an idea. Click "New Pitch" above.'
                : "Authors will post their ideas here. Check back soon."
              : "Try adjusting your search or filters."}
          </p>
          {isAuthor && pitches.length === 0 && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1614] text-[#F9F6EE] text-[11px] uppercase tracking-[0.14em] font-bold hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors"
            >
              <Plus className="w-4 h-4" /> Post your first pitch
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((p, i) => {
            const tm = TYPE_META[p.type] ?? TYPE_META.other;
            let genres: string[] = [];
            try { genres = JSON.parse(p.genres); } catch {}
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white border border-[#1A1614]/15 p-5 hover:border-[#E8B84B] transition-colors flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif font-bold text-[#1A1614] leading-tight">{p.title}</h3>
                  <div className="flex gap-1.5 shrink-0">
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 border border-[#1A1614]/20 text-[#7A6B5E] uppercase tracking-[0.1em]">
                      {tm.icon} {tm.label}
                    </span>
                    <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 uppercase tracking-[0.1em] ${
                      p.status === "open"
                        ? "bg-[#1A1614] text-[#F9F6EE]"
                        : "border border-[#1A1614]/20 text-[#7A6B5E]"
                    }`}>
                      {p.status === "open" ? "Open" : "Closed"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#1A1614] flex items-center justify-center text-[#F9F6EE] text-[9px] font-bold shrink-0">
                    {(p.ownerName ?? "?").charAt(0)}
                  </div>
                  <span className="text-sm text-[#7A6B5E]">
                    <span className="font-bold text-[#1A1614]">{p.ownerName}</span>
                    {" · "}{format(new Date(p.createdAt), "d MMM yyyy")}
                  </span>
                </div>

                <p className="text-sm text-[#7A6B5E] line-clamp-3 leading-relaxed">{p.description}</p>

                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {genres.slice(0, 4).map((g) => (
                      <span key={g} className="text-[10px] font-semibold px-2 py-0.5 border border-[#1A1614]/15 text-[#7A6B5E]">{g}</span>
                    ))}
                    {genres.length > 4 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 border border-[#1A1614]/15 text-[#7A6B5E]">+{genres.length - 4}</span>
                    )}
                  </div>
                )}

                <div className="mt-auto pt-3 border-t border-[#1A1614]/10 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-[#7A6B5E]">
                    <span className="flex items-center gap-1">
                      <HandHeart className="w-3.5 h-3.5 text-[#F7C5D5]" /> {p.interestCount} interested
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-[#E8B84B]" /> {p.feedbackCount} feedback
                    </span>
                  </div>
                  <Link
                    href={`/pitch/${p.id}`}
                    className="text-[10px] uppercase tracking-[0.14em] font-bold text-[#1A1614] hover:text-[#E8B84B] transition-colors flex items-center gap-1"
                  >
                    View <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
