import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { History, Save, RotateCcw, Eye, GitCompare, X, ChevronRight, Check, Zap, User } from "lucide-react";
import { Button } from "@/components/ui/button";

type Version = {
  id: number;
  project_id: number;
  saved_by: number;
  saved_by_name: string;
  label: string;
  trigger: string;
  created_at: string;
};

type VersionWithContent = Version & { content: string };

function computeDiff(oldText: string, newText: string): Array<{ type: "same" | "removed" | "added"; text: string }> {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (oldLines[i] === newLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: Array<{ type: "same" | "removed" | "added"; text: string }> = [];
  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && oldLines[i] === newLines[j]) {
      result.push({ type: "same", text: oldLines[i] });
      i++; j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      result.push({ type: "added", text: newLines[j] });
      j++;
    } else {
      result.push({ type: "removed", text: oldLines[i] });
      i++;
    }
  }
  return result;
}

function DiffView({ versionA, versionB }: { versionA: VersionWithContent; versionB: VersionWithContent }) {
  const diff = computeDiff(versionA.content, versionB.content);
  const hasChanges = diff.some(d => d.type !== "same");

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <span className="font-bold text-red-700 block truncate">{versionA.label}</span>
          <span className="text-red-500">{format(new Date(versionA.created_at), "MMM d, HH:mm")}</span>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <span className="font-bold text-green-700 block truncate">{versionB.label}</span>
          <span className="text-green-500">{format(new Date(versionB.created_at), "MMM d, HH:mm")}</span>
        </div>
      </div>
      {!hasChanges ? (
        <div className="text-center py-6 text-xs text-muted-foreground">
          <Check className="w-5 h-5 mx-auto mb-2 text-emerald-500" />
          These versions are identical.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-auto max-h-[340px] font-mono text-xs">
          {diff.map((line, i) => {
            if (line.type === "same") return null;
            return (
              <div
                key={i}
                className={`px-3 py-0.5 whitespace-pre-wrap break-all leading-5 ${
                  line.type === "removed" ? "bg-red-50 text-red-700 border-l-2 border-red-400" : "bg-green-50 text-green-800 border-l-2 border-green-500"
                }`}
              >
                <span className="mr-2 select-none opacity-50">{line.type === "removed" ? "−" : "+"}</span>
                {line.text || <span className="opacity-30">(empty line)</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function VersionHistoryPanel({
  projectId,
  userId,
  currentContent,
  onRestored,
}: {
  projectId: number;
  userId: number;
  currentContent: string;
  onRestored: () => void;
}) {
  const queryClient = useQueryClient();
  const [labelDraft, setLabelDraft] = useState("");
  const [savingLabel, setSavingLabel] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<VersionWithContent | null>(null);
  const [compareA, setCompareA] = useState<VersionWithContent | null>(null);
  const [compareB, setCompareB] = useState<VersionWithContent | null>(null);
  const [mode, setMode] = useState<"list" | "preview" | "diff">("list");
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const { data: versions = [], refetch } = useQuery<Version[]>({
    queryKey: ["/api/projects", projectId, "versions"],
    queryFn: () =>
      fetch(`/api/projects/${projectId}/versions?userId=${userId}`).then((r) => r.json()),
  });

  const saveVersion = async () => {
    if (!labelDraft.trim()) return;
    setSavingLabel(true);
    try {
      await fetch(`/api/projects/${projectId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, label: labelDraft.trim() }),
      });
      setLabelDraft("");
      refetch();
      showToast("Version saved");
    } finally {
      setSavingLabel(false);
    }
  };

  const fetchVersion = async (id: number): Promise<VersionWithContent> => {
    const r = await fetch(`/api/projects/${projectId}/versions/${id}?userId=${userId}`);
    return r.json();
  };

  const handlePreview = async (v: Version) => {
    const full = await fetchVersion(v.id);
    setPreviewVersion(full);
    setMode("preview");
  };

  const handleCompareSelect = async (v: Version) => {
    const full = await fetchVersion(v.id);
    if (!compareA) {
      setCompareA(full);
    } else if (!compareB) {
      setCompareB(full);
      setMode("diff");
    }
  };

  const handleRestore = async (v: Version) => {
    setRestoringId(v.id);
    try {
      await fetch(`/api/projects/${projectId}/versions/${v.id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      refetch();
      setMode("list");
      setPreviewVersion(null);
      showToast(`Restored to "${v.label}"`);
      onRestored();
    } finally {
      setRestoringId(null);
    }
  };

  const triggerIcon = (trigger: string) => {
    if (trigger === "manual") return <Save className="w-3 h-3" />;
    if (trigger.startsWith("auto")) return <Zap className="w-3 h-3" />;
    return <History className="w-3 h-3" />;
  };

  const triggerLabel = (trigger: string) => {
    if (trigger === "manual") return "Saved manually";
    if (trigger === "suggestion-accepted") return "Auto · suggestion accepted";
    if (trigger === "published") return "Auto · published";
    if (trigger === "auto-restore") return "Auto · before restore";
    return trigger;
  };

  return (
    <div className="h-full flex flex-col">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-3 left-3 right-3 z-50 bg-[#1A1614] text-[#F9F6EE] text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        {mode !== "list" && (
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
            onClick={() => {
              setMode("list");
              setPreviewVersion(null);
              setCompareA(null);
              setCompareB(null);
            }}
          >
            <ChevronRight className="w-3 h-3 rotate-180" /> Back to history
          </button>
        )}
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          {mode === "list" ? "Version History" : mode === "preview" ? previewVersion?.label : "Compare Versions"}
        </h3>
        {mode === "list" && (
          <p className="text-xs text-muted-foreground mt-0.5">{versions.length} version{versions.length !== 1 ? "s" : ""} saved</p>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mode === "list" && (
          <>
            {/* Save current version */}
            <div className="bg-card rounded-xl border border-border p-3 space-y-2 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Save current version</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={labelDraft}
                  onChange={(e) => setLabelDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveVersion()}
                  placeholder="e.g. Chapter 3 draft"
                  className="flex-1 min-w-0 bg-background border border-input rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                />
                <Button
                  size="sm"
                  className="rounded-lg px-3 shrink-0"
                  onClick={saveVersion}
                  disabled={!labelDraft.trim() || savingLabel}
                >
                  {savingLabel ? "…" : <Save className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Compare hint */}
            {versions.length >= 2 && !compareA && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 border border-border rounded-lg px-3 py-2">
                <GitCompare className="w-3.5 h-3.5 shrink-0" />
                Click <span className="font-semibold text-foreground mx-1">Compare</span> on two versions to see a diff.
              </div>
            )}
            {compareA && !compareB && (
              <div className="flex items-center gap-2 text-xs bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
                <GitCompare className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-foreground">Now pick a second version to compare against <strong>{compareA.label}</strong>.</span>
                <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setCompareA(null)}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Version list */}
            {versions.length === 0 ? (
              <div className="text-center py-12 opacity-60">
                <History className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">No versions yet.</p>
                <p className="text-xs mt-1">Save your first version above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {versions.map((v, i) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`bg-card rounded-xl border p-3 shadow-sm transition-colors ${
                      compareA?.id === v.id ? "border-primary/50 bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm font-semibold text-foreground truncate">{v.label}</span>
                          {i === 0 && (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-1.5 py-0.5 rounded-full shrink-0">Latest</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          {triggerIcon(v.trigger)}
                          <span>{triggerLabel(v.trigger)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                          <User className="w-3 h-3" />
                          <span>{v.saved_by_name}</span>
                          <span className="opacity-40">·</span>
                          <span>{formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-2.5">
                      <button
                        onClick={() => handlePreview(v)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                      <button
                        onClick={() => handleCompareSelect(v)}
                        disabled={compareA?.id === v.id}
                        className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary transition-colors disabled:opacity-30"
                      >
                        <GitCompare className="w-3 h-3" /> Compare
                      </button>
                      <button
                        onClick={() => handleRestore(v)}
                        disabled={restoringId === v.id || i === 0}
                        className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors ml-auto disabled:opacity-30"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {restoringId === v.id ? "Restoring…" : "Restore"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {mode === "preview" && previewVersion && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 border border-border rounded-lg px-3 py-2">
              <Eye className="w-3.5 h-3.5 shrink-0" />
              Preview only — your current document is unchanged.
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="font-serif text-sm leading-relaxed text-foreground whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                {previewVersion.content || <span className="text-muted-foreground italic">Empty document</span>}
              </div>
            </div>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleRestore(previewVersion)}
              disabled={restoringId === previewVersion.id}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {restoringId === previewVersion.id ? "Restoring…" : `Restore to "${previewVersion.label}"`}
            </Button>
          </div>
        )}

        {mode === "diff" && compareA && compareB && (
          <DiffView versionA={compareA} versionB={compareB} />
        )}
      </div>
    </div>
  );
}
