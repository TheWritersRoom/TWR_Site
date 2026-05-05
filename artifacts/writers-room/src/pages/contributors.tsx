import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearch } from "wouter";
import {
  Users, Search, Sparkles, X, BadgeCheck, Globe, CheckCircle2,
  BarChart2, Star, ChevronDown, ToggleLeft, ToggleRight, MessageSquare, Send, Briefcase,
} from "lucide-react";
import { format } from "date-fns";

const EDITING_SPECIALTIES = [
  "Developmental Editing", "Line Editing", "Copy Editing", "Proofreading",
  "Structural Feedback", "Dialogue & Voice", "Pacing & Flow", "Research & Fact-checking", "World-building",
];

const EXPERIENCE_LABELS: Record<string, string> = {
  novice: "Novice",
  intermediate: "Intermediate",
  experienced: "Experienced",
  professional: "Professional",
};

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

const ALL_GENRES = Object.keys(GENRE_COLORS);

type Contributor = {
  id: number;
  name: string;
  role: "contributor" | "both";
  genres: string;
  mediaInterests: string | null;
  bio: string | null;
  credentials: string | null;
  avatarUrl: string | null;
  openToApproach: boolean;
  createdAt: string;
  totalSuggestions: number;
  acceptRate: number | null;
  editingSpecialties: string[];
  availableForWork: boolean;
  experienceLevel: string | null;
  professionalTitle: string | null;
  isPublishedAuthor: boolean;
};

type ContribCreds = {
  professionalTitle?: string;
  isPublishedAuthor?: boolean;
  publishedWorks?: { title: string; year?: number; publisher?: string }[];
  website?: string;
  linkedin?: string;
  patreon?: string;
  substack?: string;
};

function parseGenres(raw: string | null): string[] {
  try { return JSON.parse(raw ?? "[]"); } catch { return []; }
}

function parseCredentials(raw: string | null): ContribCreds {
  try { return JSON.parse(raw ?? "{}"); } catch { return {}; }
}

export default function Contributors() {
  const { user } = useAuth();
  const searchStr = useSearch();

  const [search, setSearch] = useState("");
  const [activeGenres, setActiveGenres] = useState<string[]>([]);
  const [activeSpecialties, setActiveSpecialties] = useState<string[]>([]);
  const [activeExperience, setActiveExperience] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showGenrePanel, setShowGenrePanel] = useState(false);
  const [showSpecialtyPanel, setShowSpecialtyPanel] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [composeFor, setComposeFor] = useState<{ id: number; name: string } | null>(null);
  const [composeBody, setComposeBody] = useState("");

  const isAuthor = user?.role === "author" || user?.role === "both";

  useEffect(() => {
    if (!searchStr) return;
    const params = new URLSearchParams(searchStr);
    const g = params.get("genres");
    if (g) setActiveGenres(g.split(",").map((x) => x.trim()).filter(Boolean));
  }, [searchStr]);

  useQuery({
    queryKey: ["/api/bookmarks", user?.id],
    queryFn: () =>
      fetch(`/api/bookmarks?authorId=${user!.id}`)
        .then((r) => r.json())
        .then((rows: { contributorId: number }[]) => {
          setBookmarkedIds(new Set(rows.map((r) => r.contributorId)));
          return rows;
        }),
    enabled: !!user && isAuthor,
  });

  const toggleBookmark = useMutation({
    mutationFn: (contributorId: number) =>
      fetch("/api/bookmarks", {
        method: bookmarkedIds.has(contributorId) ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorId: user!.id, contributorId }),
      }),
    onSuccess: (_, contributorId) =>
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (next.has(contributorId)) next.delete(contributorId); else next.add(contributorId);
        return next;
      }),
  });

  const sendMessage = useMutation({
    mutationFn: () =>
      fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId: user!.id, toUserId: composeFor!.id, body: composeBody }),
      }).then((r) => r.json()),
    onSuccess: () => { setComposeFor(null); setComposeBody(""); },
  });

  const { data: contributors = [], isLoading } = useQuery<Contributor[]>({
    queryKey: ["/api/contributors/search", search, activeGenres, activeSpecialties, activeExperience, availableOnly],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (activeGenres.length) params.set("genres", activeGenres.join(","));
      if (activeSpecialties.length) params.set("specialties", activeSpecialties.join(","));
      if (activeExperience) params.set("experience", activeExperience);
      if (availableOnly) params.set("available", "true");
      return fetch(`/api/contributors/search?${params}`).then((r) => r.json());
    },
  });

  const visible = contributors.filter((c) => !user || c.id !== user.id);

  const hasFilters = activeGenres.length > 0 || activeSpecialties.length > 0 || activeExperience || availableOnly || search;

  const clearAll = () => {
    setSearch("");
    setActiveGenres([]);
    setActiveSpecialties([]);
    setActiveExperience("");
    setAvailableOnly(false);
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2 flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-[#E8B84B]" /> Writers Room
        </p>
        <div className="border-t-2 border-[#1A1614] mb-3" />
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-serif font-bold text-[#1A1614]">Find Editors</h1>
            <p className="text-[#7A6B5E] mt-1">
              Search contributors by genre, editing specialty, and experience level.
            </p>
          </div>
          {!isLoading && (
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] shrink-0">
              <span className="text-[#1A1614] text-lg font-serif">{visible.length}</span>{" "}
              editor{visible.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="border-t border-[#1A1614]/15 mt-4" />
      </header>

      {/* Filter Bar */}
      <div className="mb-6 space-y-3">
        {/* Search row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6B5E]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, bio, specialties…"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#1A1614]/20 focus:border-[#1A1614] outline-none text-[#1A1614] transition-colors text-sm"
            />
          </div>

          {/* Available toggle */}
          <button
            onClick={() => setAvailableOnly((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2.5 border text-xs font-semibold transition-colors whitespace-nowrap ${
              availableOnly
                ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                : "bg-white border-[#1A1614]/20 text-[#7A6B5E] hover:border-[#1A1614] hover:text-[#1A1614]"
            }`}
          >
            {availableOnly
              ? <ToggleRight className="w-4 h-4 text-emerald-500" />
              : <ToggleLeft className="w-4 h-4" />}
            Available now
          </button>

          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2.5 border border-[#D94B1F]/30 text-[#D94B1F] text-xs font-semibold hover:bg-[#D94B1F]/5 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>

        {/* Filter chips row */}
        <div className="flex flex-wrap gap-2 items-center">

          {/* Genre picker */}
          <div className="relative">
            <button
              onClick={() => { setShowGenrePanel((v) => !v); setShowSpecialtyPanel(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-semibold transition-colors ${
                activeGenres.length > 0
                  ? "bg-[#1A1614] text-[#F9F6EE] border-[#1A1614]"
                  : "bg-white border-[#1A1614]/20 text-[#7A6B5E] hover:border-[#1A1614] hover:text-[#1A1614]"
              }`}
            >
              Genre {activeGenres.length > 0 && `· ${activeGenres.length}`}
              <ChevronDown className={`w-3 h-3 transition-transform ${showGenrePanel ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showGenrePanel && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 mt-1 z-20 bg-white border border-[#1A1614]/20 shadow-lg p-3 w-72"
                >
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_GENRES.map((g) => {
                      const active = activeGenres.includes(g);
                      return (
                        <button
                          key={g}
                          onClick={() => setActiveGenres((prev) => active ? prev.filter((x) => x !== g) : [...prev, g])}
                          className={`px-2 py-1 text-[11px] font-semibold transition-all ${
                            active
                              ? `${GENRE_COLORS[g] ?? "bg-[#1A1614]/5 text-[#7A6B5E]"} ring-1 ring-offset-1 ring-current/40`
                              : `${GENRE_COLORS[g] ?? "bg-[#1A1614]/5 text-[#7A6B5E]"} opacity-60 hover:opacity-100`
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Specialty picker */}
          <div className="relative">
            <button
              onClick={() => { setShowSpecialtyPanel((v) => !v); setShowGenrePanel(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-semibold transition-colors ${
                activeSpecialties.length > 0
                  ? "bg-[#1A1614] text-[#F9F6EE] border-[#1A1614]"
                  : "bg-white border-[#1A1614]/20 text-[#7A6B5E] hover:border-[#1A1614] hover:text-[#1A1614]"
              }`}
            >
              Specialty {activeSpecialties.length > 0 && `· ${activeSpecialties.length}`}
              <ChevronDown className={`w-3 h-3 transition-transform ${showSpecialtyPanel ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showSpecialtyPanel && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 mt-1 z-20 bg-white border border-[#1A1614]/20 shadow-lg p-3 w-72"
                >
                  <div className="flex flex-wrap gap-1.5">
                    {EDITING_SPECIALTIES.map((s) => {
                      const active = activeSpecialties.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => setActiveSpecialties((prev) => active ? prev.filter((x) => x !== s) : [...prev, s])}
                          className={`px-2.5 py-1 text-[11px] font-semibold border rounded-full transition-all ${
                            active
                              ? "bg-[#1A1614] text-[#F9F6EE] border-[#1A1614]"
                              : "bg-white border-[#1A1614]/20 text-[#7A6B5E] hover:border-[#1A1614] hover:text-[#1A1614]"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Experience level */}
          {["novice", "intermediate", "experienced", "professional"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setActiveExperience(activeExperience === lvl ? "" : lvl)}
              className={`px-3 py-1.5 text-xs font-semibold border capitalize transition-colors ${
                activeExperience === lvl
                  ? "bg-[#E8B84B] border-[#E8B84B] text-[#1A1614]"
                  : "bg-white border-[#1A1614]/20 text-[#7A6B5E] hover:border-[#1A1614] hover:text-[#1A1614]"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Active filter pills */}
        {(activeGenres.length > 0 || activeSpecialties.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {activeGenres.map((g) => (
              <span key={g} className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold ${GENRE_COLORS[g] ?? "bg-[#1A1614]/5 text-[#7A6B5E]"}`}>
                {g}
                <button onClick={() => setActiveGenres((prev) => prev.filter((x) => x !== g))} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {activeSpecialties.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-[#1A1614]/8 text-[#1A1614] rounded-full">
                {s}
                <button onClick={() => setActiveSpecialties((prev) => prev.filter((x) => x !== s))} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-b-2 border-[#1A1614] animate-spin rounded-full" />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-24 bg-white border border-[#1A1614]/15">
          <Users className="w-12 h-12 text-[#7A6B5E] mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-serif font-bold text-[#1A1614]">No editors found</h3>
          <p className="text-[#7A6B5E] mt-2 text-sm max-w-xs mx-auto">
            {hasFilters ? "Try broadening your filters — or clear them all." : "No contributors have signed up yet."}
          </p>
          {hasFilters && (
            <button onClick={clearAll} className="mt-4 text-xs font-bold text-[#E8B84B] hover:underline uppercase tracking-widest">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map((c, i) => {
            const genres = parseGenres(c.genres);
            const creds = parseCredentials(c.credentials);
            const hasDetails = c.bio || c.mediaInterests || (creds.publishedWorks as unknown[])?.length || creds.website || c.editingSpecialties.length > 0;
            const isExpanded = expanded === c.id;

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="bg-white border border-[#1A1614]/15 overflow-hidden hover:border-[#E8B84B] transition-colors flex flex-col"
              >
                <div className="p-5 flex-1">
                  {/* Header row */}
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-12 h-12 bg-[#1A1614] flex items-center justify-center shrink-0">
                      {c.avatarUrl
                        ? <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                        : <span className="text-lg font-serif font-bold text-[#F9F6EE]">{c.name.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/profile/${c.id}`} className="font-bold text-[#1A1614] text-base leading-tight hover:text-[#E8B84B] transition-colors">{c.name}</Link>
                            {c.isPublishedAuthor && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#E8B84B] bg-[#E8B84B]/10 px-2 py-0.5 border border-[#E8B84B]/30">
                                <BadgeCheck className="w-3 h-3" /> Published
                              </span>
                            )}
                          </div>
                          {c.professionalTitle && (
                            <p className="text-xs text-[#7A6B5E] mt-0.5 font-medium">{c.professionalTitle}</p>
                          )}
                          <p className="text-[10px] uppercase tracking-[0.1em] font-bold text-[#7A6B5E]/60 mt-0.5">
                            Since {format(new Date(c.createdAt), "MMM yyyy")}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {isAuthor && (
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleBookmark.mutate(c.id); }}
                              title={bookmarkedIds.has(c.id) ? "Remove from shortlist" : "Add to shortlist"}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star className={`w-4 h-4 transition-colors ${bookmarkedIds.has(c.id) ? "fill-[#E8B84B] text-[#E8B84B]" : "text-[#7A6B5E]/40 hover:text-[#E8B84B]"}`} />
                            </button>
                          )}
                          {c.availableForWork && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Available
                            </span>
                          )}
                          {c.experienceLevel && (
                            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7A6B5E] bg-[#F9F6EE] border border-[#1A1614]/10 px-2 py-0.5">
                              <Briefcase className="w-3 h-3 inline mr-1" />
                              {EXPERIENCE_LABELS[c.experienceLevel] ?? c.experienceLevel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  {c.totalSuggestions > 0 && (
                    <div className="flex gap-4 mb-3 py-2 border-y border-[#1A1614]/8">
                      <div className="text-center">
                        <p className="text-lg font-serif font-bold text-[#1A1614]">{c.totalSuggestions}</p>
                        <p className="text-[9px] uppercase tracking-[0.15em] font-bold text-[#7A6B5E]">Edits</p>
                      </div>
                      {c.acceptRate !== null && (
                        <div className="text-center">
                          <p className="text-lg font-serif font-bold text-[#1A1614]">{c.acceptRate}%</p>
                          <p className="text-[9px] uppercase tracking-[0.15em] font-bold text-[#7A6B5E]">Accept rate</p>
                        </div>
                      )}
                      {c.openToApproach && (
                        <div className="ml-auto flex items-center">
                          <span className="text-[10px] font-semibold text-[#E8B84B] bg-[#E8B84B]/10 px-2 py-0.5 border border-[#E8B84B]/30">
                            Open to pitches
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Genre tags */}
                  {genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {genres.map((g) => (
                        <span key={g} className={`px-2 py-0.5 text-[10px] font-semibold ${GENRE_COLORS[g] ?? "bg-[#1A1614]/5 text-[#7A6B5E]"}`}>{g}</span>
                      ))}
                    </div>
                  )}

                  {/* Editing specialties */}
                  {c.editingSpecialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {c.editingSpecialties.map((s) => (
                        <span key={s} className="px-2 py-0.5 text-[10px] font-semibold bg-[#1A1614]/6 text-[#1A1614] border border-[#1A1614]/12 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expandable details */}
                  <AnimatePresence>
                    {hasDetails && (
                      isExpanded ? (
                        <motion.div
                          key="details"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden space-y-2"
                        >
                          {(c.bio || c.mediaInterests) && (
                            <div className="bg-[#F9F6EE] p-3 text-sm text-[#7A6B5E] leading-relaxed flex gap-2">
                              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#E8B84B]" />
                              <p>{c.bio || c.mediaInterests}</p>
                            </div>
                          )}
                          {(creds.publishedWorks as {title:string;year?:number;publisher?:string}[] | undefined)?.length ? (
                            <div className="bg-[#F9F6EE] p-3 space-y-1">
                              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A6B5E] mb-1.5">Published Works</p>
                              {(creds.publishedWorks as {title:string;year?:number;publisher?:string}[]).map((w, wi) => (
                                <div key={wi} className="text-xs flex gap-1.5 items-baseline">
                                  <span className="font-semibold text-[#1A1614]">{w.title}</span>
                                  {w.year && <span className="text-[#7A6B5E]">{w.year}</span>}
                                  {w.publisher && <span className="text-[#7A6B5E]">· {w.publisher}</span>}
                                </div>
                              ))}
                            </div>
                          ) : null}
                          {(creds.website || creds.linkedin || creds.patreon || creds.substack) && (
                            <div className="flex flex-wrap gap-2">
                              {creds.website && (
                                <a href={creds.website as string} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                                  <Globe className="w-3.5 h-3.5" />{(creds.website as string).replace(/^https?:\/\//, "")}
                                </a>
                              )}
                              {creds.linkedin && (
                                <a href={creds.linkedin as string} target="_blank" rel="noopener noreferrer"
                                  className="text-xs font-semibold text-[#0A66C2] bg-[#0A66C2]/10 px-2 py-0.5 rounded hover:bg-[#0A66C2]/20 transition-colors">LinkedIn</a>
                              )}
                              {creds.patreon && (
                                <a href={creds.patreon as string} target="_blank" rel="noopener noreferrer"
                                  className="text-xs font-semibold text-[#F96854] bg-[#F96854]/10 px-2 py-0.5 rounded hover:bg-[#F96854]/20 transition-colors">Patreon</a>
                              )}
                              {creds.substack && (
                                <a href={creds.substack as string} target="_blank" rel="noopener noreferrer"
                                  className="text-xs font-semibold text-[#FF6719] bg-[#FF6719]/10 px-2 py-0.5 rounded hover:bg-[#FF6719]/20 transition-colors">Substack</a>
                              )}
                            </div>
                          )}
                          <button
                            onClick={() => setExpanded(null)}
                            className="text-[10px] text-[#7A6B5E] uppercase tracking-[0.1em] font-bold hover:text-[#1A1614] transition-colors"
                          >
                            Collapse
                          </button>
                        </motion.div>
                      ) : (
                        <button
                          onClick={() => setExpanded(c.id)}
                          className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] font-bold text-[#7A6B5E] hover:text-[#1A1614] transition-colors mt-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> View full profile
                        </button>
                      )
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="border-t border-[#1A1614]/10 px-5 py-3 flex items-center justify-between bg-[#F9F6EE] gap-4">
                  <div className="flex items-center gap-3">
                    {c.totalSuggestions > 0 && (
                      <span className="text-[10px] font-bold text-[#7A6B5E] flex items-center gap-1">
                        <BarChart2 className="w-3 h-3" />
                        {c.acceptRate !== null ? `${c.acceptRate}% accept` : `${c.totalSuggestions} edits`}
                      </span>
                    )}
                    {c.openToApproach && (
                      <span className="text-[10px] font-bold text-[#E8B84B] flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> Open to pitches
                      </span>
                    )}
                  </div>
                  {user && user.id !== c.id && (
                    <button
                      onClick={() => { setComposeFor({ id: c.id, name: c.name }); setComposeBody(""); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1614] text-[#F9F6EE] text-[11px] font-bold uppercase tracking-[0.1em] hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors shrink-0"
                    >
                      <MessageSquare className="w-3 h-3" /> Message
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Compose message modal */}
      {composeFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setComposeFor(null)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-[#F9F6EE] border-2 border-[#1A1614] p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-lg text-[#1A1614]">Message {composeFor.name}</h3>
              <button onClick={() => setComposeFor(null)} className="text-[#7A6B5E] hover:text-[#1A1614]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              rows={5}
              className="w-full bg-white border border-[#1A1614]/20 focus:border-[#1A1614] outline-none px-3 py-2.5 text-sm text-[#1A1614] resize-none"
              placeholder={`Introduce yourself and explain why you'd like to collaborate with ${composeFor.name}…`}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => sendMessage.mutate()}
                disabled={!composeBody.trim() || sendMessage.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1A1614] text-[#F9F6EE] text-sm font-semibold py-2.5 hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sendMessage.isPending ? "Sending…" : "Send message"}
              </button>
              <button
                onClick={() => setComposeFor(null)}
                className="px-4 py-2.5 border border-[#1A1614]/20 text-[#7A6B5E] text-sm font-semibold hover:border-[#1A1614] hover:text-[#1A1614] transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
