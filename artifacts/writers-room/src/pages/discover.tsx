import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { BookText, FileText, Globe, Users, Star, Search, BadgeCheck, Lock } from "lucide-react";
import { SEO } from "@/components/seo";

type SearchProject = {
  id: number;
  title: string;
  type: "book" | "script";
  ownerId: number;
  ownerName: string;
  isPublished: boolean;
  publishedAt: string | null;
  publishVisibility: "all" | "matched" | "contributors";
  feedbackEnabled: boolean;
  feedbackAudience: "all" | "matched" | "contributors";
  feedbackVisibility: "public" | "private";
  feedbackCount: number;
  avgRating: number | null;
  ratingCount: number;
  userRating: number | null;
  createdAt: string;
};

function StarRating({ projectId, avgRating, ratingCount, userRating, onRate }: {
  projectId: number;
  avgRating: number | null;
  ratingCount: number;
  userRating: number | null;
  onRate: (projectId: number, rating: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? userRating ?? Math.round(avgRating ?? 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(null)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onClick={() => onRate(projectId, n)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              className={`w-4 h-4 transition-colors ${
                n <= display
                  ? userRating && n <= userRating
                    ? "fill-[#1A1614] text-[#1A1614]"
                    : "fill-[#E8B84B] text-[#E8B84B]"
                  : "fill-transparent text-[#1A1614]/20"
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-xs text-[#7A6B5E]">
        {avgRating != null ? (
          <><span className="font-bold text-[#1A1614]">{avgRating.toFixed(1)}</span>{" "}({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})</>
        ) : (
          <span className="italic">No ratings yet</span>
        )}
      </span>
      {userRating && (
        <span className="text-[9px] font-bold text-[#1A1614] bg-[#E8B84B]/20 px-1.5 py-0.5 uppercase tracking-[0.1em]">
          Yours: {userRating}★
        </span>
      )}
    </div>
  );
}

export default function Discover() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "book" | "script">("all");

  const queryKey = ["/api/projects/search", user?.id, typeFilter];

  const { data: projects = [], isLoading } = useQuery<SearchProject[]>({
    queryKey,
    enabled: !!user,
    queryFn: () => {
      const params = new URLSearchParams({ userId: String(user!.id) });
      if (typeFilter !== "all") params.set("type", typeFilter);
      return fetch(`/api/projects/search?${params}`).then((r) => r.json());
    },
  });

  const rateMutation = useMutation({
    mutationFn: ({ projectId, rating }: { projectId: number; rating: number }) =>
      fetch(`/api/projects/${projectId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user!.id, rating }),
      }).then((r) => r.json()),
    onSuccess: (data, { projectId }) => {
      queryClient.setQueryData<SearchProject[]>(queryKey, (old = []) =>
        old.map((p) => p.id === projectId ? { ...p, ...data } : p)
      );
    },
  });

  const filtered = projects.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || (p.ownerName ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <SEO
        title="Discover Published Works"
        description="Browse published books and scripts from writers on The Writers Room. Read, rate, and give feedback across all genres."
        canonicalPath="/discover"
      />
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">Published Works</p>
        <div className="border-t-2 border-[#1A1614] mb-3" />
        <h1 className="text-4xl font-serif font-bold text-[#1A1614]">Browse & Rate</h1>
        <p className="text-[#7A6B5E] mt-1">Search all projects, leave star ratings, and discover new work</p>
        <div className="border-t border-[#1A1614]/15 mt-4" />
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6B5E]" />
          <input
            type="text"
            placeholder="Search by title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#1A1614]/20 focus:border-[#1A1614] text-sm outline-none text-[#1A1614]"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "book", "script"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] font-bold border transition-all ${
                typeFilter === t
                  ? "bg-[#1A1614] text-[#F9F6EE] border-[#1A1614]"
                  : "bg-white text-[#7A6B5E] border-[#1A1614]/20 hover:border-[#1A1614]"
              }`}
            >
              {t === "all" ? "All" : t === "book" ? "Books" : "Scripts"}
            </button>
          ))}
        </div>
      </div>

      {!isLoading && projects.length > 0 && (
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-5">
          Showing <span className="text-[#1A1614]">{filtered.length}</span> of{" "}
          <span className="text-[#1A1614]">{projects.length}</span> projects
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-b-2 border-[#1A1614] animate-spin rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#1A1614]/15 p-16 text-center">
          <Search className="w-10 h-10 text-[#7A6B5E] mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-serif font-bold text-[#1A1614]">
            {projects.length === 0 ? "No projects yet" : "No results found"}
          </h3>
          <p className="text-sm text-[#7A6B5E] mt-2">
            {projects.length === 0
              ? "Projects will appear here once authors publish them."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white border border-[#1A1614]/15 p-5 hover:border-[#E8B84B] transition-colors flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {p.type === "book"
                    ? <BookText className="w-4 h-4 text-[#7A6B5E] shrink-0" />
                    : <FileText className="w-4 h-4 text-[#7A6B5E] shrink-0" />}
                  <h3 className="font-serif font-bold text-[#1A1614] leading-tight truncate">{p.title}</h3>
                </div>
                <div className="shrink-0">
                  {p.isPublished ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 bg-[#1A1614] text-[#F9F6EE] uppercase tracking-[0.1em]">
                      <BadgeCheck className="w-3 h-3" /> Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 border border-[#1A1614]/20 text-[#7A6B5E] uppercase tracking-[0.1em]">
                      <Lock className="w-3 h-3" /> Draft
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#1A1614] flex items-center justify-center text-[#F9F6EE] text-[9px] font-bold shrink-0">
                  {(p.ownerName ?? "?").charAt(0)}
                </div>
                <span className="text-sm text-[#7A6B5E]">
                  By <span className="font-bold text-[#1A1614]">{p.ownerName ?? "Unknown"}</span>
                  {" · "}{p.isPublished && p.publishedAt
                    ? `Published ${format(new Date(p.publishedAt), "d MMM yyyy")}`
                    : `Created ${format(new Date(p.createdAt), "d MMM yyyy")}`}
                </span>
              </div>

              {p.isPublished && (
                <div className="flex items-center gap-3 text-xs text-[#7A6B5E]">
                  {p.publishVisibility === "all" && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Open to all</span>}
                  {p.publishVisibility === "matched" && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> Matched readers</span>}
                  {p.publishVisibility === "contributors" && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Contributors only</span>}
                </div>
              )}

              <div className="py-1">
                <StarRating
                  projectId={p.id}
                  avgRating={p.avgRating}
                  ratingCount={p.ratingCount}
                  userRating={p.userRating}
                  onRate={(id, rating) => rateMutation.mutate({ projectId: id, rating })}
                />
              </div>

              <div className="mt-auto pt-3 border-t border-[#1A1614]/10">
                <Link
                  href={`/project/${p.id}`}
                  className="text-[10px] uppercase tracking-[0.14em] font-bold text-[#1A1614] hover:text-[#E8B84B] transition-colors"
                >
                  View project →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
