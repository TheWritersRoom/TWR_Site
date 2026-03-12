import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import {
  Lightbulb, Plus, Search, BookText, FileText, Shapes,
  MessageCircle, HandHeart, X, ChevronRight, Check, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  book:   { label: "Book", icon: <BookText className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-700" },
  script: { label: "Script", icon: <FileText className="w-3.5 h-3.5" />, color: "bg-violet-100 text-violet-700" },
  other:  { label: "Open format", icon: <Shapes className="w-3.5 h-3.5" />, color: "bg-muted text-muted-foreground" },
};

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
      className="bg-card border border-border rounded-3xl p-7 mb-8 shadow-md"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-serif font-bold text-foreground">New Pitch</h2>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-accent transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A working title for your idea…"
            className="w-full px-4 py-2.5 rounded-xl bg-background border-2 border-input focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Describe your idea
          </label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="What's the story? What themes are you exploring? What kind of collaborator are you looking for? The more detail you give, the better the responses you'll get."
            className="w-full px-4 py-2.5 rounded-xl bg-background border-2 border-input focus:border-primary outline-none text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Format</label>
          <div className="flex gap-2">
            {(["book", "script", "other"] as const).map((t) => {
              const m = TYPE_META[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                    type === t ? "border-primary bg-primary/8 text-foreground" : "border-input bg-background text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {m.icon} {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Genre tags
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">optional</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => {
              const sel = selectedGenres.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    sel ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {sel && <Check className="w-3 h-3" />}
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!title || !description || submitting}>
            {submitting ? "Posting…" : "Post Pitch"}
          </Button>
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
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Pitches</h1>
          </div>
          <p className="text-muted-foreground ml-13">
            Early-stage ideas looking for feedback and collaborators
          </p>
        </div>
        {isAuthor && !showForm && (
          <Button onClick={() => setShowForm(true)} className="rounded-full shrink-0">
            <Plus className="w-4 h-4 mr-2" /> New Pitch
          </Button>
        )}
      </motion.div>

      {/* New pitch form */}
      <AnimatePresence>
        {showForm && <NewPitchForm onClose={() => setShowForm(false)} />}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search pitches…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-input rounded-xl text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1">
            {(["all", "open", "closed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${
                  statusFilter === s
                    ? s === "open" ? "bg-emerald-600 text-white border-emerald-600"
                    : s === "closed" ? "bg-muted text-foreground border-muted-foreground"
                    : "bg-foreground text-background border-foreground"
                    : "bg-card text-muted-foreground border-border hover:border-foreground/30"
                }`}
              >
                {s === "all" ? "All statuses" : s}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {(["all", "book", "script", "other"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${
                  typeFilter === t
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-muted-foreground border-border hover:border-foreground/30"
                }`}
              >
                {t === "all" ? "All formats" : t === "other" ? "Open" : t === "book" ? "Book" : "Script"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      {!isLoading && pitches.length > 0 && (
        <p className="text-xs text-muted-foreground mb-5">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
          <span className="font-semibold text-foreground">{pitches.length}</span> pitches
        </p>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-3xl border border-border p-16 text-center">
          <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-serif font-semibold text-foreground">
            {pitches.length === 0 ? "No pitches yet" : "No results"}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            {pitches.length === 0
              ? isAuthor
                ? 'Be the first to share an idea. Click "New Pitch" to get started.'
                : "Authors will post their ideas here. Check back soon."
              : "Try adjusting your search or filters."}
          </p>
          {isAuthor && pitches.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
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
                className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow flex flex-col gap-3"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif font-bold text-foreground leading-tight">{p.title}</h3>
                  <div className="flex gap-1.5 shrink-0">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${tm.color}`}>
                      {tm.icon} {tm.label}
                    </span>
                    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      p.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                    }`}>
                      {p.status === "open" ? "Open" : "Closed"}
                    </span>
                  </div>
                </div>

                {/* Author */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-bold shrink-0">
                    {(p.ownerName ?? "?").charAt(0)}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{p.ownerName}</span>
                    {" · "}{format(new Date(p.createdAt), "d MMM yyyy")}
                  </span>
                </div>

                {/* Description preview */}
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{p.description}</p>

                {/* Genre tags */}
                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {genres.slice(0, 4).map((g) => (
                      <span key={g} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{g}</span>
                    ))}
                    {genres.length > 4 && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">+{genres.length - 4}</span>
                    )}
                  </div>
                )}

                {/* Response counts + CTA */}
                <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <HandHeart className="w-3.5 h-3.5 text-rose-400" /> {p.interestCount} interested
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-sky-400" /> {p.feedbackCount} feedback
                    </span>
                  </div>
                  <Link
                    href={`/pitch/${p.id}`}
                    className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
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
