import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, FileText, Hash, Eye, Download, Check, ChevronRight,
  AlertTriangle, Users, Clock, Lock, Unlock, Edit3, X, Fingerprint,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AccessLog = { id: number; user_id: number; user_name: string; access_type: string; accessed_at: string };
type Signatory = { user_id: number; name: string; agreed_at: string };
type Collaborator = { id: number; name: string; userId?: number };

const DEFAULT_AGREEMENT = `By joining this project as a contributor, you acknowledge and agree to the following:

1. OWNERSHIP: The author retains full copyright and intellectual property rights over all original content in this project, including any content derived from or incorporating your suggestions.

2. CONTRIBUTIONS: Any suggestions, edits, or ideas you submit through The Writers Room may be accepted, modified, or rejected at the author's sole discretion. Accepted contributions become part of the work under the author's copyright.

3. CONFIDENTIALITY: You agree to keep the contents of this unpublished manuscript confidential and not share, reproduce, or distribute any part of it without written consent from the author.

4. NO TRANSFER: Contributing to this project does not grant you any ownership, licensing, or distribution rights over the work, unless a separate written agreement is executed.

5. GOOD FAITH: You agree to contribute in good faith and not to use access to this manuscript for any purpose other than providing creative assistance to the author.`;

export function IpProtectionPanel({
  projectId,
  userId,
  isOwner,
  collaborators,
}: {
  projectId: number;
  userId: number;
  isOwner: boolean;
  collaborators: Collaborator[];
}) {
  const queryClient = useQueryClient();
  const [section, setSection] = useState<"overview" | "agreement" | "logs" | "certificates">("overview");
  const [editingAgreement, setEditingAgreement] = useState(false);
  const [agreementDraft, setAgreementDraft] = useState("");
  const [requiredDraft, setRequiredDraft] = useState(false);
  const [savingAgreement, setSavingAgreement] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [downloadingCert, setDownloadingCert] = useState<number | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const { data: agreement } = useQuery({
    queryKey: ["/api/projects", projectId, "ip-agreement", userId],
    queryFn: () => fetch(`/api/projects/${projectId}/ip-agreement?userId=${userId}`).then(r => r.json()),
  });

  const { data: fingerprint, refetch: refetchFingerprint, isFetching: fetchingFP } = useQuery({
    queryKey: ["/api/projects", projectId, "fingerprint"],
    queryFn: () => fetch(`/api/projects/${projectId}/fingerprint?userId=${userId}`).then(r => r.json()),
    enabled: false,
  });

  const { data: accessLogs = [], refetch: refetchLogs } = useQuery<AccessLog[]>({
    queryKey: ["/api/projects", projectId, "access-logs"],
    queryFn: () => fetch(`/api/projects/${projectId}/access-logs?userId=${userId}`).then(r => r.json()),
    enabled: isOwner && section === "logs",
  });

  const { data: signatories = [] } = useQuery<Signatory[]>({
    queryKey: ["/api/projects", projectId, "ip-agreement", "signatories"],
    queryFn: () => fetch(`/api/projects/${projectId}/ip-agreement/signatories?userId=${userId}`).then(r => r.json()),
    enabled: isOwner,
  });

  const handleStartEdit = () => {
    setAgreementDraft(agreement?.text ?? DEFAULT_AGREEMENT);
    setRequiredDraft(agreement?.required ?? false);
    setEditingAgreement(true);
  };

  const handleSaveAgreement = async () => {
    setSavingAgreement(true);
    try {
      await fetch(`/api/projects/${projectId}/ip-agreement`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, text: agreementDraft, required: requiredDraft }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "ip-agreement"] });
      setEditingAgreement(false);
      showToast("IP agreement saved");
    } finally {
      setSavingAgreement(false);
    }
  };

  const handleSignAgreement = async () => {
    await fetch(`/api/projects/${projectId}/ip-agreement/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "ip-agreement"] });
    showToast("Agreement signed");
  };

  const handleDownloadCert = async (contributorId: number, contributorName: string) => {
    setDownloadingCert(contributorId);
    try {
      const res = await fetch(`/api/projects/${projectId}/certificate/${contributorId}?userId=${userId}`);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `WR_Certificate_${contributorName.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Certificate generation failed");
    } finally {
      setDownloadingCert(null);
    }
  };

  const sections = [
    { id: "overview" as const, label: "Overview", icon: Shield },
    { id: "agreement" as const, label: "IP Agreement", icon: FileText },
    { id: "logs" as const, label: "Access Logs", icon: Eye, ownerOnly: true },
    { id: "certificates" as const, label: "Certificates", icon: Award },
  ].filter(s => !s.ownerOnly || isOwner);

  return (
    <div className="h-full flex flex-col relative">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-3 left-3 right-3 z-50 bg-[#1A1614] text-[#F9F6EE] text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />{toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 pt-4 pb-0 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-[#E8B84B]" />
          <h3 className="text-sm font-bold text-foreground">IP Protection</h3>
        </div>
        <div className="flex gap-0 -mb-px overflow-x-auto">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-colors shrink-0 ${
                section === s.id ? "border-[#E8B84B] text-[#1A1614]" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <s.icon className="w-3 h-3" />{s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* OVERVIEW */}
        {section === "overview" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Writers Room provides layered IP protection for your work. Each layer adds an additional record of authorship, access, and contribution.
            </p>

            {/* Status cards */}
            {[
              {
                icon: FileText, label: "IP Agreement", color: "amber",
                status: agreement?.required ? (signatories.length > 0 ? `${signatories.length} signed` : "Active, none signed yet") : "Not required",
                ok: agreement?.required,
                action: () => setSection("agreement"),
                actionLabel: isOwner ? (agreement?.required ? "Manage" : "Set up") : (agreement?.signed ? "Signed" : "Review & sign"),
              },
              {
                icon: Hash, label: "Content Fingerprinting", color: "blue",
                status: "SHA-256 hash generated on demand",
                ok: true,
                action: () => { setSection("overview"); refetchFingerprint(); },
                actionLabel: "Generate hash",
              },
              {
                icon: Eye, label: "Access Logging", color: "purple",
                status: "All content views are recorded automatically",
                ok: true,
                action: isOwner ? () => setSection("logs") : undefined,
                actionLabel: "View logs",
              },
              {
                icon: Award, label: "Contribution Certificates", color: "green",
                status: `${collaborators.length} contributor${collaborators.length !== 1 ? "s" : ""} eligible`,
                ok: collaborators.length > 0,
                action: () => setSection("certificates"),
                actionLabel: "Download",
              },
            ].map(item => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-3 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  item.ok ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                }`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.status}</p>
                </div>
                {item.action && (
                  <button onClick={item.action} className="text-[11px] font-semibold text-primary hover:text-primary/80 shrink-0 flex items-center gap-0.5">
                    {item.actionLabel} <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            {/* Fingerprint result */}
            {fingerprint && (
              <div className="bg-[#1A1614] rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#E8B84B]">
                  <Fingerprint className="w-3 h-3" /> Content Fingerprint
                </div>
                <p className="font-mono text-[10px] text-[#F9F6EE] break-all leading-relaxed">{fingerprint.hash}</p>
                <p className="text-[10px] text-[#7A6B5E]">Generated {format(new Date(fingerprint.timestamp), "MMM d, yyyy 'at' HH:mm")}</p>
              </div>
            )}
          </div>
        )}

        {/* IP AGREEMENT */}
        {section === "agreement" && (
          <div className="space-y-4">
            {isOwner && !editingAgreement && (
              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${agreement?.required ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                  {agreement?.required ? <Lock className="w-4 h-4 text-emerald-600 shrink-0" /> : <Unlock className="w-4 h-4 text-amber-600 shrink-0" />}
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${agreement?.required ? "text-emerald-800" : "text-amber-800"}`}>
                      {agreement?.required ? "Agreement is required to join" : "Agreement not required"}
                    </p>
                    <p className={`text-xs mt-0.5 ${agreement?.required ? "text-emerald-600" : "text-amber-600"}`}>
                      {signatories.length} of {collaborators.length} collaborator{collaborators.length !== 1 ? "s" : ""} signed
                    </p>
                  </div>
                </div>

                {agreement?.text && (
                  <div className="bg-card border border-border rounded-xl p-3 max-h-48 overflow-y-auto">
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-mono">{agreement.text}</p>
                  </div>
                )}

                <Button onClick={handleStartEdit} variant="outline" size="sm" className="w-full gap-2">
                  <Edit3 className="w-3.5 h-3.5" />
                  {agreement?.text ? "Edit agreement" : "Set up IP agreement"}
                </Button>

                {signatories.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Signed by</p>
                    <div className="space-y-2">
                      {signatories.map(s => (
                        <div key={s.user_id} className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">{s.name.charAt(0)}</div>
                          <span className="font-medium text-foreground flex-1">{s.name}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(s.agreed_at), "MMM d, yyyy")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isOwner && editingAgreement && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={requiredDraft}
                      onChange={e => setRequiredDraft(e.target.checked)}
                      className="w-4 h-4 accent-[#E8B84B]"
                    />
                    <span className="text-sm font-semibold text-foreground">Require contributors to sign before joining</span>
                  </label>
                </div>
                <textarea
                  value={agreementDraft}
                  onChange={e => setAgreementDraft(e.target.value)}
                  className="w-full bg-card border border-input rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-primary resize-none min-h-[280px] leading-relaxed"
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingAgreement(false)}>Cancel</Button>
                  <Button size="sm" className="flex-1" onClick={handleSaveAgreement} disabled={savingAgreement}>
                    {savingAgreement ? "Saving…" : "Save agreement"}
                  </Button>
                </div>
                <button
                  onClick={() => setAgreementDraft(DEFAULT_AGREEMENT)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground text-center transition-colors"
                >
                  Reset to default template
                </button>
              </div>
            )}

            {!isOwner && (
              <div className="space-y-3">
                {!agreement?.text ? (
                  <div className="text-center py-10 opacity-60">
                    <FileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium">No IP agreement set</p>
                    <p className="text-xs mt-1">The author has not set an IP agreement for this project.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-card border border-border rounded-xl p-3 max-h-64 overflow-y-auto">
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{agreement.text}</p>
                    </div>
                    {agreement.signed ? (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-emerald-800">You signed this agreement</p>
                          <p className="text-xs text-emerald-600 mt-0.5">
                            {agreement.agreedAt ? format(new Date(agreement.agreedAt), "MMMM d, yyyy") : ""}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Button className="w-full gap-2" onClick={handleSignAgreement}>
                        <Shield className="w-4 h-4" /> Sign IP Agreement
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ACCESS LOGS */}
        {section === "logs" && isOwner && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Who viewed this project's content and when.</p>
              <button onClick={() => refetchLogs()} className="text-xs text-primary hover:text-primary/80 font-semibold">Refresh</button>
            </div>
            {accessLogs.length === 0 ? (
              <div className="text-center py-12 opacity-60">
                <Eye className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">No access events recorded yet.</p>
                <p className="text-xs mt-1">Events are logged when collaborators view the manuscript.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {accessLogs.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-3 bg-card border border-border rounded-xl p-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[11px] font-bold shrink-0">
                      {log.user_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{log.user_name}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{log.access_type}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-muted-foreground">{format(new Date(log.accessed_at), "MMM d")}</p>
                      <p className="text-[10px] text-muted-foreground/60">{format(new Date(log.accessed_at), "HH:mm")}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CERTIFICATES */}
        {section === "certificates" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Contribution certificates are signed PDFs showing every accepted suggestion made by a contributor, with timestamps and a SHA-256 content fingerprint. They serve as independent proof of creative contribution.
            </p>

            {collaborators.length === 0 ? (
              <div className="text-center py-10 opacity-60">
                <Users className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">No contributors yet</p>
                <p className="text-xs mt-1">Certificates are available once you have collaborators with accepted suggestions.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {collaborators.map(c => {
                  const cUserId = (c as any).userId ?? (c as any).user_id ?? c.id;
                  return (
                    <div key={c.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E8B84B]/15 text-[#1A1614] flex items-center justify-center font-bold text-sm shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">Collaborator</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1.5 text-xs h-8"
                        onClick={() => handleDownloadCert(cUserId, c.name)}
                        disabled={downloadingCert === cUserId}
                      >
                        <Download className="w-3 h-3" />
                        {downloadingCert === cUserId ? "Generating…" : "Certificate"}
                      </Button>
                    </div>
                  );
                })}
                {!isOwner && (
                  <div className="pt-2">
                    <Button
                      className="w-full gap-2"
                      onClick={() => handleDownloadCert(userId, "My")}
                      disabled={downloadingCert === userId}
                    >
                      <Award className="w-4 h-4" />
                      {downloadingCert === userId ? "Generating…" : "Download My Certificate"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Your certificate lists all your accepted suggestions with timestamps.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
