import { useState, useCallback } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  ChevronLeft, Plus, LayoutGrid, List, Search, Filter,
  GripVertical, MoreHorizontal, Circle, Clock, AlertCircle, CheckCircle2,
  Film, BookOpen, X, Save, Pencil, Tag, Users, FileText, Lightbulb,
  StickyNote, BarChart2, Loader2, Trash2,
} from "lucide-react";

type CardStatus = "draft" | "outline" | "writing" | "complete";

type PlannerCard = {
  id: number;
  plannerId: number;
  position: number;
  episodeNumber: string | null;
  title: string;
  logline: string | null;
  synopsis: string | null;
  theme: string | null;
  characterArc: string | null;
  characters: string;
  tags: string;
  status: CardStatus;
  wordCount: number;
  targetWordCount: number | null;
  assignee: string | null;
  dueDate: string | null;
  notes: string | null;
};

type Planner = {
  id: number;
  ownerId: number;
  title: string;
  mediaType: "tv" | "book" | "serial" | "other";
  cards: PlannerCard[];
};

const STATUS: Record<CardStatus, { label: string; color: string; icon: any }> = {
  draft:    { label: "Draft",     color: "bg-[#7A6B5E]/12 text-[#7A6B5E]",   icon: Circle },
  outline:  { label: "Outlined",  color: "bg-blue-50 text-blue-700",          icon: Clock },
  writing:  { label: "Writing",   color: "bg-amber-50 text-amber-700",        icon: AlertCircle },
  complete: { label: "Complete",  color: "bg-green-50 text-green-700",        icon: CheckCircle2 },
};

const STATUS_LIST: CardStatus[] = ["draft", "outline", "writing", "complete"];

const MediaIcon = ({ type }: { type: string }) =>
  type === "book" ? <BookOpen className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />;

function parseArr(json: string): string[] {
  try { return JSON.parse(json) || []; } catch { return []; }
}

// ── Card Grid ────────────────────────────────────────────────────────────────

function CardGrid({
  planner,
  search,
  onCardClick,
  onAddCard,
  isAddingCard,
}: {
  planner: Planner;
  search: string;
  onCardClick: (card: PlannerCard) => void;
  onAddCard: () => void;
  isAddingCard: boolean;
}) {
  const filtered = planner.cards.filter(
    (c) =>
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.logline ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const complete = planner.cards.filter((c) => c.status === "complete").length;
  const totalWords = planner.cards.reduce((s, c) => s + c.wordCount, 0);
  const progress = planner.cards.length ? Math.round((complete / planner.cards.length) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Stats bar */}
      <div className="border-b border-[#1A1614]/10 px-6 py-2.5 flex items-center gap-6 bg-white/50 flex-wrap">
        <div className="flex-1 min-w-[180px] max-w-xs">
          <div className="flex justify-between text-[10px] text-[#7A6B5E] font-medium mb-1">
            <span>{complete} of {planner.cards.length} complete</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 bg-[#1A1614]/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#E8B84B] rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-[#7A6B5E] flex-wrap">
          <span><strong className="text-[#1A1614]">{planner.cards.length}</strong> cards</span>
          <span className="opacity-30">·</span>
          <span><strong className="text-[#1A1614]">{totalWords.toLocaleString()}</strong> words</span>
          {STATUS_LIST.map((k) => {
            const s = STATUS[k];
            const n = planner.cards.filter((c) => c.status === k).length;
            if (!n) return null;
            return (
              <span key={k} className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${s.color}`}>
                {n} {s.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((card) => {
            const s = STATUS[card.status];
            const StatusIcon = s.icon;
            const chars = parseArr(card.characters);
            const tags = parseArr(card.tags);
            return (
              <div
                key={card.id}
                onClick={() => onCardClick(card)}
                className="group bg-white border border-[#1A1614]/10 hover:border-[#E8B84B] hover:shadow-md transition-all cursor-pointer flex flex-col"
              >
                <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-[#1A1614]/8">
                  <div className="flex items-center gap-1.5">
                    {card.episodeNumber && (
                      <span className="font-mono text-[10px] font-bold text-[#7A6B5E]">{card.episodeNumber}</span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${s.color}`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {s.label}
                    </span>
                  </div>
                  <GripVertical className="w-3.5 h-3.5 text-[#1A1614]/20 group-hover:text-[#1A1614]/40" />
                </div>

                <div className="px-3 py-2.5 flex-1 flex flex-col gap-1.5">
                  <h3 className="font-serif font-bold text-sm text-[#1A1614] leading-snug line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {card.title}
                  </h3>
                  {card.logline && (
                    <p className="text-[10px] text-[#7A6B5E] leading-relaxed line-clamp-3">{card.logline}</p>
                  )}
                  {card.theme && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[9px] uppercase tracking-[0.12em] font-bold text-[#7A6B5E]/50">Theme</span>
                      <span className="text-[9px] font-semibold text-[#1A1614]/60">{card.theme}</span>
                    </div>
                  )}
                  {chars.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {chars.slice(0, 3).map((c) => (
                        <span key={c} className="px-1.5 py-0.5 bg-[#E8B84B]/15 text-[8px] font-semibold text-[#7A5A00] rounded">{c}</span>
                      ))}
                      {chars.length > 3 && <span className="text-[8px] text-[#7A6B5E]">+{chars.length - 3}</span>}
                    </div>
                  )}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.slice(0, 2).map((t) => (
                        <span key={t} className="px-1.5 py-0.5 bg-[#1A1614]/6 text-[8px] font-medium text-[#7A6B5E] rounded">{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-3 py-2 border-t border-[#1A1614]/8 flex items-center justify-between">
                  <span className="text-[9px] text-[#7A6B5E]">
                    {card.wordCount > 0 ? (
                      <><strong className="text-[#1A1614]">{card.wordCount.toLocaleString()}</strong> words</>
                    ) : (
                      <span className="opacity-40">Not started</span>
                    )}
                  </span>
                  {card.assignee && (
                    <span className="w-4.5 h-4.5 rounded-full bg-[#1A1614] text-[#F9F6EE] text-[7px] font-bold flex items-center justify-center w-5 h-5">
                      {card.assignee.slice(0, 2)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add card */}
          <button
            onClick={onAddCard}
            disabled={isAddingCard}
            className="border-2 border-dashed border-[#1A1614]/15 hover:border-[#E8B84B] hover:bg-[#E8B84B]/5 transition-all flex flex-col items-center justify-center gap-2 py-10 text-[#7A6B5E] hover:text-[#1A1614] min-h-[180px] disabled:opacity-50"
          >
            {isAddingCard ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            <span className="text-[10px] font-bold uppercase tracking-[0.14em]">Add card</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card Detail Panel ────────────────────────────────────────────────────────

function Field({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3 h-3 text-[#7A6B5E]" />
        <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#7A6B5E]">{label}</p>
      </div>
      {children}
    </div>
  );
}

function EditableText({
  value,
  onSave,
  placeholder,
  multiline = false,
  italic = false,
  className = "",
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
  italic?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  if (editing) {
    const cls = `w-full bg-white border-2 border-[#E8B84B] px-3 py-2 text-sm focus:outline-none resize-none ${italic ? "italic font-serif" : ""} ${className}`;
    return multiline ? (
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        rows={4}
        className={cls}
        placeholder={placeholder}
      />
    ) : (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        className={cls}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`group relative cursor-text px-3 py-2 border border-transparent hover:border-[#1A1614]/15 hover:bg-white transition-all ${className}`}
    >
      {value ? (
        <span className={`text-sm text-[#1A1614] leading-relaxed whitespace-pre-wrap ${italic ? "italic font-serif" : ""}`}>{value}</span>
      ) : (
        <span className="text-sm text-[#7A6B5E]/40 italic">{placeholder}</span>
      )}
      <Pencil className="w-3 h-3 text-[#7A6B5E]/40 absolute top-2 right-2 opacity-0 group-hover:opacity-100" />
    </div>
  );
}

function CardDetailPanel({
  card,
  onClose,
  onUpdate,
  onDelete,
}: {
  card: PlannerCard;
  onClose: () => void;
  onUpdate: (fields: Partial<PlannerCard>) => void;
  onDelete: () => void;
}) {
  const chars = parseArr(card.characters);
  const tags = parseArr(card.tags);
  const progress = card.targetWordCount ? Math.round((card.wordCount / card.targetWordCount) * 100) : 0;

  const [newChar, setNewChar] = useState("");
  const [newTag, setNewTag] = useState("");

  const addChar = () => {
    if (!newChar.trim()) return;
    onUpdate({ characters: JSON.stringify([...chars, newChar.trim()]) });
    setNewChar("");
  };

  const removeChar = (c: string) =>
    onUpdate({ characters: JSON.stringify(chars.filter((x) => x !== c)) });

  const addTag = () => {
    if (!newTag.trim()) return;
    onUpdate({ tags: JSON.stringify([...tags, newTag.trim()]) });
    setNewTag("");
  };

  const removeTag = (t: string) =>
    onUpdate({ tags: JSON.stringify(tags.filter((x) => x !== t)) });

  return (
    <div className="w-[520px] shrink-0 border-l-2 border-[#1A1614] flex flex-col bg-[#F9F6EE] overflow-hidden">
      {/* Panel header */}
      <div className="border-b border-[#1A1614]/15 px-5 py-3 flex items-center justify-between bg-[#F9F6EE]">
        <div className="flex items-center gap-2.5">
          <button onClick={onClose} className="p-1 hover:bg-[#1A1614]/8 rounded text-[#7A6B5E]">
            <X className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              {card.episodeNumber && (
                <span className="font-mono text-[10px] font-bold text-[#7A6B5E]">{card.episodeNumber}</span>
              )}
              <span className="font-serif font-bold text-base text-[#1A1614]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {card.title}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => { if (confirm("Delete this card? This cannot be undone.")) onDelete(); }}
          className="p-1.5 text-[#7A6B5E] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Status row */}
      <div className="border-b border-[#1A1614]/10 px-5 py-2.5 flex items-center gap-2 flex-wrap bg-white/40">
        {STATUS_LIST.map((k) => {
          const s = STATUS[k];
          const active = card.status === k;
          return (
            <button
              key={k}
              onClick={() => onUpdate({ status: k })}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border-2 transition-colors ${
                active ? `${s.color} border-current` : "border-transparent text-[#7A6B5E]/50 hover:border-[#1A1614]/15"
              }`}
            >
              {s.label}
            </button>
          );
        })}
        {card.targetWordCount ? (
          <div className="ml-auto flex flex-col items-end">
            <span className="text-[10px] text-[#7A6B5E]">
              <strong className="text-[#1A1614]">{card.wordCount.toLocaleString()}</strong> / {card.targetWordCount.toLocaleString()} words
            </span>
            <div className="h-0.5 bg-[#1A1614]/10 rounded-full mt-1 w-24">
              <div className="h-full bg-[#E8B84B] rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          </div>
        ) : (
          <span className="ml-auto text-[10px] text-[#7A6B5E]">
            <strong className="text-[#1A1614]">{card.wordCount.toLocaleString()}</strong> words
          </span>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[1fr_190px]">

          {/* Main column */}
          <div className="px-5 py-4 flex flex-col gap-4 border-r border-[#1A1614]/10">
            <Field label="Title" icon={FileText}>
              <EditableText
                value={card.title}
                onSave={(v) => onUpdate({ title: v })}
                placeholder="Card title…"
              />
            </Field>

            <Field label="Logline" icon={FileText}>
              <EditableText
                value={card.logline ?? ""}
                onSave={(v) => onUpdate({ logline: v })}
                placeholder="One sentence summary…"
                italic
              />
            </Field>

            <Field label="Synopsis" icon={FileText}>
              <EditableText
                value={card.synopsis ?? ""}
                onSave={(v) => onUpdate({ synopsis: v })}
                placeholder="Full beat-by-beat summary…"
                multiline
              />
            </Field>

            <Field label="Thematic arc" icon={Lightbulb}>
              <div className="border-l-2 border-[#E8B84B]">
                <EditableText
                  value={card.characterArc ?? ""}
                  onSave={(v) => onUpdate({ characterArc: v })}
                  placeholder="What does this card do for the characters?"
                  multiline
                />
              </div>
            </Field>

            <Field label="Writer's notes" icon={StickyNote}>
              <div className="bg-amber-50/70 border border-amber-200">
                <EditableText
                  value={card.notes ?? ""}
                  onSave={(v) => onUpdate({ notes: v })}
                  placeholder="Private notes, reminders, open questions…"
                  multiline
                />
              </div>
            </Field>
          </div>

          {/* Sidebar */}
          <div className="px-4 py-4 flex flex-col gap-4">
            <Field label="Theme" icon={BarChart2}>
              <EditableText
                value={card.theme ?? ""}
                onSave={(v) => onUpdate({ theme: v })}
                placeholder="Central theme…"
              />
            </Field>

            <div className="border-t border-[#1A1614]/10" />

            <Field label="Episode #" icon={Film}>
              <EditableText
                value={card.episodeNumber ?? ""}
                onSave={(v) => onUpdate({ episodeNumber: v })}
                placeholder="e.g. E01"
              />
            </Field>

            <div className="border-t border-[#1A1614]/10" />

            <Field label="Characters" icon={Users}>
              <div className="flex flex-col gap-1.5">
                {chars.map((c) => (
                  <div key={c} className="flex items-center justify-between bg-white border border-[#1A1614]/10 px-2 py-1">
                    <span className="text-[10px] font-semibold text-[#1A1614]">{c}</span>
                    <button onClick={() => removeChar(c)} className="text-[#7A6B5E]/40 hover:text-red-500 ml-1">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-1 mt-1">
                  <input
                    value={newChar}
                    onChange={(e) => setNewChar(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addChar()}
                    placeholder="Add character…"
                    className="flex-1 text-[10px] border border-[#1A1614]/15 px-2 py-1 focus:outline-none focus:border-[#E8B84B] bg-white"
                  />
                  <button onClick={addChar} className="px-1.5 bg-[#1A1614] text-[#F9F6EE] text-[9px]">+</button>
                </div>
              </div>
            </Field>

            <div className="border-t border-[#1A1614]/10" />

            <Field label="Tags" icon={Tag}>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#1A1614]/8 text-[9px] font-medium text-[#7A6B5E] rounded cursor-pointer hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeTag(t)}
                  >
                    {t} <X className="w-2 h-2" />
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                  placeholder="Add tag…"
                  className="flex-1 text-[10px] border border-[#1A1614]/15 px-2 py-1 focus:outline-none focus:border-[#E8B84B] bg-white"
                />
                <button onClick={addTag} className="px-1.5 bg-[#1A1614] text-[#F9F6EE] text-[9px]">+</button>
              </div>
            </Field>

            <div className="border-t border-[#1A1614]/10" />

            {/* Meta */}
            <Field label="Details" icon={Clock}>
              <div className="flex flex-col gap-2">
                <div>
                  <p className="text-[9px] text-[#7A6B5E] mb-0.5">Assignee</p>
                  <EditableText
                    value={card.assignee ?? ""}
                    onSave={(v) => onUpdate({ assignee: v })}
                    placeholder="Who's writing this?"
                  />
                </div>
                <div>
                  <p className="text-[9px] text-[#7A6B5E] mb-0.5">Due date</p>
                  <EditableText
                    value={card.dueDate ?? ""}
                    onSave={(v) => onUpdate({ dueDate: v })}
                    placeholder="e.g. 14 Jun 2026"
                  />
                </div>
                <div>
                  <p className="text-[9px] text-[#7A6B5E] mb-0.5">Word target</p>
                  <EditableText
                    value={card.targetWordCount ? String(card.targetWordCount) : ""}
                    onSave={(v) => onUpdate({ targetWordCount: parseInt(v) || null })}
                    placeholder="e.g. 4500"
                  />
                </div>
              </div>
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function PlannerPage() {
  const [, params] = useRoute("/planner/:id");
  const plannerId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedCard, setSelectedCard] = useState<PlannerCard | null>(null);
  const [search, setSearch] = useState("");

  const { data: planner, isLoading } = useQuery<Planner>({
    queryKey: ["/api/planners", plannerId],
    enabled: !!plannerId,
    queryFn: () => fetch(`/api/planners/${plannerId}`).then((r) => r.json()),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/planners", plannerId] });

  const addCard = useMutation({
    mutationFn: () =>
      fetch(`/api/planners/${plannerId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled" }),
      }).then((r) => r.json()),
    onSuccess: (card) => {
      invalidate();
      setSelectedCard(card);
    },
  });

  const updateCard = useMutation({
    mutationFn: ({ cardId, fields }: { cardId: number; fields: Partial<PlannerCard> }) =>
      fetch(`/api/planners/${plannerId}/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      }).then((r) => r.json()),
    onSuccess: (updated) => {
      setSelectedCard((prev) => (prev?.id === updated.id ? updated : prev));
      invalidate();
    },
  });

  const deleteCard = useMutation({
    mutationFn: (cardId: number) =>
      fetch(`/api/planners/${plannerId}/cards/${cardId}`, { method: "DELETE" }),
    onSuccess: () => {
      setSelectedCard(null);
      invalidate();
    },
  });

  const handleUpdate = useCallback(
    (fields: Partial<PlannerCard>) => {
      if (!selectedCard) return;
      updateCard.mutate({ cardId: selectedCard.id, fields });
    },
    [selectedCard, updateCard]
  );

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="w-8 h-8 border-b-2 border-[#1A1614] animate-spin rounded-full" />
      </div>
    );
  }

  if (!planner) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-[#7A6B5E]">Planner not found.</p>
      </div>
    );
  }

  const complete = planner.cards.filter((c) => c.status === "complete").length;

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Page header ── */}
      <header className="border-b-2 border-[#1A1614] px-6 py-3 flex items-center justify-between bg-[#F9F6EE] shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 hover:bg-[#1A1614]/8 rounded text-[#7A6B5E] transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="w-px h-5 bg-[#1A1614]/15" />
          <div>
            <p className="text-[9px] uppercase tracking-[0.22em] font-bold text-[#7A6B5E]">Structure Planner</p>
            <h1 className="font-serif font-bold text-lg text-[#1A1614] leading-none mt-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
              {planner.title}
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 ml-2 px-2 py-1 rounded-full border border-[#1A1614]/15 text-[10px] font-semibold text-[#7A6B5E]">
            <MediaIcon type={planner.mediaType} />
            <span className="capitalize">{planner.mediaType === "tv" ? "TV Series" : planner.mediaType}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A6B5E]/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards…"
              className="pl-8 pr-3 py-1.5 text-[11px] border border-[#1A1614]/15 rounded-full bg-white focus:outline-none focus:border-[#E8B84B] w-36"
            />
          </div>
          <button
            onClick={() => addCard.mutate()}
            disabled={addCard.isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold bg-[#1A1614] text-[#F9F6EE] hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Add card
          </button>
        </div>
      </header>

      {/* ── Body: grid + optional detail panel ── */}
      <div className="flex flex-1 overflow-hidden">
        <CardGrid
          planner={planner}
          search={search}
          onCardClick={setSelectedCard}
          onAddCard={() => addCard.mutate()}
          isAddingCard={addCard.isPending}
        />
        {selectedCard && (
          <CardDetailPanel
            key={selectedCard.id}
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
            onUpdate={handleUpdate}
            onDelete={() => deleteCard.mutate(selectedCard.id)}
          />
        )}
      </div>
    </div>
  );
}
