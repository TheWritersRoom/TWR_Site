import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, BookText, Shield, ShieldOff, Activity,
  UserPlus, Globe, MessageSquare, TrendingUp, ChevronDown,
  ChevronUp, Trash2, X, Check, BarChart2, PenTool, Star,
  AlertTriangle, RefreshCw, Zap, Mail, Send, ChevronRight, Database,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  bio: string | null;
  isAdmin: boolean;
  subscriptionTier: string;
  createdAt: string;
  projectCount: number;
  collaborationCount: number;
  suggestionCount: number;
  acceptedCount: number;
};

type Project = {
  id: number;
  title: string;
  type: string;
  ownerName: string | null;
  isPublished: boolean;
  avgRating: number | null;
  ratingCount: number;
  createdAt: string;
};

type Stats = {
  totalUsers: number;
  totalProjects: number;
  publishedProjects: number;
  totalSuggestions: number;
  acceptedSuggestions: number;
  totalCollaborations: number;
};

type ActivityEvent = {
  type: "user_joined" | "project_published" | "feedback_submitted";
  actorName: string;
  targetTitle?: string;
  timestamp: string;
};

type AdminFeedback = {
  id: number;
  content: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  userId: number;
  projectTitle: string;
  projectId: number;
};

// ── Design helpers ─────────────────────────────────────────────────────────

const TIER_BADGE: Record<string, string> = {
  pro:  "bg-violet-50 text-violet-700 border-violet-200",
  free: "bg-[#1A1614]/5 text-[#7A6B5E] border-[#1A1614]/15",
};

const EVENT_META = {
  user_joined:       { icon: <UserPlus className="w-3.5 h-3.5" />,      label: "Joined",    color: "text-emerald-700",  bg: "bg-emerald-50 border-emerald-200" },
  project_published: { icon: <Globe className="w-3.5 h-3.5" />,          label: "Published", color: "text-[#7A5A00]",   bg: "bg-[#E8B84B]/20 border-[#E8B84B]/40" },
  feedback_submitted:{ icon: <MessageSquare className="w-3.5 h-3.5" />,  label: "Feedback",  color: "text-[#8B2A50]",   bg: "bg-[#F7C5D5]/30 border-[#F7C5D5]/60" },
};

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent = false }: {
  label: string; value: number | null; sub?: string;
  icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={`border-2 px-5 py-4 flex items-start gap-4 ${accent ? "border-[#E8B84B] bg-[#E8B84B]/8" : "border-[#1A1614]/15"}`}>
      <div className={`w-9 h-9 flex items-center justify-center shrink-0 mt-0.5 ${accent ? "bg-[#E8B84B]/30 text-[#7A5A00]" : "bg-[#1A1614]/8 text-[#7A6B5E]"}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#7A6B5E]">{label}</p>
        {value === null
          ? <div className="w-12 h-7 bg-[#1A1614]/8 animate-pulse mt-1" />
          : <p className="text-3xl font-serif font-bold text-[#1A1614] tabular-nums leading-tight mt-0.5">{value.toLocaleString()}</p>
        }
        {sub && <p className="text-[10px] text-[#7A6B5E] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Delete confirmation modal ──────────────────────────────────────────────

function DeleteModal({ user, onConfirm, onCancel, isPending }: {
  user: AdminUser; onConfirm: () => void; onCancel: () => void; isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-[#F9F6EE] border-2 border-[#1A1614] p-8 max-w-md w-full mx-4 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 border-2 border-red-200 flex items-center justify-center text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#7A6B5E]">Irreversible action</p>
            <h3 className="font-serif font-bold text-xl text-[#1A1614]">Delete user</h3>
          </div>
        </div>
        <div className="border-t border-[#1A1614]/15 mb-4" />
        <p className="text-sm text-[#1A1614] mb-1">You are about to permanently delete:</p>
        <div className="bg-[#1A1614]/5 border border-[#1A1614]/15 px-4 py-3 mb-4">
          <p className="font-bold text-[#1A1614]">{user.name}</p>
          <p className="text-sm text-[#7A6B5E]">{user.email}</p>
        </div>
        <p className="text-sm text-[#7A6B5E] mb-6 leading-relaxed">
          This will remove their account, all their projects, and all associated data. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 rounded-none border-[#1A1614]/25" onClick={onCancel}>Cancel</Button>
          <Button
            className="flex-1 rounded-none bg-red-600 hover:bg-red-700 text-white border-0 gap-2"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete permanently
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── User row with expandable detail ───────────────────────────────────────

function UserRow({ u, isSelf, onToggleAdmin, onToggleTier, onDelete, togglePending, tierPending }: {
  u: AdminUser;
  isSelf: boolean;
  onToggleAdmin: () => void;
  onToggleTier: () => void;
  onDelete: () => void;
  togglePending: boolean;
  tierPending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const acceptRate = u.suggestionCount > 0
    ? Math.round((u.acceptedCount / u.suggestionCount) * 100)
    : null;

  return (
    <>
      <tr
        className={`border-b border-[#1A1614]/8 hover:bg-[#F9F6EE] cursor-pointer transition-colors ${expanded ? "bg-[#F9F6EE]" : ""}`}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Name + avatar */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#1A1614] flex items-center justify-center shrink-0">
              <span className="font-bold text-[11px] text-[#F9F6EE]">{u.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-[#1A1614] leading-tight">{u.name}</p>
              <p className="text-[11px] text-[#7A6B5E]">{u.email}</p>
            </div>
          </div>
        </td>

        {/* Tier */}
        <td className="py-3 px-4">
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] font-bold border ${TIER_BADGE[u.subscriptionTier] ?? TIER_BADGE.free}`}>
            {u.subscriptionTier === "pro" && <Zap className="w-2.5 h-2.5" />}
            {u.subscriptionTier}
          </span>
          {u.isAdmin && (
            <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em] font-bold border bg-[#E8B84B]/20 text-[#7A5A00] border-[#E8B84B]/40">
              <Shield className="w-2.5 h-2.5" />Admin
            </span>
          )}
        </td>

        {/* Stats */}
        <td className="py-3 px-4 text-center tabular-nums">
          <p className="text-sm font-bold text-[#1A1614]">{u.projectCount}</p>
          <p className="text-[10px] text-[#7A6B5E]">projects</p>
        </td>
        <td className="py-3 px-4 text-center tabular-nums">
          <p className="text-sm font-bold text-[#1A1614]">{u.suggestionCount}</p>
          {acceptRate !== null && <p className="text-[10px] text-[#7A6B5E]">{acceptRate}% accepted</p>}
        </td>
        <td className="py-3 px-4 text-[#7A6B5E] text-sm tabular-nums">
          {format(new Date(u.createdAt), "MMM d, yyyy")}
        </td>
        <td className="py-3 px-4">
          {expanded ? <ChevronUp className="w-4 h-4 text-[#7A6B5E]" /> : <ChevronDown className="w-4 h-4 text-[#7A6B5E]" />}
        </td>
      </tr>

      {/* Expanded detail row */}
      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={6} className="bg-[#F9F6EE] border-b-2 border-[#1A1614]/15 p-0">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 py-5 flex flex-wrap gap-6 items-start">
                  {/* Bio */}
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-1">Bio</p>
                    <p className="text-sm text-[#1A1614] leading-relaxed">
                      {u.bio || <span className="italic text-[#7A6B5E]">No bio provided.</span>}
                    </p>
                  </div>

                  {/* Mini stats */}
                  <div className="flex gap-4">
                    {[
                      { label: "Projects authored", value: u.projectCount, icon: BookText },
                      { label: "Collaborations", value: u.collaborationCount, icon: Users },
                      { label: "Suggestions", value: u.suggestionCount, icon: PenTool },
                      { label: "Accepted", value: u.acceptedCount, icon: Check },
                    ].map(s => (
                      <div key={s.label} className="border border-[#1A1614]/12 px-3 py-2.5 min-w-[80px] text-center">
                        <p className="text-xl font-serif font-bold text-[#1A1614] tabular-nums">{s.value}</p>
                        <p className="text-[9px] uppercase tracking-[0.1em] text-[#7A6B5E] mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 items-start flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSelf || togglePending}
                      onClick={e => { e.stopPropagation(); onToggleAdmin(); }}
                      className={`h-8 px-3 text-[10px] uppercase tracking-[0.1em] font-bold rounded-none border gap-1.5 ${
                        u.isAdmin
                          ? "border-[#1A1614]/20 text-[#7A6B5E] hover:bg-[#1A1614]/5"
                          : "border-[#E8B84B]/50 text-[#7A5A00] hover:bg-[#E8B84B]/10"
                      } disabled:opacity-40`}
                      title={isSelf ? "Cannot change your own admin status" : undefined}
                    >
                      {togglePending
                        ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        : u.isAdmin
                          ? <><ShieldOff className="w-3 h-3" />Revoke admin</>
                          : <><Shield className="w-3 h-3" />Grant admin</>
                      }
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={tierPending}
                      onClick={e => { e.stopPropagation(); onToggleTier(); }}
                      className={`h-8 px-3 text-[10px] uppercase tracking-[0.1em] font-bold rounded-none border gap-1.5 ${
                        u.subscriptionTier === "pro"
                          ? "border-violet-200 text-violet-600 hover:bg-violet-50"
                          : "border-violet-300 text-violet-700 hover:bg-violet-50"
                      } disabled:opacity-40`}
                    >
                      {tierPending
                        ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        : u.subscriptionTier === "pro"
                          ? <><Zap className="w-3 h-3" />Revoke pro</>
                          : <><Zap className="w-3 h-3" />Grant pro</>
                      }
                    </Button>
                    {!isSelf && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={e => { e.stopPropagation(); onDelete(); }}
                        className="h-8 px-3 text-[10px] uppercase tracking-[0.1em] font-bold rounded-none border border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                      >
                        <Trash2 className="w-3 h-3" />Delete
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Users tab ──────────────────────────────────────────────────────────────

function UsersTab() {
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [pendingAction, setPendingAction] = useState<{ id: number; name: string; grantAdmin: boolean } | null>(null);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { toast } = useToast();

  const { data: users = [], isLoading, refetch } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const r = await fetch("/api/admin/users", { credentials: "include" });
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    },
  });

  const toggleAdmin = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: number; isAdmin: boolean }) => {
      const r = await fetch(`/api/admin/users/${id}/admin`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error ?? `Request failed (${r.status})`); }
      return r.json() as Promise<AdminUser>;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<AdminUser[]>(["/api/admin/users"], prev =>
        prev ? prev.map(u => u.id === updated.id ? { ...u, ...updated } : u) : prev
      );
      toast({
        title: updated.isAdmin ? "Admin granted" : "Admin revoked",
        description: updated.isAdmin
          ? `${updated.name} now has admin privileges.`
          : `Admin privileges removed from ${updated.name}.`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to update admin status",
        description: "Couldn't update admin status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error ?? `Request failed (${r.status})`); }
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<AdminUser[]>(["/api/admin/users"], prev => prev?.filter(u => u.id !== id));
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
      setDeleteTarget(null);
    },
  });

  const setTier = useMutation({
    mutationFn: async ({ id, subscriptionTier }: { id: number; subscriptionTier: string }) => {
      const r = await fetch(`/api/admin/users/${id}/tier`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionTier }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error ?? `Request failed (${r.status})`); }
      return r.json() as Promise<{ id: number; name: string; subscriptionTier: string }>;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<AdminUser[]>(["/api/admin/users"], prev =>
        prev ? prev.map(u => u.id === updated.id ? { ...u, subscriptionTier: updated.subscriptionTier } : u) : prev
      );
      toast({
        title: updated.subscriptionTier === "pro" ? "Pro granted" : "Pro revoked",
        description: updated.subscriptionTier === "pro"
          ? `Account upgraded to pro.`
          : `Account returned to free tier.`,
      });
    },
    onError: () => {
      toast({ title: "Failed to update tier", variant: "destructive" });
    },
  });

  const filtered = users.filter(u => {
    const q = query.toLowerCase();
    const matchesQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesTier = tierFilter === "all" || u.subscriptionTier === tierFilter || (tierFilter === "admin" && u.isAdmin);
    return matchesQ && matchesTier;
  });

  const tiers = ["all", "free", "pro", "admin"];

  return (
    <div className="space-y-4">
      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onConfirm={() => deleteUser.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          isPending={deleteUser.isPending}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6B5E]" />
          <Input
            placeholder="Search by name or email…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9 border-2 border-[#1A1614]/20 focus-visible:border-[#1A1614] focus-visible:ring-0 rounded-none h-9 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {tiers.map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] font-bold border transition-colors ${
                tierFilter === t
                  ? "bg-[#1A1614] text-[#F9F6EE] border-[#1A1614]"
                  : "border-[#1A1614]/20 text-[#7A6B5E] hover:border-[#1A1614] hover:text-[#1A1614]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => refetch()} className="w-8 h-9 flex items-center justify-center border-2 border-[#1A1614]/20 hover:border-[#1A1614] text-[#7A6B5E] hover:text-[#1A1614] transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#1A1614] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="border-2 border-[#1A1614]/15 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-[#1A1614]/15 bg-[#F9F6EE]">
                {["User", "Tier", "Projects", "Suggestions", "Joined", ""].map(h => (
                  <th key={h} className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-[#7A6B5E] text-sm">
                    {query || tierFilter !== "all" ? "No users match your filters." : "No users yet."}
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                  <UserRow
                    key={u.id}
                    u={u}
                    isSelf={u.id === currentUser?.id}
                    onToggleAdmin={() => setPendingAction({ id: u.id, name: u.name, grantAdmin: !u.isAdmin })}
                    onToggleTier={() => setTier.mutate({ id: u.id, subscriptionTier: u.subscriptionTier === "pro" ? "free" : "pro" })}
                    onDelete={() => setDeleteTarget(u)}
                    togglePending={toggleAdmin.isPending && toggleAdmin.variables?.id === u.id}
                    tierPending={setTier.isPending && setTier.variables?.id === u.id}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-[#7A6B5E] tracking-[0.1em]">
        <span>{filtered.length} of {users.length} user{users.length !== 1 ? "s" : ""}</span>
        <span>{users.filter(u => u.isAdmin).length} admin{users.filter(u => u.isAdmin).length !== 1 ? "s" : ""}</span>
      </div>

      <AlertDialog open={!!pendingAction} onOpenChange={(open) => { if (!open) setPendingAction(null); }}>
        <AlertDialogContent className="rounded-none border-2 border-[#1A1614]/20 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl text-[#1A1614]">
              {pendingAction?.grantAdmin
                ? `Grant admin to ${pendingAction.name}?`
                : `Revoke admin from ${pendingAction?.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#7A6B5E] text-sm">
              {pendingAction?.grantAdmin
                ? `This will give ${pendingAction.name} full admin privileges on the platform.`
                : `This will remove admin privileges from ${pendingAction?.name}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              className="rounded-none border-2 border-[#1A1614]/20 text-[#7A6B5E] hover:bg-[#1A1614]/5 hover:text-[#1A1614] text-[11px] uppercase tracking-[0.1em] font-bold"
              onClick={() => setPendingAction(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={`rounded-none border-2 text-[11px] uppercase tracking-[0.1em] font-bold ${
                pendingAction?.grantAdmin
                  ? "bg-[#E8B84B]/20 border-[#E8B84B]/60 text-[#7A5A00] hover:bg-[#E8B84B]/40"
                  : "bg-[#1A1614]/5 border-[#1A1614]/20 text-[#1A1614] hover:bg-[#1A1614]/10"
              }`}
              onClick={() => {
                if (pendingAction) {
                  toggleAdmin.mutate({ id: pendingAction.id, isAdmin: pendingAction.grantAdmin });
                  setPendingAction(null);
                }
              }}
            >
              {pendingAction?.grantAdmin ? (
                <><Shield className="w-3 h-3 mr-1" />Grant</>
              ) : (
                <><ShieldOff className="w-3 h-3 mr-1" />Revoke</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Projects tab ───────────────────────────────────────────────────────────

function ProjectsTab() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects/search/admin"],
    queryFn: () => fetch("/api/projects/search").then(r => r.json()),
  });

  const filtered = projects.filter(p => {
    const q = query.toLowerCase();
    const matchesQ = !q || p.title.toLowerCase().includes(q) || (p.ownerName ?? "").toLowerCase().includes(q) || p.type.toLowerCase().includes(q);
    const matchesFilter = filter === "all" || (filter === "published" && p.isPublished) || (filter === "draft" && !p.isPublished);
    return matchesQ && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6B5E]" />
          <Input
            placeholder="Search by title, owner, or type…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9 border-2 border-[#1A1614]/20 focus-visible:border-[#1A1614] focus-visible:ring-0 rounded-none h-9 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "published", "draft"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] font-bold border transition-colors ${
                filter === f ? "bg-[#1A1614] text-[#F9F6EE] border-[#1A1614]" : "border-[#1A1614]/20 text-[#7A6B5E] hover:border-[#1A1614] hover:text-[#1A1614]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#1A1614] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="border-2 border-[#1A1614]/15 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-[#1A1614]/15 bg-[#F9F6EE]">
                {["Title", "Type", "Owner", "Status", "Rating", "Created"].map(h => (
                  <th key={h} className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-[#7A6B5E] text-sm">
                    {query || filter !== "all" ? "No projects match your filters." : "No projects yet."}
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="border-b border-[#1A1614]/8 hover:bg-[#F9F6EE] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#1A1614] text-sm max-w-[220px] truncate">{p.title}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] font-bold text-[#7A6B5E]">
                        <BookText className="w-3 h-3" />{p.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#7A6B5E] text-sm">{p.ownerName ?? "—"}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] font-bold border ${p.isPublished ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-[#1A1614]/5 text-[#7A6B5E] border-[#1A1614]/15"}`}>
                        {p.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#7A6B5E] text-sm tabular-nums">
                      {p.avgRating != null ? `${Number(p.avgRating).toFixed(1)} (${p.ratingCount})` : "—"}
                    </td>
                    <td className="py-3 px-4 text-[#7A6B5E] text-sm tabular-nums">
                      {format(new Date(p.createdAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[10px] text-[#7A6B5E] tracking-[0.1em]">
        {filtered.length} of {projects.length} project{projects.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ── Activity tab ───────────────────────────────────────────────────────────

function ActivityTab() {
  const { data: events = [], isLoading, isError, refetch, isFetching } = useQuery<ActivityEvent[]>({
    queryKey: ["/api/admin/activity"],
    queryFn: async () => {
      const r = await fetch("/api/admin/activity", { credentials: "include" });
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    },
    refetchInterval: 30_000,
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#1A1614] border-t-transparent rounded-full animate-spin" /></div>;

  if (isError) return (
    <div className="border-2 border-red-200 bg-red-50 py-12 text-center space-y-2">
      <p className="text-sm font-semibold text-red-700">Failed to load activity</p>
      <p className="text-xs text-red-500">Check your connection or try refreshing.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#7A6B5E]">Last {events.length} platform events. Auto-refreshes every 30 s.</p>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-xs font-semibold text-[#7A6B5E] hover:text-[#1A1614] transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />Refresh
        </button>
      </div>

      {events.length === 0 ? (
        <div className="border-2 border-[#1A1614]/15 py-16 text-center text-[#7A6B5E] text-sm">No activity yet.</div>
      ) : (
        <ol className="border-2 border-[#1A1614]/15 divide-y divide-[#1A1614]/8">
          {events.map((ev, i) => {
            const meta = EVENT_META[ev.type];
            const ago = formatDistanceToNow(new Date(ev.timestamp), { addSuffix: true });
            const exact = format(new Date(ev.timestamp), "MMM d, yyyy 'at' h:mm a");
            return (
              <li key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F9F6EE] transition-colors">
                <span className={`inline-flex items-center justify-center w-7 h-7 border flex-shrink-0 ${meta.bg} ${meta.color}`}>{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1A1614] leading-snug">
                    <span className="font-semibold">{ev.actorName}</span>
                    {ev.type === "user_joined" && <span className="text-[#7A6B5E]"> joined the platform</span>}
                    {ev.type === "project_published" && <><span className="text-[#7A6B5E]"> published </span><span className="font-semibold italic">{ev.targetTitle}</span></>}
                    {ev.type === "feedback_submitted" && <><span className="text-[#7A6B5E]"> submitted feedback on </span><span className="font-semibold italic">{ev.targetTitle}</span></>}
                  </p>
                  <p className="text-[10px] text-[#7A6B5E] mt-0.5" title={exact}>{ago}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] font-bold border flex-shrink-0 ${meta.bg} ${meta.color}`}>{meta.label}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────

// ── Email Test Tab ───────────────────────────────────────────────────────────

function EmailTab() {
  const { toast } = useToast();
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleReseed = async () => {
    setSeeding(true);
    try {
      const r = await fetch("/api/admin/seed-demo", {
        method: "POST",
        credentials: "include",
      });
      const data = await r.json() as { created?: boolean; message?: string; error?: string };
      if (!r.ok) throw new Error(data.error ?? "Seed failed");
      toast({ title: data.created ? "Demo data seeded" : "Already seeded", description: data.message });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Seed failed", description: message, variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const handleSend = async () => {
    if (!to.trim() || !to.includes("@")) {
      toast({ title: "Enter a valid email address", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const r = await fetch("/api/admin/email/test", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim() }),
      });
      const data = await r.json() as { ok?: boolean; message?: string; error?: string };
      if (!r.ok) throw new Error(data.error ?? "Failed to send");
      toast({ title: "Test email sent", description: data.message });
      setTo("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Send failed", description: message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-xl">
      <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-3">Email Integration</p>
      <div className="border-t-2 border-[#1A1614] mb-6" />
      <div className="border border-[#1A1614]/15 p-6 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-5 h-5 text-[#E8B84B]" />
          <h2 className="font-serif font-bold text-xl text-[#1A1614]">Smoke test</h2>
        </div>
        <p className="text-sm text-[#7A6B5E] mb-5 leading-relaxed">
          Send a test email to confirm Resend is correctly configured. Requires{" "}
          <code className="bg-[#1A1614]/6 px-1 py-0.5 rounded text-[#1A1614] text-xs font-mono">RESEND_API_KEY</code>{" "}
          to be set in project secrets.
        </p>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="recipient@example.com"
            value={to}
            onChange={e => setTo(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={sending} className="gap-2 shrink-0">
            <Send className="w-3.5 h-3.5" />
            {sending ? "Sending…" : "Send test"}
          </Button>
        </div>
      </div>

      <div className="border border-[#1A1614]/15 border-t-0 px-6 py-4 bg-[#FAF8F5]">
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-2">Setup checklist</p>
        <ol className="text-sm text-[#7A6B5E] space-y-1.5 list-decimal list-inside leading-relaxed">
          <li>Create a <strong className="text-[#1A1614]">Resend</strong> account at resend.com</li>
          <li>Verify your sending domain in the Resend dashboard</li>
          <li>Generate an API key and add it as <code className="bg-[#1A1614]/6 px-1 py-0.5 rounded text-xs font-mono">RESEND_API_KEY</code> in project secrets</li>
          <li>Update the <code className="bg-[#1A1614]/6 px-1 py-0.5 rounded text-xs font-mono">from</code> address in <code className="bg-[#1A1614]/6 px-1 py-0.5 rounded text-xs font-mono">lib/email.ts</code> to match your verified domain</li>
          <li>Use the smoke test above to confirm delivery</li>
        </ol>
      </div>

      <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-3 mt-8">Demo Data</p>
      <div className="border-t-2 border-[#1A1614] mb-6" />
      <div className="border border-[#1A1614]/15 p-6 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-[#E8B84B]" />
          <h2 className="font-serif font-bold text-xl text-[#1A1614]">Reseed demo users</h2>
        </div>
        <p className="text-sm text-[#7A6B5E] mb-5 leading-relaxed">
          Creates the six demo accounts (Eleanor, James, Priya, Tom, Saoirse, David) and
          the <em>Weight of Tides</em> project if they are missing. Safe to run multiple times — existing
          records are left untouched.
        </p>
        <div className="text-xs text-[#7A6B5E] bg-[#FAF8F5] border border-[#1A1614]/10 p-3 mb-5 font-mono space-y-0.5">
          <p>eleanor@demo.writersroom &nbsp;·&nbsp; Pro author / owner</p>
          <p>james / priya / tom / saoirse / david @demo.writersroom</p>
          <p className="pt-1 font-sans font-medium text-[#1A1614]">Password: demo1234</p>
        </div>
        <Button onClick={handleReseed} disabled={seeding} variant="outline"
          className="border-2 border-[#1A1614] text-[#1A1614] hover:bg-[#1A1614] hover:text-[#F9F6EE] gap-2">
          <RefreshCw className={`w-3.5 h-3.5 ${seeding ? "animate-spin" : ""}`} />
          {seeding ? "Seeding…" : "Reseed demo data"}
        </Button>
      </div>
    </div>
  );
}

// ── Feedback tab ────────────────────────────────────────────────────────────

function FeedbackTab() {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: items = [], isLoading, isError, refetch, isFetching } = useQuery<AdminFeedback[]>({
    queryKey: ["/api/admin/feedback"],
    queryFn: async () => {
      const r = await fetch("/api/admin/feedback", { credentials: "include" });
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    },
  });

  const filtered = items.filter(f => {
    const q = query.toLowerCase();
    return !q
      || f.userName.toLowerCase().includes(q)
      || f.userEmail.toLowerCase().includes(q)
      || f.projectTitle.toLowerCase().includes(q)
      || f.content.toLowerCase().includes(q);
  });

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-[#1A1614] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (isError) return (
    <div className="border-2 border-red-200 bg-red-50 py-12 text-center space-y-2">
      <p className="text-sm font-semibold text-red-700">Failed to load feedback</p>
      <p className="text-xs text-red-500">Check your connection or try refreshing.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6B5E]" />
          <Input
            placeholder="Search by reviewer, project, or content…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9 border-2 border-[#1A1614]/20 focus-visible:border-[#1A1614] focus-visible:ring-0 rounded-none h-9 text-sm"
          />
        </div>
        <button
          onClick={() => refetch()}
          className="w-8 h-9 flex items-center justify-center border-2 border-[#1A1614]/20 hover:border-[#1A1614] text-[#7A6B5E] hover:text-[#1A1614] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="border-2 border-[#1A1614]/15 py-16 text-center text-[#7A6B5E] text-sm">
          {query ? "No feedback matches your search." : "No feedback submitted yet."}
        </div>
      ) : (
        <div className="border-2 border-[#1A1614]/15 divide-y divide-[#1A1614]/8">
          {filtered.map(f => {
            const isOpen = expanded === f.id;
            const preview = f.content.length > 160 ? f.content.slice(0, 160).trimEnd() + "…" : f.content;
            const ago = formatDistanceToNow(new Date(f.createdAt), { addSuffix: true });
            const exact = format(new Date(f.createdAt), "MMM d, yyyy 'at' h:mm a");

            return (
              <div key={f.id} className="px-5 py-4 hover:bg-[#F9F6EE] transition-colors">
                {/* Row header */}
                <div
                  className="flex items-start gap-4 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : f.id)}
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-[#1A1614] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="font-bold text-[11px] text-[#F9F6EE]">{f.userName.charAt(0).toUpperCase()}</span>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                      <span className="font-semibold text-sm text-[#1A1614]">{f.userName}</span>
                      <span className="text-[11px] text-[#7A6B5E]">{f.userEmail}</span>
                      <span className="text-[#1A1614]/25 text-xs">·</span>
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] font-bold text-[#7A5A00]">
                        <BookText className="w-3 h-3" />
                        {f.projectTitle}
                      </span>
                    </div>
                    <p className="text-sm text-[#1A1614] leading-relaxed">
                      {isOpen ? f.content : preview}
                    </p>
                    {f.content.length > 160 && (
                      <button className="mt-1 flex items-center gap-0.5 text-[10px] uppercase tracking-[0.1em] font-bold text-[#7A6B5E] hover:text-[#1A1614] transition-colors">
                        {isOpen ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronRight className="w-3 h-3" />Read more</>}
                      </button>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="text-right shrink-0 pt-0.5">
                    <p className="text-[11px] text-[#7A6B5E]" title={exact}>{ago}</p>
                    <p className="text-[10px] text-[#1A1614]/30 mt-0.5 tabular-nums">{format(new Date(f.createdAt), "MMM d, yyyy")}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-[#7A6B5E] tracking-[0.1em]">
        {filtered.length} of {items.length} feedback entr{items.length !== 1 ? "ies" : "y"}
      </p>
    </div>
  );
}

const TABS = [
  { id: "users",    label: "Users",    icon: Users },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "projects", label: "Projects", icon: BookText },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
  { id: "email",    label: "Email",    icon: Mail },
] as const;

type TabId = typeof TABS[number]["id"];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("users");

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const r = await fetch("/api/admin/stats", { credentials: "include" });
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    },
    enabled: !!user?.isAdmin,
  });

  useEffect(() => {
    if (!user?.isAdmin) navigate("/");
  }, [user, navigate]);

  if (!user?.isAdmin) return null;

  const acceptRate = stats && stats.totalSuggestions > 0
    ? Math.round((stats.acceptedSuggestions / stats.totalSuggestions) * 100)
    : null;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">System Overview</p>
        <div className="border-t-2 border-[#1A1614] mb-3" />
        <h1 className="text-4xl font-serif font-bold text-[#1A1614]">Admin Dashboard</h1>
        <p className="text-[#7A6B5E] mt-1 text-sm">Full visibility and control over The Writers Room platform.</p>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 border-2 border-[#1A1614]/15 mt-6">
          {[
            { label: "Users",            value: stats?.totalUsers ?? null,           icon: Users,      accent: false },
            { label: "Projects",         value: stats?.totalProjects ?? null,         icon: BookText,   accent: false },
            { label: "Published",        value: stats?.publishedProjects ?? null,     icon: Globe,      accent: false },
            { label: "Suggestions",      value: stats?.totalSuggestions ?? null,      icon: PenTool,    accent: false },
            { label: "Accepted",         value: stats?.acceptedSuggestions ?? null,   icon: Check,      accent: true  },
            { label: "Collaborations",   value: stats?.totalCollaborations ?? null,   icon: Star,       accent: false },
          ].map((s, i) => (
            <div key={s.label} className={`px-5 py-4 border-r border-[#1A1614]/15 last:border-0 ${s.accent ? "bg-[#E8B84B]/8" : ""}`}>
              <p className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-1">{s.label}</p>
              {s.value === null
                ? <div className="w-10 h-7 bg-[#1A1614]/8 animate-pulse" />
                : <p className="text-2xl font-serif font-bold text-[#1A1614] tabular-nums">{s.value.toLocaleString()}</p>
              }
            </div>
          ))}
        </div>
        {acceptRate !== null && (
          <p className="text-[10px] text-[#7A6B5E] mt-2 tracking-[0.08em]">
            Platform acceptance rate: <span className="font-bold text-[#1A1614]">{acceptRate}%</span> of all suggestions have been accepted
          </p>
        )}

        <div className="border-t border-[#1A1614]/15 mt-6" />
      </header>

      {/* Tabs */}
      <div className="border-b-2 border-[#1A1614]/15 flex mb-8">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase tracking-[0.14em] font-bold border-b-2 -mb-[2px] transition-colors ${
              activeTab === tab.id
                ? "border-[#E8B84B] text-[#1A1614]"
                : "border-transparent text-[#7A6B5E] hover:text-[#1A1614]"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />{tab.label}
            {tab.id === "users" && stats && (
              <span className="ml-0.5 px-1.5 py-0.5 text-[9px] bg-[#1A1614]/8 text-[#7A6B5E] font-bold">{stats.totalUsers}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "users"    && <UsersTab />}
      {activeTab === "activity" && <ActivityTab />}
      {activeTab === "projects" && <ProjectsTab />}
      {activeTab === "feedback" && <FeedbackTab />}
      {activeTab === "email"    && <EmailTab />}
    </div>
  );
}
