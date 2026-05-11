import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft, PenLine, Users, Layers, BadgeCheck, Globe, BookOpen,
  BarChart2, CheckCircle2, Sparkles, Tag, Bell, Star, MessageSquare,
  X, Send, Briefcase, Award,
} from "lucide-react";
import { AchievementGrid, ReputationScore, type Achievement } from "@/components/reputation-badge";

type PublicUser = {
  id: number;
  name: string;
  role: "author" | "contributor" | "both";
  genres: string;
  mediaInterests: string | null;
  bio: string | null;
  credentials: string | null;
  avatarUrl: string | null;
  openToApproach: boolean;
  profilePublic: boolean;
  createdAt: string;
  totalSuggestions: number;
  acceptRate: number | null;
};

type UserCredentials = {
  professionalTitle?: string;
  isPublishedAuthor?: boolean;
  publishedWorks?: { title: string; year?: number; publisher?: string }[];
  website?: string;
  linkedin?: string;
  patreon?: string;
  substack?: string;
  editingSpecialties?: string[];
  experienceLevel?: string;
  availableForWork?: boolean;
};

const GENRE_COLORS: Record<string, string> = {
  "Film & TV Script": "bg-purple-100 text-purple-700",
  "Long-form Fiction": "bg-blue-100 text-blue-700",
  "Non-fiction": "bg-teal-100 text-teal-700",
  "Short Story": "bg-amber-100 text-amber-700",
  "Poetry": "bg-pink-100 text-pink-700",
  "Fan Fiction": "bg-orange-100 text-orange-700",
  "Screenwriting": "bg-violet-100 text-violet-700",
  "Graphic Novel / Comics": "bg-indigo-100 text-indigo-700",
  "Children's Literature": "bg-green-100 text-green-700",
  "Literary Fiction": "bg-cyan-100 text-cyan-700",
  "Thriller / Mystery": "bg-red-100 text-red-700",
  "Romance": "bg-rose-100 text-rose-700",
  "Science Fiction / Fantasy": "bg-sky-100 text-sky-700",
  "Horror": "bg-stone-100 text-stone-700",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  novice: "Novice", intermediate: "Intermediate",
  experienced: "Experienced", professional: "Professional",
};

const ROLE_CONFIG = {
  author:      { label: "Author",              icon: <PenLine className="w-4 h-4" />,  color: "text-[#E8B84B]" },
  contributor: { label: "Contributor",          icon: <Users className="w-4 h-4" />,    color: "text-[#F7C5D5]" },
  both:        { label: "Author & Contributor", icon: <Layers className="w-4 h-4" />,   color: "text-[#F7C5D5]" },
};

function parseGenres(raw: string | null): string[] {
  try { return JSON.parse(raw ?? "[]"); } catch { return []; }
}

function parseCreds(raw: string | null): UserCredentials {
  try { return JSON.parse(raw ?? "{}"); } catch { return {}; }
}

export default function PublicProfile() {
  const params = useParams<{ id: string }>();
  const profileId = parseInt(params.id, 10);
  const { user } = useAuth();

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeBody, setComposeBody] = useState("");
  const [sent, setSent] = useState(false);

  const { data: profile, isLoading, isError } = useQuery<PublicUser>({
    queryKey: ["/api/users", profileId, "public"],
    queryFn: () => fetch(`/api/users/${profileId}/public`).then((r) => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }),
    enabled: !isNaN(profileId),
  });

  const { data: reputation } = useQuery<{
    score: number;
    totalSuggestions: number;
    acceptedSuggestions: number;
    acceptRate: number | null;
    achievements: Achievement[];
  }>({
    queryKey: ["/api/users", profileId, "reputation"],
    queryFn: () => fetch(`/api/users/${profileId}/reputation`).then(r => r.json()),
    enabled: !isNaN(profileId),
  });

  const sendMessage = useMutation({
    mutationFn: () => fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromUserId: user!.id, toUserId: profileId, body: composeBody }),
    }).then((r) => r.json()),
    onSuccess: () => { setSent(true); setComposeBody(""); setTimeout(() => { setComposeOpen(false); setSent(false); }, 2000); },
  });

  if (isNaN(profileId) || isError) {
    return (
      <div className="p-10 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-serif font-bold text-[#1A1614] mb-2">Profile not found</h2>
        <Link href="/contributors" className="text-sm text-[#E8B84B] hover:underline">← Back to editors</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 border-b-2 border-[#1A1614] animate-spin rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  // Private profile — unauthenticated visitors see a locked state
  if (!user && !profile.profilePublic) {
    return (
      <div className="min-h-screen bg-[#F9F6EE]">
        <header className="border-b-2 border-[#1A1614] bg-[#F9F6EE]">
          <div className="border-b border-[#1A1614]/15 px-6 md:px-14 py-1.5 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#7A6B5E] font-semibold">Collaborative Writing Platform</span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#7A6B5E] font-semibold">Free to join</span>
          </div>
          <div className="px-6 md:px-14 py-3 flex items-center justify-between">
            <Link href="/"><span className="font-serif font-bold text-2xl text-[#1A1614] hover:text-[#E8B84B] transition-colors">Writers Room</span></Link>
            <Link href="/"><span className="px-4 py-1.5 bg-[#1A1614] text-[#F9F6EE] text-[11px] uppercase tracking-[0.16em] font-bold hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors">Join free</span></Link>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
          <div className="w-16 h-16 bg-[#1A1614]/6 flex items-center justify-center mb-6">
            <span className="text-3xl font-serif font-bold text-[#1A1614]/30">{profile.name.charAt(0).toUpperCase()}</span>
          </div>
          <h2 className="font-serif font-bold text-2xl text-[#1A1614] mb-2">{profile.name}</h2>
          <p className="text-sm text-[#7A6B5E] mb-6 max-w-xs">This profile is set to private by the member.</p>
          <Link href="/">
            <span className="px-6 py-2.5 bg-[#1A1614] text-[#F9F6EE] text-[11px] uppercase tracking-[0.14em] font-bold hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors">Join Writers Room</span>
          </Link>
        </div>
      </div>
    );
  }

  const creds = parseCreds(profile.credentials);
  const genres = parseGenres(profile.genres);
  const roleConf = ROLE_CONFIG[profile.role] ?? ROLE_CONFIG.both;
  const isOwnProfile = user?.id === profile.id;
  const isContributor = profile.role === "contributor" || profile.role === "both";
  const canMessage = !!user && !isOwnProfile;

  return (
    <div className={user ? "" : "min-h-screen bg-[#F9F6EE]"}>
      {/* Public nav — shown only to unauthenticated visitors */}
      {!user && (
        <header className="border-b-2 border-[#1A1614] bg-[#F9F6EE]">
          <div className="border-b border-[#1A1614]/15 px-6 md:px-14 py-1.5 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#7A6B5E] font-semibold">Collaborative Writing Platform</span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#7A6B5E] font-semibold">Free to join</span>
          </div>
          <div className="px-6 md:px-14 py-3 flex items-center justify-between">
            <Link href="/">
              <span className="font-serif font-bold text-2xl text-[#1A1614] hover:text-[#E8B84B] transition-colors">Writers Room</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/how-it-works">
                <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#7A6B5E] hover:text-[#1A1614] transition-colors hidden sm:block">How it works</span>
              </Link>
              <Link href="/">
                <span className="px-4 py-1.5 bg-[#1A1614] text-[#F9F6EE] text-[11px] uppercase tracking-[0.16em] font-bold hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors">Join free</span>
              </Link>
            </div>
          </div>
        </header>
      )}
      <div className="p-6 md:p-10 max-w-3xl mx-auto">
      {/* Back link — only shown to logged-in members */}
      {user && (
        <Link href="/contributors" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#7A6B5E] hover:text-[#1A1614] transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> All Editors
        </Link>
      )}

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-[#1A1614] p-8 mb-6"
      >
        <div className="flex items-start gap-6 flex-wrap">
          {/* Avatar */}
          <div className="w-20 h-20 bg-[#1A1614] flex items-center justify-center shrink-0">
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              : <span className="text-3xl font-serif font-bold text-[#F9F6EE]">{profile.name.charAt(0).toUpperCase()}</span>}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-3xl font-serif font-bold text-[#1A1614]">{profile.name}</h1>
                  {creds.isPublishedAuthor && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#E8B84B] bg-[#E8B84B]/10 border border-[#E8B84B]/30 px-2 py-0.5">
                      <BadgeCheck className="w-3 h-3" /> Published
                    </span>
                  )}
                </div>
                {creds.professionalTitle && (
                  <p className="text-sm text-[#7A6B5E] font-medium mt-0.5">{creds.professionalTitle}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 border border-[#1A1614]/20 uppercase tracking-[0.1em] ${roleConf.color}`}>
                    {roleConf.icon}{roleConf.label}
                  </span>
                  {creds.experienceLevel && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7A6B5E] bg-[#F9F6EE] border border-[#1A1614]/10 px-2 py-0.5">
                      <Briefcase className="w-3 h-3 inline mr-1" />
                      {EXPERIENCE_LABELS[creds.experienceLevel] ?? creds.experienceLevel}
                    </span>
                  )}
                  {creds.availableForWork && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                      <CheckCircle2 className="w-3 h-3 inline mr-1" /> Available
                    </span>
                  )}
                  {profile.openToApproach && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#E8B84B] bg-[#E8B84B]/10 border border-[#E8B84B]/30 px-2 py-0.5">
                      <Bell className="w-3 h-3 inline mr-1" /> Open to pitches
                    </span>
                  )}
                </div>
              </div>

              {/* Message button */}
              {canMessage && (
                <button
                  onClick={() => setComposeOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1614] text-[#F9F6EE] text-sm font-semibold hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors shrink-0"
                >
                  <MessageSquare className="w-4 h-4" /> Message
                </button>
              )}
            </div>

            {/* Member since */}
            <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-[#7A6B5E]/60 mt-2">
              Member since {format(new Date(profile.createdAt), "MMMM yyyy")}
            </p>
          </div>
        </div>

        {/* Stats bar */}
        {isContributor && profile.totalSuggestions > 0 && (
          <div className="flex gap-6 mt-6 pt-5 border-t border-[#1A1614]/10">
            <div>
              <p className="text-2xl font-serif font-bold text-[#1A1614]">{profile.totalSuggestions}</p>
              <p className="text-[9px] uppercase tracking-[0.16em] font-bold text-[#7A6B5E]">Total edits</p>
            </div>
            {profile.acceptRate !== null && (
              <div>
                <p className="text-2xl font-serif font-bold text-[#1A1614]">{profile.acceptRate}%</p>
                <p className="text-[9px] uppercase tracking-[0.16em] font-bold text-[#7A6B5E]">Accept rate</p>
              </div>
            )}
            <div className="flex-1 flex items-end justify-end">
              <div className="w-full max-w-32 h-1.5 bg-[#1A1614]/10 overflow-hidden">
                <div className="h-full bg-[#E8B84B]" style={{ width: `${profile.acceptRate ?? 0}%` }} />
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Reputation & Achievements */}
      {reputation && isContributor && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border-2 border-[#1A1614] p-6 mb-6"
        >
          <div className="flex items-start gap-5 flex-wrap">
            <ReputationScore score={reputation.score} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-3.5 h-3.5 text-[#E8B84B]" />
                <p className="text-[9px] uppercase tracking-[0.22em] font-bold text-[#7A6B5E]">Reputation & Achievements</p>
              </div>
              {reputation.achievements.some(a => a.earned) ? (
                <AchievementGrid achievements={reputation.achievements} />
              ) : (
                <p className="text-sm text-[#7A6B5E] italic">No achievements earned yet — contributions will unlock them.</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="md:col-span-2 space-y-5">
          {/* Bio */}
          {(profile.bio || profile.mediaInterests) && (
            <section className="bg-white border border-[#1A1614]/15 p-5">
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#7A6B5E] mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E8B84B]" /> About
              </p>
              <p className="text-sm text-[#7A6B5E] leading-relaxed">{profile.bio || profile.mediaInterests}</p>
            </section>
          )}

          {/* Editing specialties */}
          {(creds.editingSpecialties?.length ?? 0) > 0 && (
            <section className="bg-white border border-[#1A1614]/15 p-5">
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#7A6B5E] mb-3">Editing specialties</p>
              <div className="flex flex-wrap gap-1.5">
                {creds.editingSpecialties!.map((s) => (
                  <span key={s} className="px-2.5 py-1 text-[11px] font-semibold bg-[#1A1614]/6 text-[#1A1614] border border-[#1A1614]/12 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Published works */}
          {(creds.publishedWorks?.length ?? 0) > 0 && (
            <section className="bg-white border border-[#1A1614]/15 p-5">
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#7A6B5E] mb-3 flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5 text-[#E8B84B]" />
                {creds.isPublishedAuthor ? "Published Author" : "Published Works"}
              </p>
              <div className="space-y-1.5">
                {creds.publishedWorks!.map((w, i) => (
                  <div key={i} className="flex items-baseline gap-1.5 text-sm">
                    <BookOpen className="w-3.5 h-3.5 text-[#7A6B5E] shrink-0 mt-px" />
                    <span className="font-semibold text-[#1A1614]">{w.title}</span>
                    {w.year && <span className="text-[#7A6B5E] text-xs">{w.year}</span>}
                    {w.publisher && <span className="text-[#7A6B5E] text-xs">· {w.publisher}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Genres */}
          {genres.length > 0 && (
            <section className="bg-white border border-[#1A1614]/15 p-5">
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#7A6B5E] mb-3 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Genres
              </p>
              <div className="flex flex-wrap gap-1.5">
                {genres.map((g) => (
                  <span key={g} className={`px-2 py-0.5 text-[10px] font-semibold ${GENRE_COLORS[g] ?? "bg-[#1A1614]/5 text-[#7A6B5E]"}`}>{g}</span>
                ))}
              </div>
            </section>
          )}

          {/* Links */}
          {(creds.website || creds.linkedin || creds.patreon || creds.substack) && (
            <section className="bg-white border border-[#1A1614]/15 p-5">
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#7A6B5E] mb-3">Links</p>
              <div className="space-y-2">
                {creds.website && (
                  <a href={creds.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline">
                    <Globe className="w-3.5 h-3.5" />{creds.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {creds.linkedin && (
                  <a href={creds.linkedin} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#0A66C2] bg-[#0A66C2]/10 px-2 py-0.5 rounded hover:bg-[#0A66C2]/20 transition-colors inline-block">LinkedIn</a>
                )}
                {creds.patreon && (
                  <a href={creds.patreon} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#F96854] bg-[#F96854]/10 px-2 py-0.5 rounded hover:bg-[#F96854]/20 transition-colors inline-block">Patreon</a>
                )}
                {creds.substack && (
                  <a href={creds.substack} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#FF6719] bg-[#FF6719]/10 px-2 py-0.5 rounded hover:bg-[#FF6719]/20 transition-colors inline-block">Substack</a>
                )}
              </div>
            </section>
          )}

          {/* Stats */}
          {isContributor && profile.totalSuggestions > 0 && (
            <section className="bg-white border border-[#1A1614]/15 p-5">
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#7A6B5E] mb-3 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5" /> Activity
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#7A6B5E]">Total edits</span>
                  <span className="font-bold text-[#1A1614]">{profile.totalSuggestions}</span>
                </div>
                {profile.acceptRate !== null && (
                  <div className="flex justify-between">
                    <span className="text-[#7A6B5E]">Accept rate</span>
                    <span className="font-bold text-[#1A1614]">{profile.acceptRate}%</span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Compose message modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setComposeOpen(false)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-[#F9F6EE] border-2 border-[#1A1614] p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-lg text-[#1A1614]">Message {profile.name}</h3>
              <button onClick={() => setComposeOpen(false)} className="text-[#7A6B5E] hover:text-[#1A1614]">
                <X className="w-5 h-5" />
              </button>
            </div>
            {sent ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-[#1A1614]">Message sent!</p>
              </div>
            ) : (
              <>
                <textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  rows={5}
                  className="w-full bg-white border border-[#1A1614]/20 focus:border-[#1A1614] outline-none px-3 py-2.5 text-sm text-[#1A1614] resize-none"
                  placeholder={`Introduce yourself and explain why you'd like to collaborate with ${profile.name}…`}
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
                    onClick={() => setComposeOpen(false)}
                    className="px-4 py-2.5 border border-[#1A1614]/20 text-[#7A6B5E] text-sm font-semibold hover:border-[#1A1614] hover:text-[#1A1614] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
    </div>
  );
}
