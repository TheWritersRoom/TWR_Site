import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Save, Loader2, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type BlockType,
  type ScriptBlock,
  genId,
  parseFountain,
  serializeFountain,
  BLOCK_LABELS,
  BLOCK_CYCLE,
} from "@/utils/fountain";

const BLOCK_STYLE: Record<BlockType, string> = {
  "scene-heading":
    "font-bold uppercase tracking-wide text-foreground font-mono text-sm",
  action: "text-foreground font-mono text-sm",
  character:
    "text-center uppercase font-semibold text-foreground font-mono text-sm",
  dialogue: "text-center text-foreground font-mono text-sm",
  parenthetical: "text-center italic text-muted-foreground font-mono text-sm",
  transition: "text-right uppercase font-semibold text-foreground font-mono text-sm",
};

const BLOCK_WRAPPER: Record<BlockType, string> = {
  "scene-heading": "border-l-4 border-primary pl-3 py-0.5 bg-primary/5 rounded-r",
  action: "border-l-4 border-transparent pl-3 py-0.5",
  character: "pl-3 py-0.5",
  dialogue: "pl-3 py-0.5",
  parenthetical: "pl-3 py-0.5",
  transition: "pl-3 py-0.5",
};

const BLOCK_PLACEHOLDER: Record<BlockType, string> = {
  "scene-heading": "INT. LOCATION - DAY",
  action: "Action / description...",
  character: "CHARACTER NAME",
  dialogue: "Dialogue...",
  parenthetical: "(beat)",
  transition: "CUT TO:",
};

const ENTER_NEXT_TYPE: Record<BlockType, BlockType> = {
  "scene-heading": "action",
  action: "action",
  character: "dialogue",
  dialogue: "action",
  parenthetical: "dialogue",
  transition: "scene-heading",
};

function BlockRow({
  block,
  isFocused,
  onChange,
  onFocus,
  onKeyDown,
}: {
  block: ScriptBlock;
  isFocused: boolean;
  onChange: (text: string) => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isFocused && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
      const len = ref.current.value.length;
      ref.current.setSelectionRange(len, len);
    }
  }, [isFocused]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [block.text]);

  return (
    <div className={`relative group ${BLOCK_WRAPPER[block.type]}`}>
      {isFocused && (
        <span className="absolute -left-28 top-0.5 text-[10px] font-mono text-muted-foreground opacity-70 w-24 text-right">
          {BLOCK_LABELS[block.type]}
        </span>
      )}
      <textarea
        ref={ref}
        value={block.text}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder={isFocused ? BLOCK_PLACEHOLDER[block.type] : undefined}
        rows={1}
        className={`w-full bg-transparent border-none outline-none resize-none overflow-hidden leading-relaxed ${BLOCK_STYLE[block.type]} placeholder:text-muted-foreground/40`}
        style={{ minHeight: "1.6rem" }}
      />
    </div>
  );
}

export function ScriptEditor({
  content,
  projectTitle,
  onSave,
  onClose,
}: {
  content: string;
  projectTitle: string;
  onSave: (newContent: string) => Promise<void>;
  onClose: () => void;
}) {
  const [blocks, setBlocks] = useState<ScriptBlock[]>(() =>
    parseFountain(content)
  );
  const [focusedId, setFocusedId] = useState<string>(blocks[0]?.id ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const updateBlock = useCallback(
    (id: string, text: string) => {
      setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, text } : b)));
      setIsDirty(true);
    },
    []
  );

  const cycleType = useCallback((id: string) => {
    setBlocks((bs) => {
      const idx = BLOCK_CYCLE.indexOf(bs.find((b) => b.id === id)!.type);
      const nextType = BLOCK_CYCLE[(idx + 1) % BLOCK_CYCLE.length];
      return bs.map((b) => (b.id === id ? { ...b, type: nextType } : b));
    });
    setIsDirty(true);
  }, []);

  const insertAfter = useCallback((id: string, type: BlockType) => {
    const newBlock: ScriptBlock = { id: genId(), type, text: "" };
    setBlocks((bs) => {
      const idx = bs.findIndex((b) => b.id === id);
      const next = [...bs];
      next.splice(idx + 1, 0, newBlock);
      return next;
    });
    setFocusedId(newBlock.id);
    setIsDirty(true);
  }, []);

  const deleteBlock = useCallback(
    (id: string) => {
      setBlocks((bs) => {
        if (bs.length === 1) return bs;
        const idx = bs.findIndex((b) => b.id === id);
        const next = bs.filter((b) => b.id !== id);
        setFocusedId(next[Math.max(0, idx - 1)]?.id ?? "");
        return next;
      });
      setIsDirty(true);
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, block: ScriptBlock) => {
      if (e.key === "Tab") {
        e.preventDefault();
        cycleType(block.id);
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        insertAfter(block.id, ENTER_NEXT_TYPE[block.type]);
      } else if (
        e.key === "Backspace" &&
        block.text === "" &&
        blocks.length > 1
      ) {
        e.preventDefault();
        deleteBlock(block.id);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [blocks.length, cycleType, insertAfter, deleteBlock, onClose]
  );

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError("");
    try {
      const fountain = serializeFountain(blocks);
      await onSave(fountain);
      setIsDirty(false);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const focusedBlock = blocks.find((b) => b.id === focusedId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-[#FAF8F5]"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Film className="w-5 h-5 text-primary" />
          <div>
            <p className="font-serif font-bold text-base text-foreground leading-tight">{projectTitle}</p>
            <p className="text-xs text-muted-foreground">Script Editor</p>
          </div>
        </div>

        {/* Element type indicator */}
        {focusedBlock && (
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Element:</span>
            <div className="flex gap-1">
              {BLOCK_CYCLE.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setBlocks((bs) =>
                      bs.map((b) =>
                        b.id === focusedId ? { ...b, type: t } : b
                      )
                    );
                    setIsDirty(true);
                  }}
                  className={`px-2 py-0.5 rounded-md font-mono text-[10px] transition-colors ${
                    focusedBlock.type === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {t === "scene-heading" ? "Scene" :
                   t === "parenthetical" ? "Paren" :
                   BLOCK_LABELS[t]}
                </button>
              ))}
            </div>
            <span className="text-muted-foreground ml-2 opacity-60">Tab to cycle</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {saveError && <p className="text-xs text-destructive">{saveError}</p>}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            className="rounded-full px-5 gap-2"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : (
              <><Save className="w-4 h-4" /> Save</>
            )}
          </Button>
        </div>
      </div>

      {/* Script area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[680px] mx-auto py-16 px-8 pl-32 space-y-1">
          {blocks.map((block) => (
            <BlockRow
              key={block.id}
              block={block}
              isFocused={block.id === focusedId}
              onChange={(text) => updateBlock(block.id, text)}
              onFocus={() => setFocusedId(block.id)}
              onKeyDown={(e) => handleKeyDown(e, block)}
            />
          ))}
          {/* Click below to add action */}
          <div
            className="h-32 cursor-text opacity-0"
            onClick={() => {
              const last = blocks[blocks.length - 1];
              if (last) insertAfter(last.id, "action");
            }}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="px-6 py-2 border-t border-border bg-card text-xs text-muted-foreground flex items-center justify-between shrink-0">
        <span>{blocks.filter(b => b.type === "scene-heading").length} scenes • {blocks.length} elements</span>
        <span className="opacity-60">Enter = new element • Tab = cycle type • Shift+Enter = line break</span>
      </div>
    </motion.div>
  );
}
