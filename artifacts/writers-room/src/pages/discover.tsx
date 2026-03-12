import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import {
  BookText, FileText, Globe, Users, Star, MessageCircle,
  Lock, Eye, ArrowRight, Search, Telescope
} from "lucide-react";

type PublishedProject = {
  id: number;
  title: string;
  type: "book" | "script";
  ownerId: number;
  ownerName: string;
  publishedAt: string;
  publishVisibility: "all" | "matched" | "contributors";
  feedbackEnabled: boolean;
  feedbackAudience: "all" | "matched" | "contributors";
  feedbackVisibility: "public" | "private";
  canGiveFeedback: boolean;
  feedbackCount: number;
  createdAt: string;
};

const VISIBILITY_LABEL: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  all: { label: "Open to all", icon: <Globe className="w-3.5 h-3.5" />, color: "bg-sky-100 text-sky-700" },
  matched: { label: "Matched readers", icon: <Star className="w-3.5 h-3.5" />, color: "bg-amber-100 text-amber-700" },
  contributors: { label: "Contributors only", icon: <Users className="w-3.5 h-3.5" />, color: "bg-violet-100 text-violet-700" },
};

export default function Discover() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "book" | "script">("all");

  const { data: projects = [], isLoading } = useQuery<PublishedProject[]>({
    queryKey: ["/api/projects/discover", user?.id],
    enabled: !!user,
    queryFn: () => fetch(`/api/projects/discover?userId=${user!.id}`).then((r) => r.json()),
  });

  const filtered = projects.filter((p) => {
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.type === typeFilter;
    return matchSearch && matchType;
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
            <Telescope className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Discover</h1>
        </div>
        <p className="text-muted-foreground ml-13">
          Published works from authors you may collaborate with
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

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-3xl border border-border p-16 text-center">
          <Telescope className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-serif font-semibold text-foreground">
            {projects.length === 0 ? "Nothing published yet" : "No results found"}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            {projects.length === 0
              ? "When authors publish their work and you match their readership criteria, it will appear here."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((p, i) => {
            const vis = VISIBILITY_LABEL[p.publishVisibility];
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {p.type === "book"
                      ? <BookText className="w-5 h-5 text-muted-foreground shrink-0" />
                      : <FileText className="w-5 h-5 text-muted-foreground shrink-0" />}
                    <h3 className="font-serif font-bold text-foreground leading-tight">{p.title}</h3>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full shrink-0 ${vis.color}`}>
                    {vis.icon} {vis.label}
                  </span>
                </div>

                {/* Author + date */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-bold">
                    {p.ownerName.charAt(0)}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    By <span className="font-semibold text-foreground">{p.ownerName}</span>
                    {" · "} Published {format(new Date(p.publishedAt), "d MMM yyyy")}
                  </span>
                </div>

                {/* Feedback badge */}
                {p.feedbackEnabled && (
                  <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" /> {p.feedbackCount} feedback
                    </span>
                    {p.feedbackVisibility === "private"
                      ? <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Private feedback</span>
                      : <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Public feedback</span>}
                    {p.canGiveFeedback && (
                      <span className="ml-auto text-emerald-600 font-semibold">You can give feedback</span>
                    )}
                  </div>
                )}

                {/* CTA */}
                <div className="mt-auto pt-3 border-t border-border">
                  <Link
                    href={`/project/${p.id}`}
                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline group"
                  >
                    Read this work
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
