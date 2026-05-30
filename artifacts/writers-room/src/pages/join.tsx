import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Users, BookOpen, Film, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type ProjectInfo = {
  id: number;
  title: string;
  type: "book" | "script";
  genres: string;
  synopsis: string | null;
  ownerName: string;
  ownerId: number;
  collaboratorCount: number;
  collaboratorLimit: number;
  isFull: boolean;
};

export default function JoinPage() {
  const [, params] = useRoute("/join/:token");
  const token = params?.token ?? "";
  const { user, openAuthModal } = useAuth();
  const [joined, setJoined] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);

  const { data: project, isLoading, isError } = useQuery<ProjectInfo>({
    queryKey: ["/api/join", token],
    enabled: !!token,
    queryFn: async () => {
      const r = await fetch(`/api/join/${token}`);
      if (!r.ok) throw new Error((await r.json()).error ?? "Not found");
      return r.json();
    },
    retry: false,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/join/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user!.id }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Failed to join");
      return r.json();
    },
    onSuccess: (data) => {
      if (data.alreadyMember) setAlreadyMember(true);
      else setJoined(true);
    },
  });

  const genres: string[] = (() => {
    try { return JSON.parse(project?.genres ?? "[]"); } catch { return []; }
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#E8B84B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="w-12 h-12 text-red-400 mb-4" />
        <h1 className="text-xl font-bold text-[#1A1614] mb-2">Invite link not found</h1>
        <p className="text-sm text-[#7A6B5E] mb-6">
          This link may have expired or been reset by the room owner.
          Ask them to share the latest link.
        </p>
        <Link href="/">
          <Button variant="outline" className="rounded-xl">Go to The Writers Room</Button>
        </Link>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />
        <h1 className="text-xl font-bold text-[#1A1614] mb-2">You're in!</h1>
        <p className="text-sm text-[#7A6B5E] mb-6">
          You've joined <span className="font-semibold text-[#1A1614]">{project.title}</span>. Welcome to the room.
        </p>
        <Link href={`/project/${project.id}`}>
          <Button className="rounded-xl bg-[#E8B84B] hover:bg-[#d4a53a] text-[#1A1614] font-semibold">
            Open project <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E8B84B]">The Writers Room</p>
          <p className="text-sm text-[#7A6B5E] mt-1">You've been invited to join a writing group</p>
        </div>

        {/* Project card */}
        <div className="bg-white rounded-2xl border border-[#E8B84B]/30 shadow-sm overflow-hidden mb-4">
          <div className="h-1.5 bg-gradient-to-r from-[#E8B84B] to-[#d4a53a]" />
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8B84B]/10 flex items-center justify-center shrink-0">
                {project.type === "script"
                  ? <Film className="w-5 h-5 text-[#E8B84B]" />
                  : <BookOpen className="w-5 h-5 text-[#E8B84B]" />}
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-[#1A1614] leading-tight">{project.title}</h1>
                <p className="text-sm text-[#7A6B5E]">by {project.ownerName}</p>
              </div>
            </div>

            {project.synopsis && (
              <p className="text-sm text-[#7A6B5E] italic line-clamp-3">"{project.synopsis}"</p>
            )}

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {genres.map(g => (
                  <span key={g} className="text-[10px] uppercase tracking-wider font-semibold bg-[#E8B84B]/10 text-[#7A6B5E] px-2 py-0.5 rounded-full">
                    {g}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-[#7A6B5E]">
              <Users className="w-3.5 h-3.5" />
              <span>{project.collaboratorCount} of {project.collaboratorLimit} seats filled</span>
            </div>
          </div>
        </div>

        {/* Action area */}
        {project.isFull ? (
          <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
            <p className="text-sm font-semibold text-red-700">This room is full</p>
            <p className="text-xs text-red-500 mt-1">Ask the owner to increase the room limit.</p>
          </div>
        ) : alreadyMember ? (
          <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
            <p className="text-sm font-semibold text-emerald-700">You're already a member</p>
            <Link href={`/project/${project.id}`}>
              <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                Open project <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        ) : user ? (
          user.id === project.ownerId ? (
            <div className="text-center p-4 bg-[#E8B84B]/10 rounded-xl border border-[#E8B84B]/30 space-y-2">
              <p className="text-sm font-semibold text-[#1A1614]">This is your project</p>
              <Link href={`/project/${project.id}`}>
                <Button size="sm" className="rounded-xl bg-[#E8B84B] hover:bg-[#d4a53a] text-[#1A1614] text-xs font-semibold">
                  Open project <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {joinMutation.isError && (
                <p className="text-xs text-red-600 text-center">{(joinMutation.error as Error).message}</p>
              )}
              <Button
                className="w-full rounded-xl bg-[#E8B84B] hover:bg-[#d4a53a] text-[#1A1614] font-semibold h-11"
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
              >
                {joinMutation.isPending ? "Joining…" : <>Join this Writers Room <ArrowRight className="w-4 h-4 ml-1.5" /></>}
              </Button>
              <p className="text-xs text-center text-[#7A6B5E]">Signed in as {user.name}</p>
            </div>
          )
        ) : (
          <div className="space-y-3 text-center">
            <p className="text-sm text-[#7A6B5E]">Create your free account to join this room.</p>
            <Button
              className="w-full rounded-xl bg-[#E8B84B] hover:bg-[#d4a53a] text-[#1A1614] font-semibold h-11"
              onClick={() => {
                sessionStorage.setItem("pendingJoinToken", token);
                openAuthModal();
              }}
            >
              Sign up &amp; join — it's free <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <p className="text-xs text-[#7A6B5E]">
              Already have an account?{" "}
              <button
                className="underline font-semibold text-[#1A1614]"
                onClick={() => {
                  sessionStorage.setItem("pendingJoinToken", token);
                  openAuthModal();
                }}
              >
                Sign in
              </button>{" "}
              to continue.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
