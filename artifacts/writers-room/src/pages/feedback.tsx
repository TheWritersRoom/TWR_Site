import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { MessageSquare, BookText, ChevronDown, ChevronUp, Search, Inbox, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type ReceivedFeedback = {
  id: number;
  content: string;
  createdAt: string;
  projectId: number;
  projectTitle: string;
  fromUserId: number;
  fromUserName: string;
};

type GivenFeedback = {
  id: number;
  content: string;
  createdAt: string;
  projectId: number;
  projectTitle: string;
  ownerName: string;
};

type FeedbackData = {
  received: ReceivedFeedback[];
  given: GivenFeedback[];
};

const PREVIEW_LEN = 200;

function FeedbackCard({ content, createdAt }: { content: string; createdAt: string }) {
  const [open, setOpen] = useState(false);
  const needsTruncate = content.length > PREVIEW_LEN;
  const display = open || !needsTruncate ? content : content.slice(0, PREVIEW_LEN).trimEnd() + "…";
  const ago = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  const exact = format(new Date(createdAt), "MMM d, yyyy 'at' h:mm a");

  return (
    <div>
      <p className="text-sm text-[#1A1614] leading-relaxed whitespace-pre-line">{display}</p>
      {needsTruncate && (
        <button
          onClick={() => setOpen(o => !o)}
          className="mt-1.5 flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] font-bold text-[#7A6B5E] hover:text-[#1A1614] transition-colors"
        >
          {open ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Read more</>}
        </button>
      )}
      <p className="text-[10px] text-[#7A6B5E] mt-2" title={exact}>{ago}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border-2 border-[#1A1614]/12 py-16 text-center">
      <MessageSquare className="w-8 h-8 text-[#1A1614]/20 mx-auto mb-3" />
      <p className="text-sm text-[#7A6B5E]">{message}</p>
    </div>
  );
}

export default function FeedbackPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"received" | "given">("received");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery<FeedbackData>({
    queryKey: ["/api/feedback/mine"],
    queryFn: async () => {
      const r = await fetch("/api/feedback/mine", { credentials: "include" });
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    },
    enabled: !!user,
  });

  const received = data?.received ?? [];
  const given = data?.given ?? [];

  const filteredReceived = received.filter(f => {
    const q = search.toLowerCase();
    return !q || f.fromUserName.toLowerCase().includes(q) || f.projectTitle.toLowerCase().includes(q) || f.content.toLowerCase().includes(q);
  });

  const filteredGiven = given.filter(f => {
    const q = search.toLowerCase();
    return !q || f.ownerName.toLowerCase().includes(q) || f.projectTitle.toLowerCase().includes(q) || f.content.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">Your Writing Room</p>
        <div className="border-t-2 border-[#1A1614] mb-3" />
        <h1 className="text-4xl font-serif font-bold text-[#1A1614]">Feedback</h1>
        <p className="text-[#7A6B5E] mt-1 text-sm">Feedback received on your projects and feedback you've given to others.</p>
        <div className="border-t border-[#1A1614]/15 mt-5" />
      </motion.div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6B5E]" />
        <input
          type="text"
          placeholder="Search by name, project, or content…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#1A1614]/20 focus:border-[#1A1614] text-sm outline-none text-[#1A1614]"
        />
      </div>

      {/* Tabs */}
      <div className="border-b-2 border-[#1A1614]/15 flex mb-6">
        {([
          { id: "received" as const, label: "Received", icon: Inbox,  count: received.length },
          { id: "given"    as const, label: "Given",    icon: Send,   count: given.length },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase tracking-[0.14em] font-bold border-b-2 -mb-[2px] transition-colors ${
              tab === t.id
                ? "border-[#E8B84B] text-[#1A1614]"
                : "border-transparent text-[#7A6B5E] hover:text-[#1A1614]"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            <span className="ml-0.5 px-1.5 py-0.5 text-[9px] bg-[#1A1614]/8 text-[#7A6B5E] font-bold">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#1A1614] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="border-2 border-red-200 bg-red-50 py-12 text-center">
          <p className="text-sm font-semibold text-red-700">Couldn't load feedback. Please refresh and try again.</p>
        </div>
      ) : tab === "received" ? (
        filteredReceived.length === 0 ? (
          <EmptyState message={search ? "No feedback matches your search." : "No feedback received yet. Publish a project and enable feedback to start collecting it."} />
        ) : (
          <div className="space-y-0 border-2 border-[#1A1614]/12">
            {filteredReceived.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="px-6 py-5 border-b border-[#1A1614]/8 last:border-0 hover:bg-[#F9F6EE] transition-colors"
              >
                {/* From + project */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#1A1614] flex items-center justify-center shrink-0">
                      <span className="font-bold text-[10px] text-[#F9F6EE]">{f.fromUserName.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="font-semibold text-sm text-[#1A1614]">{f.fromUserName}</span>
                  </div>
                  <span className="text-[#1A1614]/25 text-xs">on</span>
                  <Link href={`/project/${f.projectId}`}>
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] font-bold text-[#7A5A00] hover:text-[#1A1614] transition-colors cursor-pointer">
                      <BookText className="w-3 h-3" />{f.projectTitle}
                    </span>
                  </Link>
                </div>
                <FeedbackCard content={f.content} createdAt={f.createdAt} />
              </motion.div>
            ))}
          </div>
        )
      ) : (
        filteredGiven.length === 0 ? (
          <EmptyState message={search ? "No feedback matches your search." : "You haven't given feedback on any projects yet. Browse published works to get started."} />
        ) : (
          <div className="space-y-0 border-2 border-[#1A1614]/12">
            {filteredGiven.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="px-6 py-5 border-b border-[#1A1614]/8 last:border-0 hover:bg-[#F9F6EE] transition-colors"
              >
                {/* Project + owner */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Link href={`/project/${f.projectId}`}>
                    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] font-bold text-[#7A5A00] hover:text-[#1A1614] transition-colors cursor-pointer">
                      <BookText className="w-3 h-3" />{f.projectTitle}
                    </span>
                  </Link>
                  <span className="text-[#1A1614]/25 text-xs">by</span>
                  <span className="text-sm text-[#7A6B5E] font-medium">{f.ownerName}</span>
                </div>
                <FeedbackCard content={f.content} createdAt={f.createdAt} />
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* Footer count */}
      {!isLoading && !isError && (
        <p className="text-[10px] text-[#7A6B5E] tracking-[0.1em] mt-4">
          {tab === "received"
            ? `${filteredReceived.length} of ${received.length} received`
            : `${filteredGiven.length} of ${given.length} given`}
        </p>
      )}
    </div>
  );
}
