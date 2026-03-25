import { useState, useRef, useEffect } from "react";
import { useRoute } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Users, MessageSquare, Check, X, 
  Send, AlertCircle, Edit3, BarChart2, Trophy, Mail,
  BookOpen, Globe, Lock, Eye, MessageCircle, Minus, Plus,
  UserPlus, Clock, CheckCircle, XCircle, Film
} from "lucide-react";
import { useQuery, useMutation, useQueryClient as useQC } from "@tanstack/react-query";
import { PublishModal } from "@/components/publish-modal";
import { ScriptEditor } from "@/components/script-editor";
import { parseFountain } from "@/utils/fountain";
import { useAuth } from "@/hooks/use-auth";
import { 
  useGetProject, 
  useListSuggestions, 
  useListCollaborators,
  useCreateSuggestion,
  useUpdateSuggestionStatus,
  useInviteCollaborator,
  getGetProjectQueryKey,
  getListSuggestionsQueryKey,
  getListCollaboratorsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

function JoinRequestForm({ message, setMessage, open, setOpen, onSubmit, isPending, error, label }: {
  message: string; setMessage: (v: string) => void;
  open: boolean; setOpen: (v: boolean) => void;
  onSubmit: () => void; isPending: boolean; error?: string; label: string;
}) {
  return open ? (
    <div className="space-y-2">
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Optional: introduce yourself or explain why you'd like to join…"
        className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary min-h-[70px] resize-none"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" type="button" variant="ghost" className="flex-1 rounded-xl h-8 text-xs" onClick={() => setOpen(false)}>Cancel</Button>
        <Button size="sm" type="button" className="flex-1 rounded-xl h-8 text-xs" onClick={onSubmit} disabled={isPending}>
          {isPending ? "Sending…" : "Send"}
        </Button>
      </div>
    </div>
  ) : (
    <Button size="sm" type="button" className="w-full rounded-xl h-9 text-xs gap-1.5" onClick={() => setOpen(true)}>
      <UserPlus className="w-3.5 h-3.5" /> {label}
    </Button>
  );
}

export default function ProjectDetail() {
  const [, params] = useRoute("/project/:id");
  const projectId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"suggestions" | "collaborators" | "insights" | "feedback">("suggestions");
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [scriptEditorOpen, setScriptEditorOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  type FeedbackItem = {
    id: number;
    projectId: number;
    userId: number;
    userName: string;
    content: string;
    createdAt: string;
  };

  const { data: feedback = [], refetch: refetchFeedback } = useQuery<FeedbackItem[]>({
    queryKey: ["/api/projects", projectId, "feedback", user?.id],
    enabled: !!projectId && !!user,
    queryFn: () => fetch(`/api/projects/${projectId}/feedback?userId=${user!.id}`).then((r) => r.json()),
  });

  type ContributorStat = {
    submitterId: number;
    submitterName: string;
    submitterEmail: string;
    total: number;
    accepted: number;
    discarded: number;
    pending: number;
    acceptRate: number;
    firstAt: string;
    lastAt: string;
  };

  const { data: contributorStats = [] } = useQuery<ContributorStat[]>({
    queryKey: ["/api/projects", projectId, "contributor-stats"],
    enabled: !!projectId,
    queryFn: () => fetch(`/api/projects/${projectId}/contributor-stats`).then((r) => r.json()),
  });
  const [suggestionFilter, setSuggestionFilter] = useState<"pending" | "accepted" | "discarded">("pending");
  const [inviteEmail, setInviteEmail] = useState("");
  const [limitDraft, setLimitDraft] = useState<number | null>(null);
  const [isSavingLimit, setIsSavingLimit] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  const [joinMessageOpen, setJoinMessageOpen] = useState(false);

  const { data: project, isLoading: projectLoading } = useGetProject(projectId, {
    request: {} as RequestInit,
    query: { 
      queryKey: getGetProjectQueryKey(projectId),
      queryFn: () => fetch(`/api/projects/${projectId}?userId=${user?.id ?? ""}`).then(r => r.json()),
    }
  });
  const { data: suggestions } = useListSuggestions(projectId, { status: suggestionFilter });
  const { data: collaborators } = useListCollaborators(projectId);

  const createSuggestion = useCreateSuggestion();
  const updateSuggestion = useUpdateSuggestionStatus();
  const inviteCollab = useInviteCollaborator();

  const handleSaveLimit = async () => {
    if (limitDraft === null || !user) return;
    setIsSavingLimit(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, collaboratorLimit: limitDraft }),
      });
      queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      setLimitDraft(null);
    } finally {
      setIsSavingLimit(false);
    }
  };

  type JoinRequestRow = {
    id: number; userId: number; name: string; email: string;
    role: string; message: string; status: string; createdAt: string;
  };

  const isOwnerLoaded = !!(project && (project as any).ownerId === user?.id);

  const { data: joinRequests = [], refetch: refetchJoinRequests } = useQuery<JoinRequestRow[]>({
    queryKey: ["/api/projects", projectId, "join-requests", user?.id],
    enabled: isOwnerLoaded,
    queryFn: () => fetch(`/api/projects/${projectId}/join-requests?userId=${user!.id}`).then(r => r.json()),
  });

  const submitJoinRequest = useMutation({
    mutationFn: ({ message }: { message: string }) =>
      fetch(`/api/projects/${projectId}/join-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user!.id, message }),
      }).then(async r => { if (!r.ok) throw new Error((await r.json()).error); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      setJoinMessageOpen(false);
      setJoinMessage("");
    },
  });

  const respondJoinRequest = useMutation({
    mutationFn: ({ requestId, action }: { requestId: number; action: "accept" | "decline" }) =>
      fetch(`/api/projects/${projectId}/join-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user!.id, action }),
      }).then(async r => { if (!r.ok) throw new Error((await r.json()).error); return r.json(); }),
    onSuccess: () => {
      refetchJoinRequests();
      queryClient.invalidateQueries({ queryKey: getListCollaboratorsQueryKey(projectId) });
    },
  });

  const pendingJoinRequests = joinRequests.filter(r => r.status === "pending");

  // Selection state for creating new suggestion
  const [selection, setSelection] = useState<{ text: string; top: number; left: number } | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedText, setSuggestedText] = useState("");
  const [suggestionComment, setSuggestionComment] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      if (isSuggesting) return;
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 0 && contentRef.current?.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelection({
          text: sel.toString(),
          top: rect.top + window.scrollY - 40,
          left: rect.left + window.scrollX + (rect.width / 2) - 60
        });
      } else {
        setTimeout(() => setSelection(null), 150);
      }
    };
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [isSuggesting]);

  const handleCreateSuggestion = async () => {
    if (!user || !selection) return;
    await createSuggestion.mutateAsync({
      id: projectId,
      data: {
        originalText: selection.text,
        suggestedText,
        comment: suggestionComment,
        submitterId: user.id
      }
    });
    queryClient.invalidateQueries({ queryKey: getListSuggestionsQueryKey(projectId) });
    setIsSuggesting(false);
    setSelection(null);
    setSuggestedText("");
    setSuggestionComment("");
    setActiveTab("suggestions");
    setSuggestionFilter("pending");
  };

  const handleUpdateStatus = async (suggId: number, status: "accepted" | "discarded") => {
    if (!user) return;
    await updateSuggestion.mutateAsync({
      id: projectId,
      suggestionId: suggId,
      data: {
        status,
        userId: user.id
      }
    });
    queryClient.invalidateQueries({ queryKey: getListSuggestionsQueryKey(projectId) });
    queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteEmail) return;
    await inviteCollab.mutateAsync({
      id: projectId,
      data: { email: inviteEmail, ownerId: user.id }
    });
    setInviteEmail("");
    queryClient.invalidateQueries({ queryKey: getListCollaboratorsQueryKey(projectId) });
  };

  const handlePublish = async (opts: {
    publishVisibility: "all" | "matched" | "contributors";
    feedbackEnabled: boolean;
    feedbackAudience: "all" | "matched" | "contributors";
    feedbackVisibility: "public" | "private";
  }) => {
    if (!user) return;
    setPublishLoading(true);
    try {
      await fetch(`/api/projects/${projectId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, ...opts }),
      });
      queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      setPublishModalOpen(false);
    } finally {
      setPublishLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!user) return;
    setPublishLoading(true);
    try {
      await fetch(`/api/projects/${projectId}/unpublish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      setPublishModalOpen(false);
    } finally {
      setPublishLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !feedbackText.trim()) return;
    await fetch(`/api/projects/${projectId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, content: feedbackText.trim() }),
    });
    setFeedbackText("");
    refetchFeedback();
  };

  // Render content with highlights for pending suggestions
  const renderContent = () => {
    const isOwner = project?.role === "owner";
    const showSynopsisOnly = project?.contentMode === "synopsis" && !isOwner;

    if (showSynopsisOnly) {
      const synopsisText = project?.synopsis;
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#1A1614]/15">
            <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#7A6B5E] bg-[#F9F6EE] border border-[#1A1614]/15 px-2 py-1">Synopsis</span>
            <span className="text-xs text-[#7A6B5E]">The author has shared a synopsis. Full manuscript is private.</span>
          </div>
          {synopsisText ? (
            <div className="font-serif text-base leading-relaxed text-[#1A1614] whitespace-pre-wrap">{synopsisText}</div>
          ) : (
            <p className="text-[#7A6B5E] italic text-sm">No synopsis has been provided yet.</p>
          )}
        </div>
      );
    }

    if (!project?.content) return null;

    // Script projects: parse and render Fountain format
    if (project.type === "script") {
      const blocks = parseFountain(project.content);
      return (
        <div className="font-mono text-sm leading-relaxed space-y-0 max-w-[680px] mx-auto">
          {blocks.map((block, i) => {
            // Apply suggestion highlights
            let text = block.text;
            if (suggestions && suggestionFilter === "pending") {
              suggestions.forEach(sug => {
                if (sug.status === "pending") {
                  text = text.split(sug.originalText).join(
                    `<mark class="bg-yellow-200/40 border-b-2 border-yellow-400 text-inherit cursor-pointer rounded px-0.5 hover:bg-yellow-300/50" title="Suggestion by ${sug.submitterName}">${sug.originalText}</mark>`
                  );
                }
              });
            }
            const inner = <span dangerouslySetInnerHTML={{ __html: text || "\u00A0" }} />;

            switch (block.type) {
              case "scene-heading":
                return <div key={i} className="mt-6 mb-2 font-bold uppercase tracking-wide border-b border-border/40 pb-1 text-foreground">{inner}</div>;
              case "action":
                return <div key={i} className="my-3 text-foreground">{inner}</div>;
              case "character":
                return <div key={i} className="mt-5 mb-0 text-center uppercase font-semibold text-foreground">{inner}</div>;
              case "parenthetical":
                return <div key={i} className="my-0 text-center italic text-muted-foreground">{inner}</div>;
              case "dialogue":
                return <div key={i} className="my-1 mx-auto max-w-[380px] text-center text-foreground">{inner}</div>;
              case "transition":
                return <div key={i} className="mt-5 mb-2 text-right uppercase font-semibold text-muted-foreground">{inner}</div>;
              default:
                return <div key={i}>{inner}</div>;
            }
          })}
        </div>
      );
    }

    // Book projects: plain text with suggestion highlights
    let html = project.content;
    if (suggestions && suggestionFilter === "pending") {
      suggestions.forEach(sug => {
        if (sug.status === "pending") {
           const mark = `<mark class="bg-yellow-200/40 border-b-2 border-yellow-400 text-inherit cursor-pointer rounded px-0.5 transition-colors hover:bg-yellow-300/50" title="Suggestion by ${sug.submitterName}">${sug.originalText}</mark>`;
           html = html.split(sug.originalText).join(mark);
        }
      });
    }
    html = html.replace(/\n/g, "<br/>");
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const handleSaveScript = async (newContent: string) => {
    if (!user) return;
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, content: newContent }),
    });
    queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
  };

  if (projectLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) return <div className="p-10 text-center">Project not found</div>;

  const isOwner = project.ownerId === user?.id;

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF8F5]">
      {/* Main Editor Area */}
      <div className="flex-1 overflow-y-auto relative scroll-smooth">
        <header className="sticky top-0 z-10 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-full hover:bg-black/5 transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Link>
            <div>
              <h1 className="font-serif font-bold text-xl text-foreground">{project.title}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">{project.type} • By {project.ownerName}</p>
                {(() => {
                  let genres: string[] = [];
                  try { genres = JSON.parse(project.genres ?? "[]"); } catch {}
                  return genres.length > 0 ? genres.map((g) => (
                    <span key={g} className="text-[9px] uppercase tracking-[0.18em] font-bold px-2 py-0.5 border border-[#1A1614]/15 text-[#7A6B5E] bg-[#F9F6EE]">{g}</span>
                  )) : null;
                })()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {project.isPublished && (
               <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200">
                 <Globe className="w-3.5 h-3.5" /> Published
               </div>
             )}
             <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold border border-primary/20">
               {project.role}
             </div>
             {isOwner && project.type === "script" && (
               <button
                 onClick={() => setScriptEditorOpen(true)}
                 className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
               >
                 <Film className="w-4 h-4" />
                 Edit Script
               </button>
             )}
             {isOwner && (
               <button
                 onClick={() => setPublishModalOpen(true)}
                 className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors"
               >
                 <BookOpen className="w-4 h-4" />
                 {project.isPublished ? "Publishing" : "Publish"}
               </button>
             )}
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-8 py-16 lg:py-24">
          <div 
            ref={contentRef}
            className="manuscript outline-none"
          >
            {renderContent()}
          </div>
        </div>

        {/* Floating Suggestion Button */}
        <AnimatePresence>
          {selection && !isSuggesting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute z-50 shadow-xl"
              style={{ top: selection.top, left: selection.left }}
            >
              <Button 
                size="sm" 
                className="rounded-full shadow-lg bg-foreground text-background hover:bg-foreground/90 border border-white/20"
                onClick={() => {
                  setSuggestedText(selection.text);
                  setIsSuggesting(true);
                }}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Suggest Edit
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Sidebar - Tools */}
      <div className="w-96 border-l border-border bg-card flex flex-col shadow-2xl z-20">
        <div className="flex border-b border-border">
          <button 
            className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${activeTab === 'suggestions' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('suggestions')}
          >
            <MessageSquare className="w-4 h-4 mx-auto mb-1" />
            Suggestions
          </button>
          <button 
            className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors relative ${activeTab === 'collaborators' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('collaborators')}
          >
            <div className="relative inline-flex">
              <Users className="w-4 h-4 mb-1" />
              {pendingJoinRequests.length > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingJoinRequests.length}
                </span>
              )}
            </div>
            <br />Collaborators
          </button>
          {isOwner && (
            <button 
              className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${activeTab === 'insights' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('insights')}
            >
              <BarChart2 className="w-4 h-4 mx-auto mb-1" />
              Insights
            </button>
          )}
          {(isOwner || (project.isPublished && project.feedbackEnabled && (project.feedbackVisibility === "public" || isOwner || project.canGiveFeedback))) && (
            <button 
              className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${activeTab === 'feedback' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('feedback')}
            >
              <MessageCircle className="w-4 h-4 mx-auto mb-1" />
              Feedback
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-secondary/30 p-4">
          {/* New Suggestion Form */}
          <AnimatePresence>
            {isSuggesting && selection && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-card rounded-2xl p-4 shadow-lg border border-primary/30 mb-6 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
                <div className="flex justify-between items-center mb-3 mt-1">
                  <h3 className="font-bold text-sm text-foreground flex items-center">
                    <Edit3 className="w-4 h-4 mr-1.5 text-primary" />
                    New Suggestion
                  </h3>
                  <button onClick={() => { setIsSuggesting(false); setSelection(null); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Original</span>
                  <div className="bg-red-50 text-red-800 text-sm p-2 rounded-lg line-through decoration-red-300 border border-red-100">
                    {selection.text}
                  </div>
                </div>

                <div className="mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Suggestion</span>
                  <textarea
                    value={suggestedText}
                    onChange={(e) => setSuggestedText(e.target.value)}
                    className="w-full bg-green-50/50 text-green-900 border border-green-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 min-h-[80px]"
                    placeholder="Type your proposed text..."
                  />
                </div>

                <div className="mb-4">
                  <input
                    type="text"
                    value={suggestionComment}
                    onChange={(e) => setSuggestionComment(e.target.value)}
                    className="w-full bg-background border border-input rounded-lg p-2 text-sm focus:outline-none focus:border-primary"
                    placeholder="Add a comment (optional)"
                  />
                </div>

                <Button 
                  onClick={handleCreateSuggestion} 
                  className="w-full" 
                  disabled={createSuggestion.isPending || !suggestedText}
                >
                  {createSuggestion.isPending ? "Submitting..." : "Submit Suggestion"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <div className="flex gap-1 p-1 bg-background rounded-xl border border-border">
                {(['pending', 'accepted', 'discarded'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setSuggestionFilter(f)}
                    className={`flex-1 text-xs font-semibold py-1.5 rounded-lg capitalize transition-all ${suggestionFilter === f ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {!suggestions?.length && !isSuggesting && (
                <div className="text-center py-10 opacity-60">
                  <MessageSquare className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">No {suggestionFilter} suggestions.</p>
                  {suggestionFilter === 'pending' && <p className="text-xs mt-1">Select text in the document to suggest an edit.</p>}
                </div>
              )}

              {suggestions?.map((sug) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={sug.id} 
                  className={`bg-card rounded-2xl p-4 shadow-sm border transition-shadow hover:shadow-md ${sug.status === 'pending' ? 'border-yellow-200' : sug.status === 'accepted' ? 'border-green-200 opacity-70' : 'border-border opacity-60'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold">
                        {sug.submitterName.charAt(0)}
                      </div>
                      <span className="text-sm font-semibold">{sug.submitterName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{format(new Date(sug.createdAt), 'MMM d')}</span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="text-sm line-through text-red-500 bg-red-50/50 p-2 rounded border border-red-100/50 break-words">
                      {sug.originalText}
                    </div>
                    <div className="text-sm text-green-700 bg-green-50/50 p-2 rounded border border-green-100/50 break-words font-medium">
                      {sug.suggestedText}
                    </div>
                  </div>

                  {sug.comment && (
                    <div className="text-sm text-muted-foreground bg-secondary/50 p-2 rounded-lg italic border border-border/50 mb-3 flex gap-2 items-start">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      {sug.comment}
                    </div>
                  )}

                  {isOwner && sug.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-border mt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => handleUpdateStatus(sug.id, 'discarded')}
                        disabled={updateSuggestion.isPending}
                      >
                        <X className="w-4 h-4 mr-1" /> Discard
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleUpdateStatus(sug.id, 'accepted')}
                        disabled={updateSuggestion.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'collaborators' && (
            <div className="space-y-6">
              {/* Room size control (owner only) */}
              {isOwner && (() => {
                const currentLimit = (project as any).collaboratorLimit ?? 6;
                const filled = collaborators?.length ?? 0;
                const draft = limitDraft ?? currentLimit;
                return (
                  <div className="bg-card p-4 rounded-2xl border border-border shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">Room size</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {filled} of {currentLimit} seat{currentLimit === 1 ? "" : "s"} filled
                        </p>
                      </div>
                      {/* Fill bar */}
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(100, (filled / currentLimit) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setLimitDraft(Math.max(1, draft - 1))}
                        className="w-8 h-8 rounded-full border-2 border-input flex items-center justify-center hover:border-primary transition-colors disabled:opacity-40"
                        disabled={draft <= 1}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-lg font-bold tabular-nums">{draft}</span>
                      <button
                        type="button"
                        onClick={() => setLimitDraft(Math.min(50, draft + 1))}
                        className="w-8 h-8 rounded-full border-2 border-input flex items-center justify-center hover:border-primary transition-colors disabled:opacity-40"
                        disabled={draft >= 50}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      {limitDraft !== null && limitDraft !== currentLimit && (
                        <Button
                          size="sm"
                          className="ml-2 rounded-xl px-3 h-8 text-xs"
                          onClick={handleSaveLimit}
                          disabled={isSavingLimit}
                        >
                          {isSavingLimit ? "Saving…" : "Save"}
                        </Button>
                      )}
                      {limitDraft !== null && (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setLimitDraft(null)}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Pending join requests (owner only) */}
              {isOwner && pendingJoinRequests.length > 0 && (
                <div className="bg-card rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-b border-amber-200">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <h4 className="text-sm font-semibold text-amber-800">
                      Join Request{pendingJoinRequests.length > 1 ? "s" : ""} ({pendingJoinRequests.length})
                    </h4>
                  </div>
                  <div className="divide-y divide-border">
                    {pendingJoinRequests.map(req => (
                      <div key={req.id} className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {req.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{req.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{req.email}</p>
                          </div>
                          <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full shrink-0 capitalize">{req.role}</span>
                        </div>
                        {req.message && (
                          <p className="text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-2 italic">"{req.message}"</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs h-8"
                            onClick={() => respondJoinRequest.mutate({ requestId: req.id, action: "decline" })}
                            disabled={respondJoinRequest.isPending}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Decline
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-8"
                            onClick={() => respondJoinRequest.mutate({ requestId: req.id, action: "accept" })}
                            disabled={respondJoinRequest.isPending}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invite form */}
              {isOwner && (
                <form onSubmit={handleInvite} className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                  <h4 className="text-sm font-semibold mb-3">Invite Collaborator</h4>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="Email address"
                      className="flex-1 min-w-0 bg-background border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      required
                    />
                    <Button type="submit" size="sm" className="rounded-xl px-4 shrink-0" disabled={inviteCollab.isPending}>
                      {inviteCollab.isPending ? "..." : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">User must have logged into Writers Room previously.</p>
                </form>
              )}

              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Project Members</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {project.ownerName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{project.ownerName}</p>
                        <p className="text-xs text-muted-foreground">Owner</p>
                      </div>
                    </div>
                  </div>

                  {collaborators?.map(collab => (
                    <div key={collab.id} className="flex items-center justify-between bg-card p-3 rounded-xl border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-bold text-sm">
                          {collab.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{collab.name}</p>
                          <p className="text-xs text-muted-foreground">{collab.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Request to join (readers only) */}
              {!isOwner && (project as any).role === "reader" && (() => {
                const myReq = (project as any).myJoinRequest as { id: number; status: string } | null;
                if (myReq?.status === "accepted") return null;
                return (
                  <div className={`rounded-2xl border p-4 shadow-sm space-y-3 ${
                    myReq?.status === "pending" ? "bg-amber-50 border-amber-200" :
                    myReq?.status === "declined" ? "bg-card border-border" : "bg-card border-border"
                  }`}>
                    {myReq?.status === "pending" ? (
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-amber-800">Request pending</p>
                          <p className="text-xs text-amber-600 mt-0.5">The author will review your request.</p>
                        </div>
                      </div>
                    ) : myReq?.status === "declined" ? (
                      <>
                        <div className="flex items-center gap-3">
                          <XCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-sm font-semibold">Request declined</p>
                            <p className="text-xs text-muted-foreground mt-0.5">You can send another request below.</p>
                          </div>
                        </div>
                        <JoinRequestForm
                          message={joinMessage}
                          setMessage={setJoinMessage}
                          open={joinMessageOpen}
                          setOpen={setJoinMessageOpen}
                          onSubmit={() => submitJoinRequest.mutate({ message: joinMessage })}
                          isPending={submitJoinRequest.isPending}
                          error={submitJoinRequest.error?.message}
                          label="Send another request"
                        />
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-primary" />
                          <h4 className="text-sm font-semibold">Request to join</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Ask the author to add you as a collaborator on this project.
                        </p>
                        <JoinRequestForm
                          message={joinMessage}
                          setMessage={setJoinMessage}
                          open={joinMessageOpen}
                          setOpen={setJoinMessageOpen}
                          onSubmit={() => submitJoinRequest.mutate({ message: joinMessage })}
                          isPending={submitJoinRequest.isPending}
                          error={submitJoinRequest.error?.message}
                          label="Send request"
                        />
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'insights' && isOwner && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-bold text-foreground">Contributor Leaderboard</h4>
              </div>

              {contributorStats.length === 0 ? (
                <div className="text-center py-12 opacity-60">
                  <BarChart2 className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">No contributor data yet.</p>
                  <p className="text-xs mt-1">Stats appear once collaborators start submitting suggestions.</p>
                </div>
              ) : (
                contributorStats.map((c, i) => {
                  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                  return (
                    <motion.div
                      key={c.submitterId}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="bg-card rounded-2xl border border-border p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-bold text-sm shrink-0">
                          {c.submitterName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {medal && <span className="text-base leading-none">{medal}</span>}
                            <p className="text-sm font-bold text-foreground truncate">{c.submitterName}</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />{c.submitterEmail}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-foreground">{c.acceptRate}%</p>
                          <p className="text-[10px] text-muted-foreground">accept rate</p>
                        </div>
                      </div>

                      {/* Acceptance bar */}
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all"
                          style={{ width: `${c.acceptRate}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: "Total", value: c.total, color: "text-foreground" },
                          { label: "Accepted", value: c.accepted, color: "text-emerald-600" },
                          { label: "Pending", value: c.pending, color: "text-yellow-600" },
                        ].map((s) => (
                          <div key={s.label} className="bg-secondary/60 rounded-xl py-2">
                            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] text-muted-foreground">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      <p className="text-[10px] text-muted-foreground mt-2 text-right">
                        Last active {formatDistanceToNow(new Date(c.lastAt), { addSuffix: true })}
                      </p>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  {isOwner ? "Reader Feedback" : "Feedback"}
                </h4>
                {project.feedbackVisibility === "private" && isOwner && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" /> Private
                  </span>
                )}
              </div>

              {/* Submit feedback form (non-owners who can give feedback) */}
              {!isOwner && project.canGiveFeedback && (
                <form onSubmit={handleSubmitFeedback} className="bg-card p-4 rounded-2xl border border-border shadow-sm mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Share your thoughts</p>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Write your feedback…"
                    rows={3}
                    className="w-full bg-background border border-input rounded-xl p-3 text-sm focus:outline-none focus:border-primary resize-none mb-2"
                  />
                  <Button type="submit" size="sm" className="w-full" disabled={!feedbackText.trim()}>
                    <Send className="w-4 h-4 mr-2" /> Submit Feedback
                  </Button>
                </form>
              )}

              {/* No feedback state */}
              {feedback.length === 0 && (
                <div className="text-center py-10 opacity-60">
                  <MessageCircle className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">No feedback yet.</p>
                  {!isOwner && !project.canGiveFeedback && (
                    <p className="text-xs mt-1">You're not in the feedback audience for this work.</p>
                  )}
                </div>
              )}

              {/* Feedback list */}
              {feedback.map((fb, i) => (
                <motion.div
                  key={fb.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card rounded-2xl border border-border p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold">
                        {fb.userName.charAt(0)}
                      </div>
                      <span className="text-sm font-semibold">{fb.userName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(fb.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{fb.content}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Publish Modal */}
      {isOwner && project && (
        <PublishModal
          isOpen={publishModalOpen}
          onClose={() => setPublishModalOpen(false)}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          isPublished={project.isPublished}
          currentSettings={project.isPublished ? {
            publishVisibility: (project.publishVisibility ?? "all") as "all" | "matched" | "contributors",
            feedbackEnabled: project.feedbackEnabled ?? false,
            feedbackAudience: (project.feedbackAudience ?? "all") as "all" | "matched" | "contributors",
            feedbackVisibility: (project.feedbackVisibility ?? "public") as "public" | "private",
          } : undefined}
          loading={publishLoading}
        />
      )}

      {/* Script Editor Overlay */}
      <AnimatePresence>
        {scriptEditorOpen && project && isOwner && (
          <ScriptEditor
            key="script-editor"
            content={project.content ?? ""}
            projectTitle={project.title}
            onSave={handleSaveScript}
            onClose={() => setScriptEditorOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
