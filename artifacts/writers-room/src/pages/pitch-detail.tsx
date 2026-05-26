import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { SEO } from "@/components/seo";
import {
  Lightbulb, BookText, FileText, Shapes, ArrowLeft,
  MessageCircle, HandHeart, Trash2, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Send, Users, Search, Mail, CheckCircle2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type SuggestedCollaborator = {
  id: number;
  name: string;
  email: string;
  role: string;
  genres: string;
  bio: string | null;
  credentials: string | null;
  matchingGenres: string[];
  matchScore: number;
};

type PitchInvite = {
  id: number;
  toUserId: number;
  toUserName: string;
  message: string | null;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
};

type PitchResponse = {
  id: number;
  pitchId: number;
  userId: number;
  userName: string;
  userRole: string;
  type: "feedback" | "interest";
  message: string;
  createdAt: string;
};

type PitchDetail = {
  id: number;
  title: string;
  description: string;
  type: "book" | "script" | "other";
  genres: string;
  status: "open" | "closed";
  ownerId: number;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
  responses: PitchResponse[];
};

const TYPE_META = {
  book:   { label: "Book", icon: <BookText className="w-4 h-4" />, color: "bg-blue-100 text-blue-700" },
  script: { label: "Script", icon: <FileText className="w-4 h-4" />, color: "bg-violet-100 text-violet-700" },
  other:  { label: "Open format", icon: <Shapes className="w-4 h-4" />, color: "bg-muted text-muted-foreground" },
};

function ResponseForm({
  pitchId,
  defaultType,
  onClose,
}: {
  pitchId: number;
  defaultType: "feedback" | "interest";
  onClose: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [type, setType] = useState<"feedback" | "interest">(defaultType);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await fetch(`/api/pitches/${pitchId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, type, message }),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/pitches/${pitchId}`] });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-card border border-border rounded-2xl p-6 mb-6"
    >
      <div className="flex gap-3 mb-4">
        {(["feedback", "interest"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
              type === t ? "border-primary bg-primary/8 text-foreground" : "border-input text-muted-foreground hover:border-primary/30"
            }`}
          >
            {t === "feedback"
              ? <><MessageCircle className="w-4 h-4" /> Leave feedback</>
              : <><HandHeart className="w-4 h-4" /> Express interest</>}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={type === "feedback" ? 4 : 3}
          placeholder={
            type === "feedback"
              ? "Share your thoughts on this idea. What works? What could be developed further? Any suggestions?"
              : "Introduce yourself briefly and explain why this project excites you. What would you bring to it?"
          }
          className="w-full px-4 py-3 rounded-xl bg-background border-2 border-input focus:border-primary outline-none text-sm resize-none mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" disabled={submitting}>
            <Send className="w-3.5 h-3.5 mr-1.5" />
            {submitting ? "Sending…" : type === "feedback" ? "Send Feedback" : "Express Interest"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

function ResponseCard({
  response,
  isOwner,
  currentUserId,
  pitchId,
}: {
  response: PitchResponse;
  isOwner: boolean;
  currentUserId: number;
  pitchId: number;
}) {
  const queryClient = useQueryClient();
  const isMe = response.userId === currentUserId;

  const deleteMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/pitches/${pitchId}/responses/${response.id}?userId=${currentUserId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/pitches/${pitchId}`] }),
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-background rounded-xl border p-4 ${
        response.type === "interest" ? "border-rose-200" : "border-sky-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold shrink-0">
            {(response.userName ?? "?").charAt(0)}
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground">{response.userName}</span>
            {response.userRole && (
              <span className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                response.userRole === "author" ? "bg-blue-100 text-blue-700"
                : response.userRole === "contributor" ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
              }`}>
                {response.userRole === "both" ? "Author & Contributor" : response.userRole === "author" ? "Author" : "Contributor"}
              </span>
            )}
            <p className="text-xs text-muted-foreground">{format(new Date(response.createdAt), "d MMM yyyy, HH:mm")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            response.type === "interest"
              ? "bg-rose-100 text-rose-700"
              : "bg-sky-100 text-sky-700"
          }`}>
            {response.type === "interest" ? <HandHeart className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
            {response.type === "interest" ? "Interested" : "Feedback"}
          </span>
          {(isMe || isOwner) && (
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {response.message && (
        <p className="text-sm text-foreground leading-relaxed pl-9">{response.message}</p>
      )}
    </motion.div>
  );
}

export default function PitchDetail() {
  const [, params] = useRoute("/pitch/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const pitchId = parseInt(params?.id ?? "0", 10);

  const [respondMode, setRespondMode] = useState<"feedback" | "interest" | null>(null);
  const [showDesc, setShowDesc] = useState(true);
  const [showCollabSearch, setShowCollabSearch] = useState(false);
  const [inviteMessages, setInviteMessages] = useState<Record<number, string>>({});
  const [sentInvites, setSentInvites] = useState<Set<number>>(new Set());

  const { data: pitch, isLoading } = useQuery<PitchDetail>({
    queryKey: [`/api/pitches/${pitchId}`],
    enabled: !!pitchId && !!user,
    queryFn: () => fetch(`/api/pitches/${pitchId}`).then((r) => r.json()),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/pitches/${pitchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user!.id,
          status: pitch?.status === "open" ? "closed" : "open",
        }),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/pitches/${pitchId}`] }),
  });

  const deletePitchMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/pitches/${pitchId}?userId=${user!.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user!.id }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pitches"] });
      navigate("/pitches");
    },
  });

  const { data: suggestedCollabs = [], isLoading: collabsLoading } = useQuery<SuggestedCollaborator[]>({
    queryKey: [`/api/pitches/${pitchId}/suggested-collaborators`, user?.id],
    enabled: showCollabSearch && !!user,
    queryFn: () => fetch(`/api/pitches/${pitchId}/suggested-collaborators?userId=${user!.id}`).then((r) => r.json()),
  });

  const { data: sentInvitesList = [] } = useQuery<PitchInvite[]>({
    queryKey: [`/api/pitches/${pitchId}/invites`, user?.id],
    enabled: showCollabSearch && !!user,
    queryFn: () => fetch(`/api/pitches/${pitchId}/invites?userId=${user!.id}`).then((r) => r.json()),
  });

  const inviteMutation = useMutation({
    mutationFn: ({ toUserId, message }: { toUserId: number; message: string }) =>
      fetch(`/api/pitches/${pitchId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId: user!.id, toUserId, message }),
      }).then((r) => r.json()),
    onSuccess: (_, { toUserId }) => {
      setSentInvites((prev) => new Set(prev).add(toUserId));
      queryClient.invalidateQueries({ queryKey: [`/api/pitches/${pitchId}/invites`] });
      queryClient.invalidateQueries({ queryKey: [`/api/pitches/${pitchId}/suggested-collaborators`] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!pitch) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Pitch not found.{" "}
        <Link href="/pitches" className="text-primary hover:underline">Back to Pitches</Link>
      </div>
    );
  }

  const isOwner = user?.id === pitch.ownerId;
  const tm = TYPE_META[pitch.type] ?? TYPE_META.other;
  let genres: string[] = [];
  try { genres = JSON.parse(pitch.genres); } catch {}

  const interested = pitch.responses.filter((r) => r.type === "interest");
  const feedbackItems = pitch.responses.filter((r) => r.type === "feedback");

  const hasResponded = pitch.responses.some((r) => r.userId === user?.id);

  const pitchDesc = pitch.description.length > 155
    ? pitch.description.slice(0, 152) + "..."
    : pitch.description;

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <SEO
        title={pitch.title}
        description={pitchDesc}
      />
      {/* Back */}
      <Link href="/pitches" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> All Pitches
      </Link>

      {/* Title block */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight">{pitch.title}</h1>
          <div className="flex gap-1.5 shrink-0 pt-1">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${tm.color}`}>
              {tm.icon} {tm.label}
            </span>
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
              pitch.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
            }`}>
              {pitch.status === "open" ? "Open" : "Closed"}
            </span>
          </div>
        </div>

        {/* Author */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-sm font-bold">
            {(pitch.ownerName ?? "?").charAt(0)}
          </div>
          <span className="text-sm text-muted-foreground">
            Pitched by <span className="font-semibold text-foreground">{pitch.ownerName}</span>
            {" · "}{format(new Date(pitch.createdAt), "d MMM yyyy")}
          </span>
        </div>

        {/* Genre tags */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {genres.map((g) => (
              <span key={g} className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{g}</span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <HandHeart className="w-4 h-4 text-rose-400" />
            <strong className="text-foreground">{interested.length}</strong> interested
          </span>
          <span className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-sky-400" />
            <strong className="text-foreground">{feedbackItems.length}</strong> feedback
          </span>
        </div>
      </motion.div>

      {/* Description */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <button
          onClick={() => setShowDesc((v) => !v)}
          className="flex items-center justify-between w-full text-left mb-2"
        >
          <h2 className="font-serif font-bold text-foreground">The Idea</h2>
          {showDesc ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {showDesc && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-foreground leading-relaxed whitespace-pre-wrap overflow-hidden"
            >
              {pitch.description}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Owner actions */}
      {isOwner && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleStatusMutation.mutate()}
              disabled={toggleStatusMutation.isPending}
            >
              {pitch.status === "open"
                ? <><XCircle className="w-3.5 h-3.5 mr-1.5" /> Close pitch</>
                : <><CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Reopen pitch</>}
            </Button>
            <Button
              size="sm"
              variant={showCollabSearch ? "default" : "outline"}
              onClick={() => setShowCollabSearch((v) => !v)}
              className={showCollabSearch ? "" : "border-[#E8B84B] text-[#1A1614] hover:bg-[#E8B84B]/10"}
            >
              <Users className="w-3.5 h-3.5 mr-1.5" /> Find Collaborators
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
              onClick={() => {
                if (confirm("Delete this pitch and all its responses?")) deletePitchMutation.mutate();
              }}
              disabled={deletePitchMutation.isPending}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete pitch
            </Button>
          </div>

          {/* Find Collaborators Panel */}
          <AnimatePresence>
            {showCollabSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-card border-2 border-[#E8B84B]/40 rounded-2xl p-6 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="w-4 h-4 text-[#E8B84B]" />
                    <h3 className="font-serif font-bold text-foreground">Find Collaborators</h3>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Contributors open to direct approach, matched by genre
                    </span>
                  </div>

                  {collabsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                  ) : suggestedCollabs.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                      <p className="text-sm text-muted-foreground">No matching contributors found.</p>
                      <p className="text-xs text-muted-foreground mt-1">Contributors must opt in to being approached on their profile page.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {suggestedCollabs.map((c) => {
                        const alreadySent = sentInvites.has(c.id) ||
                          sentInvitesList.some((inv) => inv.toUserId === c.id);
                        return (
                          <div key={c.id} className="bg-background rounded-xl border border-border p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-sm font-bold shrink-0">
                                {c.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground text-sm">{c.name}</p>
                                {c.bio && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.bio}</p>}
                                {c.matchingGenres.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {c.matchingGenres.map((g) => (
                                      <span key={g} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E8B84B]/15 text-[#7A5C00]">{g}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {alreadySent ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold shrink-0 mt-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Invited
                                </span>
                              ) : (
                                <div className="flex flex-col gap-1.5 items-end shrink-0 min-w-[140px]">
                                  <input
                                    type="text"
                                    placeholder="Optional message…"
                                    value={inviteMessages[c.id] ?? ""}
                                    onChange={(e) => setInviteMessages((prev) => ({ ...prev, [c.id]: e.target.value }))}
                                    className="text-xs px-2.5 py-1.5 border border-input rounded-lg bg-background w-full outline-none focus:border-primary"
                                  />
                                  <button
                                    onClick={() => inviteMutation.mutate({ toUserId: c.id, message: inviteMessages[c.id] ?? "" })}
                                    disabled={inviteMutation.isPending}
                                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#1A1614] text-[#F9F6EE] rounded-lg hover:bg-[#1A1614]/80 transition-colors w-full justify-center"
                                  >
                                    <Mail className="w-3 h-3" /> Send Invite
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Already-sent invites summary */}
                  {sentInvitesList.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Invites sent ({sentInvitesList.length})
                      </p>
                      <div className="space-y-1.5">
                        {sentInvitesList.map((inv) => (
                          <div key={inv.id} className="flex items-center justify-between text-xs">
                            <span className="text-foreground font-medium">{inv.toUserName}</span>
                            <span className={`font-semibold ${inv.status === "accepted" ? "text-emerald-600" : inv.status === "declined" ? "text-red-500" : "text-amber-600"}`}>
                              {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Respond CTAs (non-owners, open pitches) */}
      {!isOwner && pitch.status === "open" && !hasResponded && (
        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => setRespondMode(respondMode === "interest" ? null : "interest")}
            variant={respondMode === "interest" ? "default" : "outline"}
          >
            <HandHeart className="w-4 h-4 mr-2" /> I'm interested in collaborating
          </Button>
          <Button
            variant={respondMode === "feedback" ? "default" : "outline"}
            onClick={() => setRespondMode(respondMode === "feedback" ? null : "feedback")}
          >
            <MessageCircle className="w-4 h-4 mr-2" /> Leave feedback
          </Button>
        </div>
      )}

      {!isOwner && hasResponded && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 bg-card border border-border rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          You've already responded to this pitch. Delete your response below to submit a new one.
        </div>
      )}

      {!isOwner && pitch.status === "closed" && (
        <div className="text-sm text-muted-foreground bg-muted/40 rounded-xl px-4 py-3 mb-6">
          This pitch is closed. The author is no longer accepting responses.
        </div>
      )}

      {/* Response form */}
      <AnimatePresence>
        {respondMode && (
          <ResponseForm
            pitchId={pitchId}
            defaultType={respondMode}
            onClose={() => setRespondMode(null)}
          />
        )}
      </AnimatePresence>

      {/* Responses */}
      {pitch.responses.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-serif font-bold text-foreground text-lg">
            Responses <span className="text-muted-foreground font-normal text-base">({pitch.responses.length})</span>
          </h2>

          {/* Interested section */}
          {interested.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HandHeart className="w-3.5 h-3.5" /> Interested collaborators ({interested.length})
              </p>
              <div className="space-y-3">
                {interested.map((r) => (
                  <ResponseCard
                    key={r.id}
                    response={r}
                    isOwner={isOwner}
                    currentUserId={user!.id}
                    pitchId={pitchId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Feedback section */}
          {feedbackItems.length > 0 && (
            <div className={interested.length > 0 ? "mt-6" : ""}>
              <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" /> Feedback ({feedbackItems.length})
              </p>
              <div className="space-y-3">
                {feedbackItems.map((r) => (
                  <ResponseCard
                    key={r.id}
                    response={r}
                    isOwner={isOwner}
                    currentUserId={user!.id}
                    pitchId={pitchId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {pitch.responses.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <Lightbulb className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">No responses yet. Be the first to weigh in.</p>
        </div>
      )}
    </div>
  );
}
