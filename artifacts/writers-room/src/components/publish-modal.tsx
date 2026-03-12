import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, Users, Star, MessageCircle, Lock, Eye, ChevronDown, ChevronUp,
  Sparkles, X, BookOpen, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Visibility = "all" | "matched" | "contributors";
type FeedbackVis = "public" | "private";

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (opts: {
    publishVisibility: Visibility;
    feedbackEnabled: boolean;
    feedbackAudience: Visibility;
    feedbackVisibility: FeedbackVis;
  }) => Promise<void>;
  onUnpublish?: () => Promise<void>;
  isPublished?: boolean;
  currentSettings?: {
    publishVisibility: Visibility;
    feedbackEnabled: boolean;
    feedbackAudience: Visibility;
    feedbackVisibility: FeedbackVis;
  };
  loading?: boolean;
}

const VISIBILITY_OPTIONS: { value: Visibility; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "all",
    label: "All signed-up users",
    description: "Anyone on the platform can read this work",
    icon: <Globe className="w-5 h-5" />,
  },
  {
    value: "matched",
    label: "Profile-matched users",
    description: "Users whose genre interests match this work's type",
    icon: <Star className="w-5 h-5" />,
  },
  {
    value: "contributors",
    label: "Current & previous contributors",
    description: "Only people who have collaborated on this project",
    icon: <Users className="w-5 h-5" />,
  },
];

const FEEDBACK_VIS_OPTIONS: { value: FeedbackVis; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "public",
    label: "Public",
    description: "Anyone who can read the work can also see the feedback",
    icon: <Eye className="w-5 h-5" />,
  },
  {
    value: "private",
    label: "Private",
    description: "Only you (the author) can see the feedback",
    icon: <Lock className="w-5 h-5" />,
  },
];

export function PublishModal({
  isOpen, onClose, onPublish, onUnpublish, isPublished, currentSettings, loading,
}: PublishModalProps) {
  const [publishVisibility, setPublishVisibility] = useState<Visibility>(
    currentSettings?.publishVisibility ?? "all"
  );
  const [feedbackEnabled, setFeedbackEnabled] = useState(
    currentSettings?.feedbackEnabled ?? false
  );
  const [feedbackAudience, setFeedbackAudience] = useState<Visibility>(
    currentSettings?.feedbackAudience ?? "all"
  );
  const [feedbackVisibility, setFeedbackVisibility] = useState<FeedbackVis>(
    currentSettings?.feedbackVisibility ?? "public"
  );

  const handlePublish = () => {
    onPublish({ publishVisibility, feedbackEnabled, feedbackAudience, feedbackVisibility });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-lg overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-primary/10 to-accent/20 px-6 pt-8 pb-6 border-b border-border">
              <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/10 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-foreground">
                    {isPublished ? "Update Publishing Settings" : "Publish Your Work"}
                  </h2>
                  <p className="text-sm text-muted-foreground">Choose who can read and respond</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
              {/* Readership */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Who can read this work?
                </h3>
                <div className="space-y-2">
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPublishVisibility(opt.value)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                        publishVisibility === opt.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border hover:border-primary/30 hover:bg-accent/30"
                      }`}
                    >
                      <div className={`mt-0.5 ${publishVisibility === opt.value ? "text-primary" : "text-muted-foreground"}`}>
                        {opt.icon}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${publishVisibility === opt.value ? "text-primary" : "text-foreground"}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                      </div>
                      <div className={`ml-auto mt-1 w-4 h-4 rounded-full border-2 shrink-0 ${
                        publishVisibility === opt.value ? "border-primary bg-primary" : "border-muted-foreground/40"
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback toggle */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" /> Allow feedback?
                  </h3>
                  <button
                    onClick={() => setFeedbackEnabled(!feedbackEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      feedbackEnabled ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      feedbackEnabled ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                <AnimatePresence>
                  {feedbackEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-4"
                    >
                      {/* Feedback audience */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Who can give feedback?
                        </p>
                        <div className="space-y-2">
                          {VISIBILITY_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setFeedbackAudience(opt.value)}
                              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                                feedbackAudience === opt.value
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/30"
                              }`}
                            >
                              <div className={`${feedbackAudience === opt.value ? "text-primary" : "text-muted-foreground"}`}>
                                {opt.icon}
                              </div>
                              <p className={`text-sm font-medium ${feedbackAudience === opt.value ? "text-primary" : "text-foreground"}`}>
                                {opt.label}
                              </p>
                              <div className={`ml-auto w-4 h-4 rounded-full border-2 shrink-0 ${
                                feedbackAudience === opt.value ? "border-primary bg-primary" : "border-muted-foreground/40"
                              }`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Feedback visibility */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Feedback visibility
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {FEEDBACK_VIS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setFeedbackVisibility(opt.value)}
                              className={`p-3 rounded-xl border transition-all text-left ${
                                feedbackVisibility === opt.value
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/30"
                              }`}
                            >
                              <div className={`mb-1.5 ${feedbackVisibility === opt.value ? "text-primary" : "text-muted-foreground"}`}>
                                {opt.icon}
                              </div>
                              <p className={`text-sm font-semibold ${feedbackVisibility === opt.value ? "text-primary" : "text-foreground"}`}>
                                {opt.label}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{opt.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-0 flex gap-3">
              {isPublished && onUnpublish && (
                <Button
                  variant="outline"
                  onClick={onUnpublish}
                  disabled={loading}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  Unpublish
                </Button>
              )}
              <Button onClick={onClose} variant="outline" className="flex-1" disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handlePublish} className="flex-1" disabled={loading}>
                {loading ? "Publishing…" : isPublished ? "Update settings" : "Publish"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
