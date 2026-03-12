import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Film, BookOpen, Sparkles, X, Mail } from "lucide-react";
import { format } from "date-fns";

type Contributor = {
  id: number;
  name: string;
  email: string;
  role: "contributor" | "both";
  genres: string;
  mediaInterests: string;
  createdAt: string;
};

function parseGenres(raw: string | null): string[] {
  try {
    return JSON.parse(raw ?? "[]");
  } catch {
    return [];
  }
}

const GENRE_COLORS: Record<string, string> = {
  "Film & TV Script":        "bg-purple-100 text-purple-700",
  "Long-form Fiction":       "bg-blue-100 text-blue-700",
  "Non-fiction":             "bg-teal-100 text-teal-700",
  "Short Story":             "bg-amber-100 text-amber-700",
  "Poetry":                  "bg-pink-100 text-pink-700",
  "Fan Fiction":             "bg-orange-100 text-orange-700",
  "Screenwriting":           "bg-violet-100 text-violet-700",
  "Graphic Novel / Comics":  "bg-indigo-100 text-indigo-700",
  "Children's Literature":   "bg-green-100 text-green-700",
  "Literary Fiction":        "bg-cyan-100 text-cyan-700",
  "Thriller / Mystery":      "bg-red-100 text-red-700",
  "Romance":                 "bg-rose-100 text-rose-700",
  "Science Fiction / Fantasy": "bg-sky-100 text-sky-700",
  "Horror":                  "bg-stone-100 text-stone-700",
};

export default function Contributors() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: contributors = [], isLoading } = useQuery<Contributor[]>({
    queryKey: ["/api/users/browse"],
    queryFn: () => fetch("/api/users/browse").then((r) => r.json()),
  });

  const filtered = contributors.filter((c) => {
    if (user && c.id === user.id) return false; // hide self
    const genres = parseGenres(c.genres);
    const matchesGenre = !activeGenre || genres.includes(activeGenre);
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.mediaInterests ?? "").toLowerCase().includes(q) ||
      genres.some((g) => g.toLowerCase().includes(q));
    return matchesGenre && matchesSearch;
  });

  // All genres that appear in the list
  const allGenres = Array.from(
    new Set(contributors.flatMap((c) => parseGenres(c.genres)))
  ).sort();

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-foreground tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Find Contributors
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Browse editors and collaborators by their areas of interest to find the right fit for your project.
        </p>
      </header>

      {/* Search + genre filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, genre or interests…"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border-2 border-input focus:border-primary outline-none transition-colors"
          />
        </div>
      </div>

      {/* Genre filter chips */}
      {allGenres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {allGenres.map((g) => {
            const active = activeGenre === g;
            const colorClass = GENRE_COLORS[g] ?? "bg-muted text-muted-foreground";
            return (
              <button
                key={g}
                onClick={() => setActiveGenre(active ? null : g)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? `${colorClass} border-current ring-2 ring-offset-1 ring-current/30`
                    : `${colorClass} border-transparent opacity-70 hover:opacity-100`
                }`}
              >
                {g}
              </button>
            );
          })}
          {activeGenre && (
            <button
              onClick={() => setActiveGenre(null)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-input text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear filter
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="text-xl font-serif font-semibold text-foreground">No contributors found</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            {search || activeGenre ? "Try adjusting your search or filter." : "No contributors have signed up yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c, i) => {
            const genres = parseGenres(c.genres);
            const isExpanded = expanded === c.id;

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-2xl border border-border hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                      <span className="text-lg font-serif font-bold text-primary">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-lg leading-tight">{c.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Member since {format(new Date(c.createdAt), "MMM yyyy")}
                      </p>
                    </div>
                  </div>

                  {/* Genres */}
                  {genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {genres.map((g) => (
                        <span
                          key={g}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            GENRE_COLORS[g] ?? "bg-muted text-muted-foreground"
                          }`}
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Media interests preview */}
                  {c.mediaInterests && (
                    <AnimatePresence>
                      {isExpanded ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3"
                        >
                          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-accent/40 rounded-xl p-3">
                            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                            <p className="leading-relaxed">{c.mediaInterests}</p>
                          </div>
                        </motion.div>
                      ) : (
                        <button
                          onClick={() => setExpanded(c.id)}
                          className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          View media interests
                        </button>
                      )}
                    </AnimatePresence>
                  )}

                  {isExpanded && (
                    <button
                      onClick={() => setExpanded(null)}
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Hide
                    </button>
                  )}
                </div>

                {/* Invite action */}
                <div className="border-t border-border px-5 py-3 flex items-center justify-between bg-accent/20">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {c.email}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(c.email);
                    }}
                    className="text-xs font-semibold text-primary hover:underline transition-colors"
                  >
                    Copy email to invite
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
