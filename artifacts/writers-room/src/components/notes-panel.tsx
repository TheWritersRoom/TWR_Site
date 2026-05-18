import { useState, useEffect, useRef, useCallback } from "react";
import { StickyNote, X, ChevronDown, ChevronUp } from "lucide-react";

interface NotesPanelProps {
  initialValue: string | null;
  onSave: (value: string) => void;
  open: boolean;
  onToggle: () => void;
  variant?: "sidebar" | "drawer";
}

const DEBOUNCE_MS = 800;

export function NotesPanel({ initialValue, onSave, open, onToggle, variant = "sidebar" }: NotesPanelProps) {
  const [draft, setDraft] = useState(initialValue ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(initialValue ?? "");

  useEffect(() => {
    if (initialValue !== null && initialValue !== lastSaved.current) {
      setDraft(initialValue);
      lastSaved.current = initialValue;
    }
  }, [initialValue]);

  const scheduleFlush = useCallback(
    (value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        if (value === lastSaved.current) return;
        setSaving(true);
        setSaved(false);
        try {
          await onSave(value);
          lastSaved.current = value;
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        } finally {
          setSaving(false);
        }
      }, DEBOUNCE_MS);
    },
    [onSave]
  );

  const handleChange = (v: string) => {
    setDraft(v);
    scheduleFlush(v);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  if (variant === "drawer") {
    return (
      <>
        {open && (
          <div className="border-t-2 border-[#1A1614] bg-[#FFFEF5] shrink-0 flex flex-col" style={{ height: 220 }}>
            <div className="flex items-center justify-between px-5 py-2 border-b border-[#1A1614]/12 bg-[#F9F6EE]">
              <div className="flex items-center gap-2">
                <StickyNote className="w-3.5 h-3.5 text-[#E8B84B]" />
                <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#1A1614]">Quick Notes</span>
              </div>
              <div className="flex items-center gap-3">
                {saving && (
                  <span className="text-[9px] text-[#7A6B5E]/60 font-medium">Saving…</span>
                )}
                {saved && !saving && (
                  <span className="text-[9px] text-emerald-600 font-medium">Saved</span>
                )}
                <button onClick={onToggle} className="p-1 hover:bg-[#1A1614]/8 rounded text-[#7A6B5E]">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <textarea
              value={draft}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Jot down anything — ideas, reminders, open questions…"
              className="flex-1 resize-none px-5 py-3 text-sm text-[#1A1614] bg-[#FFFEF5] focus:outline-none leading-relaxed placeholder:text-[#7A6B5E]/35 font-[inherit]"
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`border-t border-border/50 ${open ? "" : ""}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-black/3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <StickyNote className="w-3.5 h-3.5 text-[#E8B84B]" />
          <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#1A1614]/80">Quick Notes</span>
          {!open && draft && (
            <span className="text-[9px] text-[#7A6B5E]/60 italic truncate max-w-[120px]">{draft.slice(0, 40)}{draft.length > 40 ? "…" : ""}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saving && <span className="text-[9px] text-[#7A6B5E]/60">Saving…</span>}
          {saved && !saving && <span className="text-[9px] text-emerald-600">Saved</span>}
          {open ? <ChevronDown className="w-3.5 h-3.5 text-[#7A6B5E]" /> : <ChevronUp className="w-3.5 h-3.5 text-[#7A6B5E]" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-border/40 bg-[#FFFEF5]">
          <textarea
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Jot down anything — ideas, reminders, open questions…"
            className="w-full resize-none px-4 py-3 text-sm text-[#1A1614] bg-transparent focus:outline-none leading-relaxed placeholder:text-[#7A6B5E]/35 font-[inherit]"
            rows={6}
          />
        </div>
      )}
    </div>
  );
}
