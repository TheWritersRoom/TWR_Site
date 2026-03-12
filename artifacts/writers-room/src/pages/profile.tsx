import { Link } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2, Clock, XCircle, BookText, FileText,
  MessageSquareQuote, CalendarDays, PenLine, Users, Layers,
  ArrowRight, Sparkles, Tag,
} from "lucide-react";

function parseGenres(raw: string | null | undefined): string[] {
  try { return JSON.parse(raw ?? "[]"); } catch { return []; }
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

type ActivityItem = {
  id: number;
  projectId: number;
  projectTitle: string;
  projectType: "book" | "script";
  originalText: string;
  suggestedText: string;
  comment: string | null;
  status: "pending" | "accepted" | "discarded";
  ownerNote: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: <Clock className="w-3.5 h-3.5" />,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  accepted: {
    label: "Accepted",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  discarded: {
    label: "Discarded",
    icon: <XCircle className="w-3.5 h-3.5" />,
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

const ROLE_CONFIG = {
  author: { label: "Author", icon: <PenLine className="w-4 h-4" />, className: "bg-blue-100 text-blue-700" },
  contributor: { label: "Contributor", icon: <Users className="w-4 h-4" />, className: "bg-amber-100 text-amber-700" },
  both: { label: "Author & Contributor", icon: <Layers className="w-4 h-4" />, className: "bg-emerald-100 text-emerald-700" },
};

function truncate(text: string, max = 80) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export default function Profile() {
  const { user } = useAuth();

  const { data: activity = [], isLoading } = useQuery<ActivityItem[]>({
    queryKey: ["/api/users", user?.id, "activity"],
    enabled: !!user,
    queryFn: () => fetch(`/api/users/${user!.id}/activity`).then((r) => r.json()),
  });

  if (!user) return null;

  const roleConf = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.both;

  const stats = {
    total: activity.length,
    accepted: activity.filter((a) => a.status === "accepted").length,
    pending: activity.filter((a) => a.status === "pending").length,
    discarded: activity.filter((a) => a.status === "discarded").length,
  };

  const acceptRate = stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl border border-border shadow-sm p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
          <span className="text-3xl font-serif font-bold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-serif font-bold text-foreground">{user.name}</h1>
          <p className="text-muted-foreground mt-1">{user.email}</p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${roleConf.className}`}>
              {roleConf.icon}
              {roleConf.label}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="w-3.5 h-3.5" />
              Member since {format(new Date(user.createdAt), "MMMM yyyy")}
            </span>
          </div>

          {/* Genre interests */}
          {(() => {
            const genres = parseGenres(user.genres);
            return genres.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Areas of interest
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {genres.map((g) => (
                    <span key={g} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${GENRE_COLORS[g] ?? "bg-muted text-muted-foreground"}`}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Media interests */}
          {user.mediaInterests && (
            <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
              <p>{user.mediaInterests}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Edits", value: stats.total, icon: <MessageSquareQuote className="w-5 h-5" />, color: "text-primary" },
          { label: "Accepted", value: stats.accepted, icon: <CheckCircle2 className="w-5 h-5" />, color: "text-emerald-600" },
          { label: "Pending", value: stats.pending, icon: <Clock className="w-5 h-5" />, color: "text-yellow-600" },
          { label: "Accept Rate", value: `${acceptRate}%`, icon: <ArrowRight className="w-5 h-5" />, color: "text-blue-600" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-2"
          >
            <div className={`${stat.color}`}>{stat.icon}</div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Activity list */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-4">Contribution History</h2>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : activity.length === 0 ? (
          <div className="bg-card rounded-3xl border border-border p-12 text-center">
            <MessageSquareQuote className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="text-lg font-serif font-semibold text-foreground">No contributions yet</h3>
            <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
              Once you suggest edits on a project, they'll appear here with their status.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activity.map((item, i) => {
              const conf = STATUS_CONFIG[item.status];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <Link
                      href={`/project/${item.projectId}`}
                      className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors group"
                    >
                      {item.projectType === "book"
                        ? <BookText className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                        : <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary" />}
                      {item.projectTitle}
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${conf.className}`}>
                        {conf.icon}
                        {conf.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Diff preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-mono">
                    <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-red-700 leading-relaxed">
                      <span className="text-red-400 mr-1 select-none">−</span>
                      {truncate(item.originalText)}
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-emerald-800 leading-relaxed">
                      <span className="text-emerald-400 mr-1 select-none">+</span>
                      {truncate(item.suggestedText)}
                    </div>
                  </div>

                  {item.comment && (
                    <p className="mt-2 text-xs text-muted-foreground italic">
                      "{item.comment}"
                    </p>
                  )}
                  {item.ownerNote && (
                    <p className="mt-1.5 text-xs text-foreground bg-accent/50 rounded-lg px-3 py-1.5">
                      <span className="font-semibold">Author note:</span> {item.ownerNote}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
