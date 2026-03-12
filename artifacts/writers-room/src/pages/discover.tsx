import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import {
  BookText, FileText, Globe, Users, Star,
  Search, BadgeCheck, Lock
} from "lucide-react";

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

function StarRating({
  projectId,
  avgRating,
  ratingCount,
  userRating,
  onRate,
}: {
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
            title={`Rate ${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              className={`w-4 h-4 transition-colors ${
                n <= display
                  ? userRating && n <= userRating
                    ? "fill-primary text-primary"
                    : "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {avgRating != null ? (
          <>
            <span className="font-semibold text-foreground">{avgRating.toFixed(1)}</span>
            {" "}({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
          </>
        ) : (
          <span className="italic">No ratings yet</span>
        )}
      </span>
      {userRating && (
        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
          Your rating: {userRating}★
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
        old.map((p) =>
          p.id === projectId
            ? { ...p, avgRating: data.avgRating, ratingCount: data.ratingCount, userRating: data.userRating }
            : p
        )
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Search className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Browse & Rate</h1>
        </div>
        <p className="text-muted-foreground ml-13">
          Search all projects, leave star ratings, and discover new work
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-input rounded-xl text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "book", "script"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all capitalize ${
                typeFilter === t
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-muted-foreground border-border hover:border-foreground/30"
              }`}
            >
              {t === "all" ? "All types" : t === "book" ? "Books" : "Scripts"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      {!isLoading && projects.length > 0 && (
        <p className="text-xs text-muted-foreground mb-5">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
          <span className="font-semibold text-foreground">{projects.length}</span> projects
        </p>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-3xl border border-border p-16 text-center">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-serif font-semibold text-foreground">
            {projects.length === 0 ? "No projects yet" : "No results found"}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            {projects.length === 0
              ? "Projects will appear here once authors start creating them."
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
              className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow flex flex-col gap-3"
            >
              {/* Title row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {p.type === "book"
                    ? <BookText className="w-4 h-4 text-muted-foreground shrink-0" />
                    : <FileText className="w-4 h-4 text-muted-foreground shrink-0" />}
                  <h3 className="font-serif font-bold text-foreground leading-tight truncate">{p.title}</h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {p.isPublished ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      <BadgeCheck className="w-3 h-3" /> Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      <Lock className="w-3 h-3" /> Draft
                    </span>
                  )}
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-bold shrink-0">
                  {(p.ownerName ?? "?").charAt(0)}
                </div>
                <span className="text-sm text-muted-foreground">
                  By <span className="font-semibold text-foreground">{p.ownerName ?? "Unknown"}</span>
                  {" · "}{p.isPublished && p.publishedAt
                    ? `Published ${format(new Date(p.publishedAt), "d MMM yyyy")}`
                    : `Created ${format(new Date(p.createdAt), "d MMM yyyy")}`}
                </span>
              </div>

              {/* Visibility badge (only when published) */}
              {p.isPublished && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {p.publishVisibility === "all" && (
                    <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Open to all</span>
                  )}
                  {p.publishVisibility === "matched" && (
                    <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> Matched readers</span>
                  )}
                  {p.publishVisibility === "contributors" && (
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Contributors only</span>
                  )}
                </div>
              )}

              {/* Star rating */}
              <div className="py-1">
                <StarRating
                  projectId={p.id}
                  avgRating={p.avgRating}
                  ratingCount={p.ratingCount}
                  userRating={p.userRating}
                  onRate={(id, rating) =>
                    rateMutation.mutate({ projectId: id, rating })
                  }
                />
              </div>

              {/* CTA */}
              <div className="mt-auto pt-3 border-t border-border">
                <Link
                  href={`/project/${p.id}`}
                  className="text-sm font-semibold text-primary hover:underline"
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
