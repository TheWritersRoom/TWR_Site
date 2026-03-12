import { useState, useRef, useEffect } from "react";
import { useRoute } from "wouter";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Users, MessageSquare, Check, X, 
  Send, AlertCircle, Edit3, Trash2
} from "lucide-react";
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

export default function ProjectDetail() {
  const [, params] = useRoute("/project/:id");
  const projectId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"suggestions" | "collaborators">("suggestions");
  const [suggestionFilter, setSuggestionFilter] = useState<"pending" | "accepted" | "discarded">("pending");
  const [inviteEmail, setInviteEmail] = useState("");

  const { data: project, isLoading: projectLoading } = useGetProject(projectId, {
    request: {} as RequestInit,
    query: { 
      queryFn: () => fetch(`/api/projects/${projectId}?userId=${user?.id ?? ""}`).then(r => r.json()),
    }
  });
  const { data: suggestions } = useListSuggestions(projectId, { status: suggestionFilter });
  const { data: collaborators } = useListCollaborators(projectId);

  const createSuggestion = useCreateSuggestion();
  const updateSuggestion = useUpdateSuggestionStatus();
  const inviteCollab = useInviteCollaborator();

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

  // Render content with highlights for pending suggestions
  const renderContent = () => {
    if (!project?.content) return null;
    let html = project.content;
    
    // Only highlight if we are viewing pending suggestions to avoid clutter
    if (suggestions && suggestionFilter === "pending") {
      suggestions.forEach(sug => {
        if (sug.status === "pending") {
           // Basic string replacement. In a real app, uses exact indices.
           const mark = `<mark class="bg-yellow-200/40 border-b-2 border-yellow-400 text-inherit cursor-pointer rounded px-0.5 transition-colors hover:bg-yellow-300/50" title="Suggestion by ${sug.submitterName}">${sug.originalText}</mark>`;
           html = html.split(sug.originalText).join(mark);
        }
      });
    }

    // Convert newlines to breaks for rendering plain text beautifully
    html = html.replace(/\n/g, '<br/>');

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
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
              <p className="text-xs text-muted-foreground uppercase tracking-widest">{project.type} • By {project.ownerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold border border-primary/20">
               {project.role}
             </div>
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
            className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'suggestions' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('suggestions')}
          >
            <MessageSquare className="w-4 h-4 mx-auto mb-1" />
            Suggestions
          </button>
          <button 
            className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'collaborators' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('collaborators')}
          >
            <Users className="w-4 h-4 mx-auto mb-1" />
            Collaborators
          </button>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
