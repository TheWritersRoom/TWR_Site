import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { Mail, MailOpen, User, Send } from "lucide-react";

type Message = {
  id: number;
  fromUserId: number;
  fromName: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

type ThreadMessage = Message & { toUserId: number };

export default function Inbox() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Message | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const threadEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages/inbox", user?.id],
    enabled: !!user?.id,
    queryFn: () => fetch(`/api/messages/inbox?userId=${user!.id}`).then((r) => r.json()),
  });

  const { data: thread = [] } = useQuery<ThreadMessage[]>({
    queryKey: ["/api/messages/conversation", user?.id, selected?.fromUserId],
    enabled: !!user?.id && !!selected,
    queryFn: () =>
      fetch(`/api/messages/conversation?userA=${user!.id}&userB=${selected!.fromUserId}`).then((r) => r.json()),
    refetchInterval: 10000,
  });

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const markRead = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/messages/${id}/read`, { method: "PATCH" }).then((r) => r.json()),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Message[]>(["/api/messages/inbox", user?.id], (prev) =>
        prev?.map((m) => (m.id === id ? { ...m, isRead: true } : m)) ?? []
      );
    },
  });

  const sendReply = useMutation({
    mutationFn: (body: string) =>
      fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId: user!.id, toUserId: selected!.fromUserId, body }),
      }).then((r) => r.json()),
    onSuccess: () => {
      setReplyBody("");
      queryClient.invalidateQueries({
        queryKey: ["/api/messages/conversation", user?.id, selected?.fromUserId],
      });
    },
  });

  const handleSelect = (msg: Message) => {
    setSelected(msg);
    setReplyBody("");
    if (!msg.isRead) markRead.mutate(msg.id);
  };

  const handleSendReply = () => {
    const trimmed = replyBody.trim();
    if (!trimmed || sendReply.isPending) return;
    sendReply.mutate(trimmed);
  };

  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <div className="min-h-screen bg-[#F9F6EE]">
      {/* Header */}
      <div className="border-b-2 border-[#1A1614] px-6 py-4 flex items-center gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.22em] font-bold text-[#7A6B5E]">Messages</p>
          <h1 className="font-serif font-bold text-2xl text-[#1A1614]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Inbox
          </h1>
        </div>
        {unread > 0 && (
          <span className="px-2 py-0.5 bg-[#E8B84B] text-[#1A1614] text-[10px] font-bold uppercase tracking-[0.1em]">
            {unread} new
          </span>
        )}
      </div>

      <div className="flex h-[calc(100vh-81px)]">
        {/* Message list */}
        <div className="w-full md:w-80 border-r-2 border-[#1A1614] overflow-y-auto shrink-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-5 h-5 border-2 border-[#1A1614] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : messages.length === 0 ? (
            <div className="p-10 text-center">
              <Mail className="w-8 h-8 text-[#7A6B5E]/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#7A6B5E]">No messages yet</p>
              <p className="text-xs text-[#7A6B5E]/60 mt-1">Messages from other writers will appear here.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isActive = selected?.id === msg.id;
              return (
                <button
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={`w-full text-left px-4 py-3.5 border-b border-[#1A1614]/10 transition-colors ${
                    isActive
                      ? "bg-[#E8B84B]/15 border-l-2 border-l-[#E8B84B]"
                      : "hover:bg-[#1A1614]/4"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#1A1614] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-[#F9F6EE]">
                        {msg.fromName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`text-xs font-bold truncate ${msg.isRead ? "text-[#7A6B5E]" : "text-[#1A1614]"}`}>
                          {msg.fromName}
                        </span>
                        <span className="text-[9px] text-[#7A6B5E]/60 shrink-0">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate leading-relaxed ${msg.isRead ? "text-[#7A6B5E]/70" : "text-[#1A1614]"}`}>
                        {msg.body}
                      </p>
                    </div>
                    {!msg.isRead && (
                      <div className="w-2 h-2 bg-[#E8B84B] rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Message detail / thread */}
        <div className="flex-1 hidden md:flex flex-col">
          {selected ? (
            <div className="flex flex-col h-full">
              {/* Sender bar */}
              <div className="border-b border-[#1A1614]/15 px-8 py-5 flex items-center gap-4 shrink-0">
                <div className="w-10 h-10 bg-[#1A1614] flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#F9F6EE]">
                    {selected.fromName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A1614]">{selected.fromName}</p>
                  <p className="text-[10px] text-[#7A6B5E]">
                    {thread.length} message{thread.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="ml-auto">
                  <Link
                    href={`/profile/${selected.fromUserId}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1614]/20 text-[10px] font-bold uppercase tracking-[0.1em] text-[#7A6B5E] hover:border-[#1A1614] hover:text-[#1A1614] transition-colors"
                  >
                    <User className="w-3 h-3" />
                    View profile
                  </Link>
                </div>
              </div>

              {/* Thread */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
                {thread.map((msg) => {
                  const isMine = msg.fromUserId === user?.id;
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`w-7 h-7 flex items-center justify-center shrink-0 mt-0.5 ${isMine ? "bg-[#E8B84B]" : "bg-[#1A1614]"}`}>
                        <span className={`text-[10px] font-bold ${isMine ? "text-[#1A1614]" : "text-[#F9F6EE]"}`}>
                          {msg.fromName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                        <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                          isMine
                            ? "bg-[#1A1614] text-[#F9F6EE]"
                            : "bg-white border border-[#1A1614]/10 text-[#1A1614]"
                        }`}>
                          {msg.body}
                        </div>
                        <p className="text-[9px] text-[#7A6B5E]/50">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={threadEndRef} />
              </div>

              {/* Reply composer */}
              <div className="border-t-2 border-[#1A1614]/10 px-8 py-4 shrink-0">
                <div className="flex gap-3 items-end">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSendReply();
                    }}
                    placeholder={`Reply to ${selected.fromName}…`}
                    rows={3}
                    className="flex-1 text-sm border border-[#1A1614]/20 bg-white px-3 py-2.5 resize-none focus:outline-none focus:border-[#E8B84B] text-[#1A1614] placeholder:text-[#7A6B5E]/50 leading-relaxed"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyBody.trim() || sendReply.isPending}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1A1614] text-[#F9F6EE] text-[11px] font-bold uppercase tracking-[0.12em] hover:bg-[#E8B84B] hover:text-[#1A1614] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    {sendReply.isPending
                      ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : <Send className="w-3.5 h-3.5" />}
                    Send
                  </button>
                </div>
                <p className="text-[9px] text-[#7A6B5E]/50 mt-1.5">⌘ Return to send</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MailOpen className="w-10 h-10 text-[#7A6B5E]/20 mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#7A6B5E]">Select a message to read it</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
