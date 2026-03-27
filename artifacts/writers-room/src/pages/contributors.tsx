import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Sparkles, X, Mail, BadgeCheck, Globe } from "lucide-react";
import { format } from "date-fns";

type PublishedWork = { title: string; year?: number; publisher?: string };
type UserCredentials = {
  professionalTitle?: string;
  isPublishedAuthor?: boolean;
  publishedWorks?: PublishedWork[];
  website?: string;
  linkedin?: string;
  patreon?: string;
  substack?: string;
};

type Contributor = {
  id: number;
  name: string;
  email: string;
  role: "contributor" | "both";
  genres: string;
  mediaInterests: string | null;
  bio: string | null;
  credentials: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

function parseCredentials(raw: string | null | undefined): UserCredentials {
  try { return JSON.parse(raw ?? "{}"); } catch { return {}; }
}

function parseGenres(raw: string | null): string[] {
  try { return JSON.parse(raw ?? "[]"); } catch { return []; }
}

const GENRE_COLORS: Record<string, string> = {
  "Film & TV Script":          "bg-purple-100 text-purple-700",
  "Long-form Fiction":         "bg-blue-100 text-blue-700",
  "Non-fiction":               "bg-teal-100 text-teal-700",
  "Short Story":               "bg-amber-100 text-amber-700",
  "Poetry":                    "bg-pink-100 text-pink-700",
  "Fan Fiction":               "bg-orange-100 text-orange-700",
  "Screenwriting":             "bg-violet-100 text-violet-700",
  "Graphic Novel / Comics":    "bg-indigo-100 text-indigo-700",
  "Children's Literature":     "bg-green-100 text-green-700",
  "Literary Fiction":          "bg-cyan-100 text-cyan-700",
  "Thriller / Mystery":        "bg-red-100 text-red-700",
  "Romance":                   "bg-rose-100 text-rose-700",
  "Science Fiction / Fantasy": "bg-sky-100 text-sky-700",
  "Horror":                    "bg-stone-100 text-stone-700",
};

export default function Contributors() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const { data: contributors = [], isLoading } = useQuery<Contributor[]>({
    queryKey: ["/api/users/browse"],
    queryFn: () => fetch("/api/users/browse").then((r) => r.json()),
  });

  const filtered = contributors.filter((c) => {
    if (user && c.id === user.id) return false;
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

  const allGenres = Array.from(
    new Set(contributors.flatMap((c) => parseGenres(c.genres)))
  ).sort();

  const handleCopy = (c: Contributor) => {
    navigator.clipboard.writeText(c.email);
    setCopied(c.id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">

      {/* Header */}
      <header className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">Writers Room</p>
        <div className="border-t-2 border-[#1A1614] mb-3" />
        <h1 className="text-4xl font-serif font-bold text-[#1A1614]">Find Contributors</h1>
        <p className="text-[#7A6B5E] mt-1">Browse editors and collaborators by their areas of interest.</p>
        <div className="border-t border-[#1A1614]/15 mt-4" />
      </header>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6B5E]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, genre or interests…"
            className="w-full pl-10 pr-4 py-3 bg-white border border-[#1A1614]/20 focus:border-[#1A1614] outline-none text-[#1A1614] transition-colors"
          />
        </div>
      </div>

      {/* Genre chips */}
      {allGenres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {allGenres.map((g) => {
            const active = activeGenre === g;
            const colorClass = GENRE_COLORS[g] ?? "bg-[#1A1614]/5 text-[#7A6B5E]";
            return (
              <button
                key={g}
                onClick={() => setActiveGenre(active ? null : g)}
                className={`px-3 py-1.5 text-[11px] font-semibold border transition-all ${
                  active
                    ? `${colorClass} border-current ring-1 ring-offset-1 ring-current/30`
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
              className="px-3 py-1.5 text-[11px] font-semibold border border-[#1A1614]/20 text-[#7A6B5E] hover:text-[#1A1614] transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-5">
          <span className="text-[#1A1614]">{filtered.length}</span> contributor{filtered.length !== 1 ? "s" : ""} found
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-b-2 border-[#1A1614] animate-spin rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#1A1614]/15">
          <Users className="w-12 h-12 text-[#7A6B5E] mx-auto mb-4 opacity-40" />
          <h3 className="text-xl font-serif font-bold text-[#1A1614]">No contributors found</h3>
          <p className="text-[#7A6B5E] mt-2 text-sm">
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
                className="bg-white border border-[#1A1614]/15 overflow-hidden hover:border-[#E8B84B] transition-colors"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#1A1614] flex items-center justify-center shrink-0 relative">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-serif font-bold text-[#F9F6EE]">
                          {c.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[#1A1614] text-lg leading-tight">{c.name}</h3>
                        {parseCredentials(c.credentials).isPublishedAuthor && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#E8B84B] bg-[#E8B84B]/10 px-2 py-0.5 border border-[#E8B84B]/30">
                            <BadgeCheck className="w-3 h-3" /> Published Author
                          </span>
                        )}
                      </div>
                      {parseCredentials(c.credentials).professionalTitle && (
                        <p className="text-xs text-[#7A6B5E] mt-0.5 font-medium">
                          {parseCredentials(c.credentials).professionalTitle}
                        </p>
                      )}
                      <p className="text-[10px] uppercase tracking-[0.1em] font-bold text-[#7A6B5E] mt-0.5">
                        Member since {format(new Date(c.createdAt), "MMM yyyy")}
                      </p>
                    </div>
                  </div>

                  {genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {genres.map((g) => (
                        <span
                          key={g}
                          className={`px-2.5 py-1 text-[11px] font-semibold ${GENRE_COLORS[g] ?? "bg-[#1A1614]/5 text-[#7A6B5E]"}`}
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  {(() => {
                    const creds = parseCredentials(c.credentials);
                    const hasWorks = (creds.publishedWorks?.length ?? 0) > 0;
                    const hasExpandable = c.mediaInterests || hasWorks || creds.website;
                    if (!hasExpandable) return null;
                    return (
                      <AnimatePresence>
                        {isExpanded ? (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 space-y-2 overflow-hidden"
                          >
                            {c.mediaInterests && (
                              <div className="flex items-start gap-2 text-sm text-[#7A6B5E] bg-[#E8B84B]/8 p-3">
                                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#E8B84B]" />
                                <p className="leading-relaxed">{c.mediaInterests}</p>
                              </div>
                            )}
                            {hasWorks && (
                              <div className="bg-[#F9F6EE] p-3 space-y-1">
                                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A6B5E] mb-1.5">Published Works</p>
                                {creds.publishedWorks!.map((w, i) => (
                                  <div key={i} className="text-xs flex gap-1.5 items-baseline">
                                    <span className="font-semibold text-[#1A1614]">{w.title}</span>
                                    {w.year && <span className="text-[#7A6B5E]">{w.year}</span>}
                                    {w.publisher && <span className="text-[#7A6B5E]">· {w.publisher}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                            {(creds.website || creds.linkedin || creds.patreon || creds.substack) && (
                              <div className="flex flex-wrap gap-2">
                                {creds.website && (
                                  <a href={creds.website} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                                    <Globe className="w-3.5 h-3.5" />
                                    {creds.website.replace(/^https?:\/\//, "")}
                                  </a>
                                )}
                                {creds.linkedin && (
                                  <a href={creds.linkedin} target="_blank" rel="noopener noreferrer"
                                    className="text-xs font-semibold text-[#0A66C2] bg-[#0A66C2]/10 px-2 py-0.5 rounded hover:bg-[#0A66C2]/20 transition-colors">
                                    LinkedIn
                                  </a>
                                )}
                                {creds.patreon && (
                                  <a href={creds.patreon} target="_blank" rel="noopener noreferrer"
                                    className="text-xs font-semibold text-[#F96854] bg-[#F96854]/10 px-2 py-0.5 rounded hover:bg-[#F96854]/20 transition-colors">
                                    Patreon
                                  </a>
                                )}
                                {creds.substack && (
                                  <a href={creds.substack} target="_blank" rel="noopener noreferrer"
                                    className="text-xs font-semibold text-[#FF6719] bg-[#FF6719]/10 px-2 py-0.5 rounded hover:bg-[#FF6719]/20 transition-colors">
                                    Substack
                                  </a>
                                )}
                              </div>
                            )}
                            <button
                              onClick={() => setExpanded(null)}
                              className="mt-1 text-[10px] text-[#7A6B5E] uppercase tracking-[0.1em] font-bold hover:text-[#1A1614] transition-colors block"
                            >
                              Hide
                            </button>
                          </motion.div>
                        ) : (
                          <button
                            onClick={() => setExpanded(c.id)}
                            className="mt-3 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] font-bold text-[#7A6B5E] hover:text-[#1A1614] transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            View profile details
                          </button>
                        )}
                      </AnimatePresence>
                    );
                  })()}
                </div>

                {/* Footer */}
                <div className="border-t border-[#1A1614]/10 px-5 py-3 flex items-center justify-between bg-[#F9F6EE]">
                  <span className="text-xs text-[#7A6B5E] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {c.email}
                  </span>
                  <button
                    onClick={() => handleCopy(c)}
                    className={`text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
                      copied === c.id
                        ? "text-[#E8B84B]"
                        : "text-[#1A1614] hover:text-[#E8B84B]"
                    }`}
                  >
                    {copied === c.id ? "Copied!" : "Copy email"}
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
