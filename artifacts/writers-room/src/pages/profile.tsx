import { useState } from "react";
import { Link } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, Clock, XCircle, BookText, FileText,
  MessageSquareQuote, CalendarDays, PenLine, Users, Layers,
  ArrowRight, Sparkles, Tag, Trophy, BadgeCheck, BookOpen, Globe,
  Bell, ToggleLeft, ToggleRight, Lightbulb, Mail, CheckCheck,
} from "lucide-react";

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

function parseCredentials(raw: string | null | undefined): UserCredentials {
  try { return JSON.parse(raw ?? "{}"); } catch { return {}; }
}

type CollaboratorStat = {
  submitterId: number;
  submitterName: string;
  submitterEmail: string;
  total: number;
  accepted: number;
  discarded: number;
  pending: number;
  acceptRate: number;
  projectsTogether: { id: number; title: string }[];
};

function parseGenres(raw: string | null | undefined): string[] {
  try { return JSON.parse(raw ?? "[]"); } catch { return []; }
}

type PitchInvite = {
  id: number;
  pitchId: number;
  pitchTitle: string;
  pitchType: string;
  pitchGenres: string;
  fromUserId: number;
  fromUserName: string;
  message: string | null;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
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
    className: "border-[#E8B84B]/50 text-[#1A1614] bg-[#E8B84B]/10",
  },
  accepted: {
    label: "Accepted",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: "border-emerald-300 text-emerald-800 bg-emerald-50",
  },
  discarded: {
    label: "Discarded",
    icon: <XCircle className="w-3.5 h-3.5" />,
    className: "border-red-200 text-red-700 bg-red-50",
  },
};

const ROLE_CONFIG = {
  author:      { label: "Author",               icon: <PenLine className="w-4 h-4" />, color: "text-[#E8B84B]" },
  contributor: { label: "Contributor",           icon: <Users className="w-4 h-4" />,   color: "text-[#F7C5D5]" },
  both:        { label: "Author & Contributor",  icon: <Layers className="w-4 h-4" />,  color: "text-[#F7C5D5]" },
};

function truncate(text: string, max = 80) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: activity = [], isLoading } = useQuery<ActivityItem[]>({
    queryKey: ["/api/users", user?.id, "activity"],
    enabled: !!user,
    queryFn: () => fetch(`/api/users/${user!.id}/activity`).then((r) => r.json()),
  });

  const isAuthor = user?.role === "author" || user?.role === "both";
  const isContributor = user?.role === "contributor" || user?.role === "both";

  const { data: collabStats = [], isLoading: collabStatsLoading } = useQuery<CollaboratorStat[]>({
    queryKey: ["/api/users", user?.id, "collaborator-stats"],
    enabled: !!user && isAuthor,
    queryFn: () => fetch(`/api/users/${user!.id}/collaborator-stats`).then((r) => r.json()),
  });

  const { data: pitchInvites = [], isLoading: invitesLoading } = useQuery<PitchInvite[]>({
    queryKey: ["/api/users", user?.id, "pitch-invites"],
    enabled: !!user && isContributor,
    queryFn: () => fetch(`/api/users/${user!.id}/pitch-invites`).then((r) => r.json()),
  });

  const [openToApproach, setOpenToApproach] = useState<boolean>(user?.openToApproach ?? false);

  const openToApproachMutation = useMutation({
    mutationFn: (value: boolean) =>
      fetch(`/api/users/${user!.id}/open-to-approach`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openToApproach: value }),
      }).then((r) => r.json()),
    onSuccess: (_, value) => {
      setOpenToApproach(value);
    },
  });

  const respondToInviteMutation = useMutation({
    mutationFn: ({ inviteId, status }: { inviteId: number; status: "accepted" | "declined" }) =>
      fetch(`/api/pitch-invites/${inviteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user!.id, status }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "pitch-invites"] });
    },
  });

  if (!user) return null;

  const roleConf = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.both;

  const stats = {
    total:    activity.length,
    accepted: activity.filter((a) => a.status === "accepted").length,
    pending:  activity.filter((a) => a.status === "pending").length,
    discarded: activity.filter((a) => a.status === "discarded").length,
  };

  const acceptRate = stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-[#1A1614] p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6"
      >
        <div className="w-20 h-20 bg-[#1A1614] flex items-center justify-center shrink-0">
          <span className="text-3xl font-serif font-bold text-[#F9F6EE]">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-serif font-bold text-[#1A1614]">{user.name}</h1>
          <p className="text-[#7A6B5E] mt-1">{user.email}</p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 border border-[#1A1614]/20 uppercase tracking-[0.1em] ${roleConf.color}`}>
              {roleConf.icon}
              {roleConf.label}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[#7A6B5E]">
              <CalendarDays className="w-3.5 h-3.5" />
              Member since {format(new Date(user.createdAt), "MMMM yyyy")}
            </span>
          </div>

          {/* Genre interests */}
          {(() => {
            const genres = parseGenres(user.genres);
            return genres.length > 0 ? (
              <div className="mt-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7A6B5E] mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Areas of interest
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {genres.map((g) => (
                    <span key={g} className={`px-2.5 py-1 text-[11px] font-semibold ${GENRE_COLORS[g] ?? "bg-[#1A1614]/5 text-[#7A6B5E]"}`}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {user.mediaInterests && (
            <div className="mt-3 flex items-start gap-2 text-sm text-[#7A6B5E]">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#E8B84B]" />
              <p>{user.mediaInterests}</p>
            </div>
          )}

          {/* Credentials */}
          {(() => {
            const creds = parseCredentials(user.credentials);
            const hasAnything = creds.isPublishedAuthor || creds.professionalTitle ||
              (creds.publishedWorks?.length ?? 0) > 0 || creds.website;
            if (!hasAnything) return null;
            return (
              <div className="mt-4 pt-4 border-t border-[#1A1614]/10">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7A6B5E] mb-2.5 flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-[#E8B84B]" />
                  {creds.isPublishedAuthor ? "Published Author" : "Credentials"}
                </p>
                {creds.professionalTitle && (
                  <p className="text-sm font-semibold text-[#1A1614] mb-2">{creds.professionalTitle}</p>
                )}
                {(creds.publishedWorks?.length ?? 0) > 0 && (
                  <div className="space-y-1 mb-2">
                    {creds.publishedWorks!.map((w, i) => (
                      <div key={i} className="flex items-baseline gap-1.5 text-xs">
                        <BookOpen className="w-3.5 h-3.5 shrink-0 text-[#7A6B5E] mt-px" />
                        <span className="font-semibold text-[#1A1614]">{w.title}</span>
                        {w.year && <span className="text-[#7A6B5E]">{w.year}</span>}
                        {w.publisher && <span className="text-[#7A6B5E]">· {w.publisher}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {(creds.website || creds.linkedin || creds.patreon || creds.substack) && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {creds.website && (
                      <a href={creds.website} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                        <Globe className="w-3.5 h-3.5" />
                        {creds.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    {creds.linkedin && (
                      <a href={creds.linkedin} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A66C2] bg-[#0A66C2]/10 px-2 py-0.5 rounded hover:bg-[#0A66C2]/20 transition-colors">
                        LinkedIn
                      </a>
                    )}
                    {creds.patreon && (
                      <a href={creds.patreon} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F96854] bg-[#F96854]/10 px-2 py-0.5 rounded hover:bg-[#F96854]/20 transition-colors">
                        Patreon
                      </a>
                    )}
                    {creds.substack && (
                      <a href={creds.substack} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6719] bg-[#FF6719]/10 px-2 py-0.5 rounded hover:bg-[#FF6719]/20 transition-colors">
                        Substack
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Open to Approach toggle — contributors only */}
          {isContributor && (
            <div className="mt-4 pt-4 border-t border-[#1A1614]/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7A6B5E] mb-0.5 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" /> Open to direct approach
                  </p>
                  <p className="text-xs text-[#7A6B5E]">
                    Allow authors to invite you to their pitches directly
                  </p>
                </div>
                <button
                  onClick={() => openToApproachMutation.mutate(!openToApproach)}
                  disabled={openToApproachMutation.isPending}
                  className="flex items-center gap-1.5 shrink-0 transition-opacity disabled:opacity-50"
                  aria-label="Toggle open to approach"
                >
                  {openToApproach
                    ? <ToggleRight className="w-9 h-9 text-emerald-500" />
                    : <ToggleLeft className="w-9 h-9 text-[#7A6B5E]/40" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px border border-[#1A1614]/15 mb-10 bg-[#1A1614]/10">
        {[
          { label: "Total Edits",  value: stats.total,     icon: <MessageSquareQuote className="w-5 h-5" />, color: "text-[#1A1614]" },
          { label: "Accepted",     value: stats.accepted,  icon: <CheckCircle2 className="w-5 h-5" />,      color: "text-emerald-600" },
          { label: "Pending",      value: stats.pending,   icon: <Clock className="w-5 h-5" />,              color: "text-[#E8B84B]" },
          { label: "Accept Rate",  value: `${acceptRate}%`, icon: <ArrowRight className="w-5 h-5" />,       color: "text-blue-600" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-5 flex flex-col gap-2"
          >
            <div className={stat.color}>{stat.icon}</div>
            <p className="text-2xl font-bold text-[#1A1614]">{stat.value}</p>
            <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-[#7A6B5E]">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Best Collaborators – authors only */}
      {isAuthor && (
        <div className="mb-10">
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2 flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-[#E8B84B]" /> Top Collaborators
            </p>
            <div className="border-t-2 border-[#1A1614] mb-2" />
            <h2 className="text-2xl font-serif font-bold text-[#1A1614]">My Best Collaborators</h2>
            <div className="border-t border-[#1A1614]/15 mt-3" />
          </div>

          {collabStatsLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-b-2 border-[#1A1614] animate-spin rounded-full" />
            </div>
          ) : collabStats.length === 0 ? (
            <div className="bg-white border border-[#1A1614]/15 p-10 text-center">
              <Users className="w-10 h-10 text-[#7A6B5E] mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-serif font-bold text-[#1A1614]">No collaborator data yet</h3>
              <p className="text-sm text-[#7A6B5E] mt-1 max-w-xs mx-auto">
                Once contributors suggest edits on your projects, their stats will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {collabStats.map((c, i) => {
                const rankLabel = i === 0 ? "#1" : i === 1 ? "#2" : i === 2 ? "#3" : `#${i + 1}`;
                return (
                  <motion.div
                    key={c.submitterId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white border border-[#1A1614]/15 p-5 hover:border-[#E8B84B] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-[#1A1614] flex items-center justify-center font-bold text-lg shrink-0 text-[#F9F6EE]">
                        {c.submitterName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#E8B84B]">{rankLabel}</span>
                          <p className="font-bold text-[#1A1614]">{c.submitterName}</p>
                          <span className="text-xs text-[#7A6B5E]">{c.submitterEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 h-1.5 bg-[#1A1614]/10 overflow-hidden">
                            <div
                              className="h-full bg-[#E8B84B]"
                              style={{ width: `${c.acceptRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#1A1614]">{c.acceptRate}% accepted</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {c.projectsTogether.map((p) => (
                            <Link
                              key={p.id}
                              href={`/project/${p.id}`}
                              className="text-[10px] border border-[#1A1614]/15 text-[#7A6B5E] hover:border-[#E8B84B] hover:text-[#1A1614] px-2 py-0.5 transition-colors"
                            >
                              {p.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 grid grid-cols-3 gap-3 text-center">
                        {[
                          { label: "Total",    value: c.total,    color: "text-[#1A1614]" },
                          { label: "Accepted", value: c.accepted, color: "text-emerald-600" },
                          { label: "Pending",  value: c.pending,  color: "text-[#E8B84B]" },
                        ].map((s) => (
                          <div key={s.label}>
                            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-[9px] text-[#7A6B5E] uppercase tracking-[0.1em]">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Contribution history */}
      <div>
        <div className="mb-5">
          <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">Your edit history</p>
          <div className="border-t-2 border-[#1A1614] mb-2" />
          <h2 className="text-2xl font-serif font-bold text-[#1A1614]">Contribution History</h2>
          <div className="border-t border-[#1A1614]/15 mt-3" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-b-2 border-[#1A1614] animate-spin rounded-full" />
          </div>
        ) : activity.length === 0 ? (
          <div className="bg-white border border-[#1A1614]/15 p-12 text-center">
            <MessageSquareQuote className="w-12 h-12 text-[#7A6B5E] mx-auto mb-4 opacity-40" />
            <h3 className="text-lg font-serif font-bold text-[#1A1614]">No contributions yet</h3>
            <p className="text-[#7A6B5E] mt-2 text-sm max-w-sm mx-auto">
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
                  className="bg-white border border-[#1A1614]/15 p-5 hover:border-[#E8B84B] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <Link
                      href={`/project/${item.projectId}`}
                      className="flex items-center gap-2 text-sm font-bold text-[#1A1614] hover:text-[#E8B84B] transition-colors group"
                    >
                      {item.projectType === "book"
                        ? <BookText className="w-4 h-4 text-[#7A6B5E] group-hover:text-[#E8B84B]" />
                        : <FileText className="w-4 h-4 text-[#7A6B5E] group-hover:text-[#E8B84B]" />}
                      {item.projectTitle}
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 border uppercase tracking-[0.1em] ${conf.className}`}>
                        {conf.icon}
                        {conf.label}
                      </span>
                      <span className="text-xs text-[#7A6B5E]">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-mono">
                    <div className="bg-red-50 border border-red-100 px-3 py-2 text-red-700 leading-relaxed">
                      <span className="text-red-400 mr-1 select-none">−</span>
                      {truncate(item.originalText)}
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 px-3 py-2 text-emerald-800 leading-relaxed">
                      <span className="text-emerald-400 mr-1 select-none">+</span>
                      {truncate(item.suggestedText)}
                    </div>
                  </div>

                  {item.comment && (
                    <p className="mt-2 text-xs text-[#7A6B5E] italic">"{item.comment}"</p>
                  )}
                  {item.ownerNote && (
                    <p className="mt-1.5 text-xs text-[#1A1614] bg-[#E8B84B]/10 px-3 py-1.5">
                      <span className="font-bold">Author note:</span> {item.ownerNote}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pitch Invites — contributors only */}
      {isContributor && (
        <div className="mb-10">
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#E8B84B]" /> Pitch Invitations
            </p>
            <div className="border-t-2 border-[#1A1614] mb-2" />
            <h2 className="text-2xl font-serif font-bold text-[#1A1614]">Invitations from Authors</h2>
            <div className="border-t border-[#1A1614]/15 mt-3" />
          </div>

          {invitesLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-b-2 border-[#1A1614] animate-spin rounded-full" />
            </div>
          ) : pitchInvites.length === 0 ? (
            <div className="bg-white border border-[#1A1614]/15 p-10 text-center">
              <Lightbulb className="w-10 h-10 text-[#7A6B5E] mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-serif font-bold text-[#1A1614]">No invitations yet</h3>
              <p className="text-sm text-[#7A6B5E] mt-1 max-w-xs mx-auto">
                {openToApproach
                  ? "Authors whose pitch genres match your interests can invite you here."
                  : "Enable \"Open to direct approach\" above to start receiving invitations."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pitchInvites.map((inv, i) => {
                let genres: string[] = [];
                try { genres = JSON.parse(inv.pitchGenres ?? "[]"); } catch {}
                return (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white border border-[#1A1614]/15 p-5 hover:border-[#E8B84B] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Link href={`/pitch/${inv.pitchId}`}
                          className="font-serif font-bold text-[#1A1614] hover:text-[#E8B84B] transition-colors text-base leading-snug block mb-1">
                          {inv.pitchTitle}
                        </Link>
                        <p className="text-xs text-[#7A6B5E] mb-2">
                          Invited by <span className="font-semibold">{inv.fromUserName}</span>
                          {" · "}{format(new Date(inv.createdAt), "d MMM yyyy")}
                        </p>
                        {genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {genres.map((g) => (
                              <span key={g} className={`px-2 py-0.5 text-[10px] font-semibold ${GENRE_COLORS[g] ?? "bg-[#1A1614]/5 text-[#7A6B5E]"}`}>{g}</span>
                            ))}
                          </div>
                        )}
                        {inv.message && (
                          <p className="text-xs text-[#7A6B5E] italic bg-[#F9F6EE] border border-[#1A1614]/10 px-3 py-2 mt-1">
                            "{inv.message}"
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        {inv.status === "pending" ? (
                          <>
                            <button
                              onClick={() => respondToInviteMutation.mutate({ inviteId: inv.id, status: "accepted" })}
                              disabled={respondToInviteMutation.isPending}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              <CheckCheck className="w-3.5 h-3.5" /> Accept
                            </button>
                            <button
                              onClick={() => respondToInviteMutation.mutate({ inviteId: inv.id, status: "declined" })}
                              disabled={respondToInviteMutation.isPending}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-[#1A1614]/20 text-[#7A6B5E] rounded-lg hover:border-[#1A1614] hover:text-[#1A1614] transition-colors"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                            inv.status === "accepted" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"
                          }`}>
                            {inv.status === "accepted" ? "Accepted" : "Declined"}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
