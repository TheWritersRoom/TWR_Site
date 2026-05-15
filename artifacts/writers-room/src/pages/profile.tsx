import { useState, useEffect } from "react";
import { Link } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UploadableAvatar } from "@/components/avatar";
import {
  CheckCircle2, Clock, XCircle, BookText, FileText,
  MessageSquareQuote, CalendarDays, PenLine, Users, Layers,
  ArrowRight, Sparkles, Tag, Trophy, BadgeCheck, BookOpen, Globe,
  Bell, ToggleLeft, ToggleRight, Lightbulb, Mail, CheckCheck,
  Pencil, Plus, Trash2, X, Check, Save, Star, MessageSquare, BookmarkX,
} from "lucide-react";
import { InkBadge } from "@/components/ink-badge";

type PublishedWork = { title: string; year?: number; publisher?: string };
type WorkEntry    = { title: string; year: string; publisher: string };

type UserCredentials = {
  professionalTitle?: string;
  isPublishedAuthor?: boolean;
  publishedWorks?: PublishedWork[];
  website?: string;
  linkedin?: string;
  patreon?: string;
  substack?: string;
  editingSpecialties?: string[];
  experienceLevel?: string;
  availableForWork?: boolean;
};

const EXPERIENCE_LABELS: Record<string, string> = {
  novice: "Novice",
  intermediate: "Intermediate",
  experienced: "Experienced",
  professional: "Professional",
};

const EDITING_SPECIALTIES = [
  "Plotting & Structure", "Character Development", "Dialogue & Voice", "World-building",
  "Pacing & Flow", "Research & Fact-checking", "Developmental Editing", "Line Editing",
  "Copy Editing & Proofreading", "Poetry", "Screenwriting", "Non-fiction",
  "Beta Reading", "Script Coverage",
];

const EXPERIENCE_LEVELS = [
  { value: "novice",       label: "Novice",       desc: "Just starting out" },
  { value: "intermediate", label: "Intermediate",  desc: "Some experience" },
  { value: "experienced",  label: "Experienced",   desc: "Several years" },
  { value: "professional", label: "Professional",  desc: "Working professionally" },
];

const ALL_GENRES = [
  "Film & TV Script", "Long-form Fiction", "Non-fiction", "Short Story",
  "Poetry", "Fan Fiction", "Screenwriting", "Graphic Novel / Comics",
  "Children's Literature", "Literary Fiction", "Thriller / Mystery",
  "Romance", "Science Fiction / Fantasy", "Horror",
];

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

function parseCredentials(raw: string | null | undefined): UserCredentials {
  try { return JSON.parse(raw ?? "{}"); } catch { return {}; }
}

function parseGenres(raw: string | null | undefined): string[] {
  try { return JSON.parse(raw ?? "[]"); } catch { return []; }
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

type BookmarkedContributor = {
  bookmarkId: number;
  contributorId: number;
  contributorName: string;
  contributorRole: string;
  contributorBio: string | null;
  contributorGenres: string | null;
  contributorCredentials: string | null;
  contributorAvatar: string | null;
  contributorOpenToApproach: boolean;
  totalSuggestions: number;
  acceptRate: number | null;
  editingSpecialties: string[];
  availableForWork: boolean;
  experienceLevel: string | null;
  professionalTitle: string | null;
  savedAt: string;
};

type InboxMessage = {
  id: number;
  fromUserId: number;
  fromName: string;
  body: string;
  isRead: boolean;
  createdAt: string;
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

// ─── Edit Drawer ──────────────────────────────────────────────────────────────
function EditProfileDrawer({
  open,
  onClose,
  user,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  onSaved: (updated: NonNullable<ReturnType<typeof useAuth>["user"]>) => void;
}) {
  const creds = parseCredentials(user.credentials);
  const isContributor = user.role === "contributor" || user.role === "both";

  const [name, setName]               = useState(user.name);
  const [about, setAbout]             = useState(user.mediaInterests ?? "");
  const [genres, setGenres]           = useState<string[]>(parseGenres(user.genres));
  const [credTitle, setCredTitle]     = useState(creds.professionalTitle ?? "");
  const [works, setWorks]             = useState<WorkEntry[]>(
    (creds.publishedWorks ?? []).map((w) => ({
      title: w.title,
      year: w.year ? String(w.year) : "",
      publisher: w.publisher ?? "",
    }))
  );
  const [website, setWebsite]         = useState(creds.website ?? "");
  const [linkedin, setLinkedin]       = useState(creds.linkedin ?? "");
  const [patreon, setPatreon]         = useState(creds.patreon ?? "");
  const [substack, setSubstack]       = useState(creds.substack ?? "");
  const [specialties, setSpecialties] = useState<string[]>(creds.editingSpecialties ?? []);
  const [experience, setExperience]   = useState(creds.experienceLevel ?? "");
  const [available, setAvailable]     = useState(creds.availableForWork ?? false);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const c = parseCredentials(user.credentials);
      setName(user.name);
      setAbout(user.mediaInterests ?? "");
      setGenres(parseGenres(user.genres));
      setCredTitle(c.professionalTitle ?? "");
      setWorks((c.publishedWorks ?? []).map((w) => ({ title: w.title, year: w.year ? String(w.year) : "", publisher: w.publisher ?? "" })));
      setWebsite(c.website ?? "");
      setLinkedin(c.linkedin ?? "");
      setPatreon(c.patreon ?? "");
      setSubstack(c.substack ?? "");
      setSpecialties(c.editingSpecialties ?? []);
      setExperience(c.experienceLevel ?? "");
      setAvailable(c.availableForWork ?? false);
      setError(null);
    }
  }, [open, user]);

  const saveM = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      return data;
    },
    onSuccess: onSaved,
    onError: (e: Error) => setError(e.message),
  });

  const handleSave = () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setError(null);
    const validWorks = works.filter((w) => w.title.trim());
    const credentials = JSON.stringify({
      ...(credTitle.trim() ? { professionalTitle: credTitle.trim() } : {}),
      isPublishedAuthor: validWorks.length > 0,
      publishedWorks: validWorks.map((w) => ({
        title: w.title.trim(),
        ...(w.year.trim() ? { year: parseInt(w.year) } : {}),
        ...(w.publisher.trim() ? { publisher: w.publisher.trim() } : {}),
      })),
      ...(website.trim() ? { website: website.trim() } : {}),
      ...(linkedin.trim() ? { linkedin: linkedin.trim() } : {}),
      ...(patreon.trim() ? { patreon: patreon.trim() } : {}),
      ...(substack.trim() ? { substack: substack.trim() } : {}),
      ...(specialties.length > 0 ? { editingSpecialties: specialties } : {}),
      ...(experience ? { experienceLevel: experience } : {}),
      availableForWork: available,
    });
    saveM.mutate({
      name: name.trim(),
      mediaInterests: about,
      genres: JSON.stringify(genres),
      credentials,
    });
  };

  const addWork = () => setWorks((w) => [...w, { title: "", year: "", publisher: "" }]);
  const removeWork = (i: number) => setWorks((w) => w.filter((_, idx) => idx !== i));
  const updateWork = (i: number, field: keyof WorkEntry, val: string) =>
    setWorks((w) => w.map((x, idx) => idx === i ? { ...x, [field]: val } : x));

  const toggleGenre    = (g: string) => setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  const toggleSpecialty = (s: string) => setSpecialties((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const input = "w-full bg-white border border-[#1A1614]/20 focus:border-[#1A1614] outline-none px-3 py-2.5 text-sm text-[#1A1614] transition-colors";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 40 }}
            className="relative w-full max-w-xl bg-[#F9F6EE] border-l-2 border-[#1A1614] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-7 py-5 border-b-2 border-[#1A1614] flex items-center justify-between shrink-0 bg-[#1A1614]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] font-bold text-[#E8B84B] mb-0.5">Your profile</p>
                <h2 className="text-xl font-serif font-bold text-[#F9F6EE]">Edit Profile</h2>
              </div>
              <button onClick={onClose} className="text-[#F9F6EE]/60 hover:text-[#F9F6EE] transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-8">

              {/* ── Section: About You ── */}
              <section>
                <SectionHeader label="About You" />
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.16em] font-bold text-[#7A6B5E] mb-1.5">Display name <span className="text-red-500">*</span></label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.16em] font-bold text-[#7A6B5E] mb-1.5">About you</label>
                    <textarea
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      rows={3}
                      className={`${input} resize-none`}
                      placeholder="Tell authors about the stories you love, your passions, interests…"
                    />
                  </div>
                </div>
              </section>

              {/* ── Section: Genres ── */}
              <section>
                <SectionHeader label="Genre Interests" />
                <p className="text-xs text-[#7A6B5E] mb-3">Select all genres you work in or enjoy.</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_GENRES.map((g) => {
                    const active = genres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGenre(g)}
                        className={`px-2.5 py-1 text-[11px] font-semibold transition-all ${
                          active
                            ? `${GENRE_COLORS[g] ?? "bg-[#1A1614] text-[#F9F6EE]"} ring-1 ring-offset-1 ring-current/50`
                            : `${GENRE_COLORS[g] ?? "bg-[#1A1614]/5 text-[#7A6B5E]"} opacity-50 hover:opacity-100`
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ── Section: Credentials ── */}
              <section>
                <SectionHeader label="Credentials & Links" />
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.16em] font-bold text-[#7A6B5E] mb-1.5">Professional title</label>
                    <input type="text" value={credTitle} onChange={(e) => setCredTitle(e.target.value)} className={input} placeholder="e.g. Freelance Editor, Literary Agent…" />
                  </div>

                  {/* Published works */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#7A6B5E]">Published works</label>
                      <button type="button" onClick={addWork} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#E8B84B] hover:text-[#1A1614] transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                    {works.length === 0 ? (
                      <p className="text-xs text-[#7A6B5E]/60 italic">No works added yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {works.map((w, i) => (
                          <div key={i} className="bg-white border border-[#1A1614]/15 p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <input type="text" value={w.title} onChange={(e) => updateWork(i, "title", e.target.value)} className="flex-1 bg-[#F9F6EE] border border-[#1A1614]/15 px-2.5 py-1.5 text-xs text-[#1A1614] outline-none focus:border-[#1A1614]" placeholder="Title" />
                              <button type="button" onClick={() => removeWork(i)} className="text-[#7A6B5E] hover:text-red-500 transition-colors p-1 shrink-0">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <input type="number" value={w.year} onChange={(e) => updateWork(i, "year", e.target.value)} className="w-20 bg-[#F9F6EE] border border-[#1A1614]/15 px-2.5 py-1.5 text-xs text-[#1A1614] outline-none focus:border-[#1A1614]" placeholder="Year" />
                              <input type="text" value={w.publisher} onChange={(e) => updateWork(i, "publisher", e.target.value)} className="flex-1 bg-[#F9F6EE] border border-[#1A1614]/15 px-2.5 py-1.5 text-xs text-[#1A1614] outline-none focus:border-[#1A1614]" placeholder="Publisher (optional)" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Platform links */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.16em] font-bold text-[#7A6B5E] mb-2">Platform links</label>
                    <div className="space-y-2">
                      {[
                        { label: "Website",  value: website,  set: setWebsite,  placeholder: "https://yoursite.com" },
                        { label: "LinkedIn", value: linkedin, set: setLinkedin, placeholder: "https://linkedin.com/in/…" },
                        { label: "Patreon",  value: patreon,  set: setPatreon,  placeholder: "https://patreon.com/…" },
                        { label: "Substack", value: substack, set: setSubstack, placeholder: "https://yourname.substack.com" },
                      ].map(({ label, value, set, placeholder }) => (
                        <div key={label} className="flex items-center gap-2">
                          <span className="w-16 text-[10px] font-bold text-[#7A6B5E] shrink-0">{label}</span>
                          <input type="url" value={value} onChange={(e) => set(e.target.value)} className={input} placeholder={placeholder} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Section: Editing Profile (contributors only) ── */}
              {isContributor && (
                <section>
                  <SectionHeader label="Editing Profile" />
                  <div className="space-y-5">
                    {/* Specialties */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.16em] font-bold text-[#7A6B5E] mb-2">
                        Editing specialties <span className="font-normal normal-case tracking-normal text-[#7A6B5E]/60">select all that apply</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {EDITING_SPECIALTIES.map((s) => {
                          const active = specialties.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleSpecialty(s)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                                active
                                  ? "bg-[#1A1614] text-[#F9F6EE] border-[#1A1614]"
                                  : "bg-white border-[#1A1614]/20 text-[#7A6B5E] hover:border-[#1A1614] hover:text-[#1A1614]"
                              }`}
                            >
                              {active && <Check className="w-3 h-3" />}
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Experience level */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.16em] font-bold text-[#7A6B5E] mb-2">Experience level</label>
                      <div className="grid grid-cols-2 gap-2">
                        {EXPERIENCE_LEVELS.map((lvl) => (
                          <button
                            key={lvl.value}
                            type="button"
                            onClick={() => setExperience(experience === lvl.value ? "" : lvl.value)}
                            className={`px-3 py-2.5 text-left border-2 transition-all ${
                              experience === lvl.value
                                ? "border-[#1A1614] bg-[#1A1614] text-[#F9F6EE]"
                                : "border-[#1A1614]/15 bg-white text-[#7A6B5E] hover:border-[#1A1614]/40"
                            }`}
                          >
                            <p className="text-xs font-bold">{lvl.label}</p>
                            <p className="text-[11px] font-normal opacity-70 mt-0.5">{lvl.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Available for work */}
                    <label className="flex items-center justify-between gap-4 cursor-pointer bg-white border border-[#1A1614]/15 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-[#1A1614]">Available for new projects</p>
                        <p className="text-xs text-[#7A6B5E]">Shows authors you're open to collaboration requests</p>
                      </div>
                      <button type="button" onClick={() => setAvailable((v) => !v)}>
                        {available
                          ? <ToggleRight className="w-9 h-9 text-emerald-500" />
                          : <ToggleLeft className="w-9 h-9 text-[#7A6B5E]/40" />}
                      </button>
                    </label>
                  </div>
                </section>
              )}

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t-2 border-[#1A1614] flex items-center gap-3 shrink-0 bg-white">
              <button
                type="button"
                onClick={handleSave}
                disabled={saveM.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-[#E8B84B] hover:bg-[#d4a73d] text-[#1A1614] font-bold px-6 py-3 transition-colors disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saveM.isPending ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={saveM.isPending}
                className="px-5 py-3 border-2 border-[#1A1614]/20 text-[#7A6B5E] font-semibold hover:border-[#1A1614] hover:text-[#1A1614] transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="mb-4">
      <p className="text-[9px] uppercase tracking-[0.24em] font-bold text-[#7A6B5E] mb-1">{label}</p>
      <div className="border-t-2 border-[#1A1614]" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

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

  const { data: shortlist = [], refetch: refetchShortlist } = useQuery<BookmarkedContributor[]>({
    queryKey: ["/api/bookmarks", user?.id],
    enabled: !!user && isAuthor,
    queryFn: () => fetch(`/api/bookmarks?authorId=${user!.id}`).then((r) => r.json()),
  });

  const { data: inbox = [], refetch: refetchInbox } = useQuery<InboxMessage[]>({
    queryKey: ["/api/messages/inbox", user?.id],
    enabled: !!user && isContributor,
    queryFn: () => fetch(`/api/messages/inbox?userId=${user!.id}`).then((r) => r.json()),
  });

  type InkTransaction = { id: number; amount: number; label: string; projectTitle: string | null; createdAt: string };
  const { data: inkData } = useQuery<{ balance: number; transactions: InkTransaction[] }>({
    queryKey: ["/api/users", user?.id, "ink"],
    enabled: !!user,
    queryFn: () => fetch(`/api/users/${user!.id}/ink`).then((r) => r.json()),
  });

  const { data: referralData } = useQuery<{ code: string }>({
    queryKey: ["/api/users", user?.id, "referral-code"],
    enabled: !!user,
    queryFn: () => fetch(`/api/users/${user!.id}/referral-code`).then((r) => r.json()),
  });

  const [codeCopied, setCodeCopied] = useState(false);
  const copyCode = () => {
    if (!referralData?.code) return;
    navigator.clipboard.writeText(referralData.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const markRead = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/messages/${id}/read`, { method: "PATCH" }).then((r) => r.json()),
    onSuccess: () => refetchInbox(),
  });

  const removeBookmark = useMutation({
    mutationFn: (contributorId: number) =>
      fetch("/api/bookmarks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorId: user!.id, contributorId }),
      }),
    onSuccess: () => refetchShortlist(),
  });

  const [openToApproach, setOpenToApproach] = useState<boolean>(user?.openToApproach ?? false);
  const [profilePublic, setProfilePublic] = useState<boolean>((user as any)?.profilePublic ?? true);

  const profilePublicMutation = useMutation({
    mutationFn: (value: boolean) =>
      fetch(`/api/users/${user!.id}/profile-public`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePublic: value }),
      }).then((r) => r.json()),
    onSuccess: (updatedUser) => {
      setProfilePublic(updatedUser.profilePublic);
      updateUser(updatedUser);
    },
  });

  const openToApproachMutation = useMutation({
    mutationFn: (value: boolean) =>
      fetch(`/api/users/${user!.id}/open-to-approach`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openToApproach: value }),
      }).then((r) => r.json()),
    onSuccess: (updatedUser) => {
      setOpenToApproach(updatedUser.openToApproach);
      updateUser(updatedUser);
    },
  });

  const respondToInviteMutation = useMutation({
    mutationFn: ({ inviteId, status }: { inviteId: number; status: "accepted" | "declined" }) =>
      fetch(`/api/pitch-invites/${inviteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user!.id, status }),
      }).then((r) => r.json()),
    onSuccess: () => {},
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
  const creds      = parseCredentials(user.credentials);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-[#1A1614] p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6"
      >
        <UploadableAvatar
          userId={user.id}
          name={user.name}
          avatarUrl={user.avatarUrl}
          onUpload={(path) => updateUser({ ...user, avatarUrl: path })}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#1A1614]">{user.name}</h1>
              <p className="text-[#7A6B5E] mt-1">{user.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#1A1614] text-sm font-semibold text-[#1A1614] hover:bg-[#1A1614] hover:text-[#F9F6EE] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Profile
              </button>
              <button
                onClick={logout}
                className="md:hidden inline-flex items-center gap-2 px-4 py-2 border-2 border-[#1A1614]/30 text-sm font-semibold text-[#7A6B5E] hover:border-[#1A1614] hover:text-[#1A1614] transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

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
            const genreList = parseGenres(user.genres);
            return genreList.length > 0 ? (
              <div className="mt-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7A6B5E] mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Areas of interest
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {genreList.map((g) => (
                    <span key={g} className={`px-2.5 py-1 text-[11px] font-semibold ${GENRE_COLORS[g] ?? "bg-[#1A1614]/5 text-[#7A6B5E]"}`}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#7A6B5E] hover:text-[#E8B84B] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add your genre interests
              </button>
            );
          })()}

          {user.mediaInterests ? (
            <div className="mt-3 flex items-start gap-2 text-sm text-[#7A6B5E]">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#E8B84B]" />
              <p>{user.mediaInterests}</p>
            </div>
          ) : (
            <button
              onClick={() => setEditOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#7A6B5E] hover:text-[#E8B84B] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add a bio
            </button>
          )}

          {/* Credentials */}
          {(() => {
            const hasAnything = (creds.publishedWorks?.length ?? 0) > 0 || creds.professionalTitle ||
              creds.website || creds.linkedin || creds.patreon || creds.substack ||
              (creds.editingSpecialties?.length ?? 0) > 0 || creds.experienceLevel;
            if (!hasAnything) return (
              <button
                onClick={() => setEditOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#7A6B5E] hover:text-[#E8B84B] transition-colors"
              >
                <BadgeCheck className="w-3.5 h-3.5" /> Add credentials & links
              </button>
            );
            return (
              <div className="mt-4 pt-4 border-t border-[#1A1614]/10">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7A6B5E] mb-2.5 flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-[#E8B84B]" />
                  Credentials
                </p>
                {creds.professionalTitle && (
                  <p className="text-sm font-semibold text-[#1A1614] mb-2">{creds.professionalTitle}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-2">
                  {creds.experienceLevel && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7A6B5E] bg-[#F9F6EE] border border-[#1A1614]/10 px-2 py-0.5">
                      {EXPERIENCE_LABELS[creds.experienceLevel] ?? creds.experienceLevel}
                    </span>
                  )}
                  {creds.availableForWork && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                      Available for projects
                    </span>
                  )}
                </div>
                {(creds.editingSpecialties?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {creds.editingSpecialties!.map((s) => (
                      <span key={s} className="px-2 py-0.5 text-[10px] font-semibold bg-[#1A1614]/6 text-[#1A1614] border border-[#1A1614]/12 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
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

          {/* Public profile toggle */}
          <div className="mt-4 pt-4 border-t border-[#1A1614]/10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7A6B5E] mb-0.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Public profile
                </p>
                <p className="text-xs text-[#7A6B5E]">
                  {profilePublic
                    ? "Anyone with your profile link can view it — useful for sharing with employers or collaborators outside the platform."
                    : "Your profile is private. Only Writers Room members can see it."}
                </p>
              </div>
              <button
                onClick={() => profilePublicMutation.mutate(!profilePublic)}
                disabled={profilePublicMutation.isPending}
                className="flex items-center gap-1.5 shrink-0 transition-opacity disabled:opacity-50"
                aria-label="Toggle public profile"
              >
                {profilePublic
                  ? <ToggleRight className="w-9 h-9 text-emerald-500" />
                  : <ToggleLeft className="w-9 h-9 text-[#7A6B5E]/40" />}
              </button>
            </div>
          </div>

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

      {/* Ink Level */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white border-2 border-[#1A1614] p-6 mb-8"
      >
        <div className="flex items-start gap-6 flex-wrap">
          <div className="shrink-0">
            <InkBadge balance={inkData?.balance ?? 0} size="lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] uppercase tracking-[0.22em] font-bold text-[#7A6B5E] mb-2">Ink Level</p>
            <p className="text-xs text-[#7A6B5E] leading-relaxed mb-4 max-w-md">
              Ink is your reputational currency — earned through every contribution you make. It grows alongside your reputation and will be redeemable for subscription discounts, merchandise, and exclusive creative services.
            </p>
            {inkData && inkData.transactions.length > 0 ? (
              <div>
                <p className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-2">Recent activity</p>
                <div className="space-y-0">
                  {inkData.transactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-4 text-xs py-1.5 border-b border-[#1A1614]/6 last:border-0">
                      <span className="text-[#1A1614]">
                        {t.label}{t.projectTitle ? <span className="text-[#7A6B5E]"> — {t.projectTitle}</span> : ""}
                      </span>
                      <span className="font-bold text-[#E8B84B] shrink-0">+{t.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#7A6B5E] italic">No Ink earned yet — submit suggestions and collaborate to start building your balance.</p>
            )}

            {referralData?.code && (
              <div className="mt-5 pt-4 border-t border-[#1A1614]/10">
                <p className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-2">Your referral code</p>
                <p className="text-[11px] text-[#7A6B5E] mb-3">
                  Share this code when someone signs up — you earn <span className="font-semibold text-[#E8B84B]">+15 Ink</span> on signup and <span className="font-semibold text-[#E8B84B]">+50 Ink</span> if they upgrade to Pro.
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold tracking-[0.2em] text-sm text-[#1A1614] bg-[#E8B84B]/15 border border-[#E8B84B]/40 px-3 py-1.5 select-all">
                    {referralData.code}
                  </span>
                  <button
                    onClick={copyCode}
                    className="text-[10px] uppercase tracking-[0.15em] font-bold px-3 py-1.5 border border-[#1A1614]/20 text-[#7A6B5E] hover:border-[#E8B84B] hover:text-[#E8B84B] transition-colors"
                  >
                    {codeCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>
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
                            <div className="h-full bg-[#E8B84B]" style={{ width: `${c.acceptRate}%` }} />
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

      {/* Shortlist – authors only */}
      {isAuthor && (
        <div className="mb-10">
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2 flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-[#E8B84B] fill-current" /> Shortlist
            </p>
            <div className="border-t-2 border-[#1A1614] mb-2" />
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-2xl font-serif font-bold text-[#1A1614]">My Shortlisted Editors</h2>
              {shortlist.length > 0 && (
                <Link href="/contributors" className="text-xs font-bold uppercase tracking-[0.12em] text-[#E8B84B] hover:underline">
                  Find more →
                </Link>
              )}
            </div>
            <div className="border-t border-[#1A1614]/15 mt-3" />
          </div>
          {shortlist.length === 0 ? (
            <div className="bg-white border border-[#1A1614]/15 p-10 text-center">
              <Star className="w-10 h-10 text-[#7A6B5E] mx-auto mb-3 opacity-30" />
              <h3 className="text-base font-serif font-bold text-[#1A1614]">No editors saved yet</h3>
              <p className="text-sm text-[#7A6B5E] mt-1 max-w-xs mx-auto">
                Star an editor on the discovery page to add them to your shortlist.
              </p>
              <Link
                href="/contributors"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#E8B84B] hover:underline"
              >
                Browse editors →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shortlist.map((c) => {
                const genres: string[] = (() => { try { return JSON.parse(c.contributorGenres ?? "[]"); } catch { return []; } })();
                return (
                  <motion.div
                    key={c.bookmarkId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-[#1A1614]/15 p-4 hover:border-[#E8B84B] transition-colors flex gap-3"
                  >
                    <div className="w-10 h-10 bg-[#1A1614] flex items-center justify-center shrink-0 font-bold text-[#F9F6EE] font-serif">
                      {c.contributorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link href={`/profile/${c.contributorId}`} className="font-bold text-[#1A1614] text-sm hover:text-[#E8B84B] transition-colors">
                            {c.contributorName}
                          </Link>
                          {c.professionalTitle && (
                            <p className="text-xs text-[#7A6B5E]">{c.professionalTitle}</p>
                          )}
                          {c.availableForWork && (
                            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-700">Available</span>
                          )}
                        </div>
                        <button
                          onClick={() => removeBookmark.mutate(c.contributorId)}
                          title="Remove from shortlist"
                          className="text-[#7A6B5E]/40 hover:text-red-400 transition-colors p-0.5"
                        >
                          <BookmarkX className="w-4 h-4" />
                        </button>
                      </div>
                      {genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {genres.slice(0, 3).map((g) => (
                            <span key={g} className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#1A1614]/5 text-[#7A6B5E]">{g}</span>
                          ))}
                        </div>
                      )}
                      {c.editingSpecialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.editingSpecialties.slice(0, 2).map((s) => (
                            <span key={s} className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#1A1614]/6 text-[#1A1614] border border-[#1A1614]/12 rounded-full">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pitch Invitations – contributors only */}
      {isContributor && (
        <div className="mb-10">
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#E8B84B]" /> Incoming invites
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
                When authors invite you to collaborate on a pitch, it'll appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pitchInvites.map((inv, i) => {
                const genres = (() => { try { return JSON.parse(inv.pitchGenres ?? "[]") as string[]; } catch { return []; } })();
                return (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white border border-[#1A1614]/15 p-5"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <Link href={`/pitch/${inv.pitchId}`} className="font-bold text-[#1A1614] hover:text-[#E8B84B] transition-colors">
                          {inv.pitchTitle}
                        </Link>
                        <p className="text-xs text-[#7A6B5E] mt-0.5">from <span className="font-semibold">{inv.fromUserName}</span> · {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true })}</p>
                        {genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {genres.map((g) => <span key={g} className={`px-2 py-0.5 text-[10px] font-semibold ${GENRE_COLORS[g] ?? "bg-[#1A1614]/5 text-[#7A6B5E]"}`}>{g}</span>)}
                          </div>
                        )}
                        {inv.message && <p className="text-sm text-[#7A6B5E] mt-2 italic">"{inv.message}"</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {inv.status === "pending" ? (
                          <>
                            <button
                              onClick={() => respondToInviteMutation.mutate({ inviteId: inv.id, status: "accepted" })}
                              disabled={respondToInviteMutation.isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                            >
                              <CheckCheck className="w-3.5 h-3.5" /> Accept
                            </button>
                            <button
                              onClick={() => respondToInviteMutation.mutate({ inviteId: inv.id, status: "declined" })}
                              disabled={respondToInviteMutation.isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#1A1614]/20 text-[#7A6B5E] text-xs font-bold hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" /> Decline
                            </button>
                          </>
                        ) : (
                          <span className={`text-xs font-bold px-3 py-1.5 ${inv.status === "accepted" ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-red-600 bg-red-50 border border-red-200"}`}>
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

      {/* Inbox – contributors only */}
      {isContributor && (
        <div className="mb-10">
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-[#E8B84B]" /> Messages
              {inbox.filter((m) => !m.isRead).length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-[9px] font-bold bg-[#E8B84B] text-[#1A1614] rounded-full">
                  {inbox.filter((m) => !m.isRead).length}
                </span>
              )}
            </p>
            <div className="border-t-2 border-[#1A1614] mb-2" />
            <h2 className="text-2xl font-serif font-bold text-[#1A1614]">Messages from Authors</h2>
            <div className="border-t border-[#1A1614]/15 mt-3" />
          </div>
          {inbox.length === 0 ? (
            <div className="bg-white border border-[#1A1614]/15 p-10 text-center">
              <MessageSquare className="w-10 h-10 text-[#7A6B5E] mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-serif font-bold text-[#1A1614]">No messages yet</h3>
              <p className="text-sm text-[#7A6B5E] mt-1 max-w-xs mx-auto">
                When authors reach out through your profile, their messages will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {inbox.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-white border p-5 transition-colors ${msg.isRead ? "border-[#1A1614]/15" : "border-[#E8B84B]/60 bg-[#E8B84B]/5"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-[#1A1614]">{msg.fromName}</span>
                        {!msg.isRead && (
                          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#E8B84B] bg-[#E8B84B]/10 px-1.5 py-0.5 border border-[#E8B84B]/30">
                            New
                          </span>
                        )}
                        <span className="text-[10px] text-[#7A6B5E] ml-auto">{format(new Date(msg.createdAt), "MMM d, yyyy")}</span>
                      </div>
                      <p className="text-sm text-[#7A6B5E] leading-relaxed">{msg.body}</p>
                    </div>
                    {!msg.isRead && (
                      <button
                        onClick={() => markRead.mutate(msg.id)}
                        title="Mark as read"
                        className="shrink-0 p-1.5 text-[#7A6B5E] hover:text-[#1A1614] transition-colors"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
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
                        {conf.icon} {conf.label}
                      </span>
                      <span className="text-[10px] text-[#7A6B5E]">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="bg-[#F9F6EE] p-3 text-xs text-[#7A6B5E] border-l-2 border-[#E8B84B] mb-2">
                    <span className="line-through mr-2">{truncate(item.originalText)}</span>
                    <span className="text-[#1A1614] font-medium">→ {truncate(item.suggestedText)}</span>
                  </div>
                  {item.comment && (
                    <p className="text-xs text-[#7A6B5E] italic flex items-start gap-1.5">
                      <MessageSquareQuote className="w-3.5 h-3.5 shrink-0 mt-px" />
                      {truncate(item.comment, 120)}
                    </p>
                  )}
                  {item.ownerNote && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 mt-2 flex items-start gap-1.5">
                      <CheckCheck className="w-3.5 h-3.5 shrink-0 mt-px" />
                      {item.ownerNote}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Profile Drawer */}
      <EditProfileDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        onSaved={(updated) => {
          updateUser(updated);
          setEditOpen(false);
        }}
      />
    </div>
  );
}
