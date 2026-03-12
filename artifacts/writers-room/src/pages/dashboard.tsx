import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Plus, BookText, FileText, MessageSquareQuote, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateProject } from "@workspace/api-client-react";
import type { Project } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", user?.id],
    enabled: !!user,
    queryFn: () =>
      fetch(`/api/projects?userId=${user!.id}`).then((r) => r.json()),
  });

  const createProject = useCreateProject();
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"book" | "script">("book");
  const [newContent, setNewContent] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle || !newContent) return;

    await createProject.mutateAsync({
      data: {
        title: newTitle,
        type: newType,
        content: newContent,
        userId: user.id
      }
    });

    queryClient.invalidateQueries({ queryKey: ["/api/projects", user?.id] });
    setIsCreating(false);
    setNewTitle("");
    setNewContent("");
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground tracking-tight">Your Projects</h1>
          <p className="text-muted-foreground mt-2 text-lg">Continue where you left off, {user?.name.split(' ')[0]}.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} size="lg" className="rounded-full shadow-lg">
          <Plus className="w-5 h-5 mr-2" />
          New Project
        </Button>
      </header>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-10 bg-card rounded-3xl p-6 border border-border shadow-xl shadow-black/5"
        >
          <h2 className="text-2xl font-serif font-bold mb-6">Start a new draft</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="col-span-3">
                <input
                  type="text"
                  placeholder="Project Title"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border-2 border-input focus:border-primary outline-none text-lg font-medium"
                  required
                />
              </div>
              <div className="col-span-1">
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl bg-background border-2 border-input focus:border-primary outline-none text-lg"
                >
                  <option value="book">Book</option>
                  <option value="script">Script</option>
                </select>
              </div>
            </div>
            <div>
              <textarea
                placeholder="Start typing your manuscript..."
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                className="w-full px-4 py-4 rounded-xl bg-background border-2 border-input focus:border-primary outline-none font-serif min-h-[200px] resize-y"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? "Creating..." : "Save Project"}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {projects?.length === 0 && !isCreating ? (
        <div className="text-center py-20 px-4 bg-card rounded-3xl border border-border shadow-sm">
          <img 
            src={`${import.meta.env.BASE_URL}images/empty-desk.png`}
            alt="Empty desk"
            className="w-64 h-auto mx-auto mb-8 rounded-2xl opacity-90"
          />
          <h3 className="text-2xl font-serif font-semibold text-foreground">No projects yet</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Your workspace is completely clear. Start a new book or script to begin collaborating.
          </p>
          <Button onClick={() => setIsCreating(true)} className="mt-6 rounded-full">
            Start Writing
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={project.id}
            >
              <Link 
                href={`/project/${project.id}`}
                className="block h-full bg-card rounded-3xl p-6 border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-2xl bg-accent/50 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {project.type === 'book' ? <BookText className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>
                  {project.pendingSuggestionsCount > 0 && (
                    <div className="flex items-center gap-1.5 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                      <MessageSquareQuote className="w-3.5 h-3.5" />
                      {project.pendingSuggestionsCount} Pending
                    </div>
                  )}
                </div>
                
                <h3 className="text-2xl font-serif font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {project.title}
                </h3>
                
                <div className="mt-6 space-y-2 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-foreground">
                        {project.ownerName.charAt(0)}
                      </div>
                      {project.ownerName}
                    </span>
                    <span>{project.collaboratorsCount} {project.collaboratorsCount === 1 ? 'collab' : 'collabs'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    Updated {format(new Date(project.updatedAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
