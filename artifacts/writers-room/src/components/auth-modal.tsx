import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Users, Layers, ChevronRight, Check } from "lucide-react";

const ROLE_OPTIONS = [
  {
    value: "author" as UserRole,
    label: "Author",
    description: "Create and own projects, manage suggestions",
    icon: <PenLine className="w-5 h-5" />,
  },
  {
    value: "contributor" as UserRole,
    label: "Contributor / Editor",
    description: "Give feedback and suggest edits on others' work",
    icon: <Users className="w-5 h-5" />,
  },
  {
    value: "both" as UserRole,
    label: "Both",
    description: "Write your own projects and collaborate on others'",
    icon: <Layers className="w-5 h-5" />,
  },
];

const GENRES = [
  "Film & TV Script",
  "Long-form Fiction",
  "Non-fiction",
  "Short Story",
  "Poetry",
  "Fan Fiction",
  "Screenwriting",
  "Graphic Novel / Comics",
  "Children's Literature",
  "Literary Fiction",
  "Thriller / Mystery",
  "Romance",
  "Science Fiction / Fantasy",
  "Horror",
];

export function AuthModal() {
  const { user, login, isLoading } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("both");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [mediaInterests, setMediaInterests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading || user) return null;

  const needsStep2 = role === "contributor" || role === "both";

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    if (needsStep2) {
      setStep(2);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await login({
        name,
        email,
        role,
        genres: JSON.stringify(selectedGenres),
        mediaInterests,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      >
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
            alt=""
            className="w-full h-full object-cover opacity-30 mix-blend-multiply"
          />
        </div>

        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="relative z-10 w-full max-w-md bg-card/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden"
        >
          {/* Step indicator */}
          {needsStep2 && (
            <div className="flex gap-2 px-8 pt-6">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    step >= s ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          )}

          <div className="p-8 md:p-10">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center mb-7">
                    <h1 className="text-3xl font-serif font-semibold text-foreground">Writers Room</h1>
                    <p className="text-muted-foreground mt-2">Enter your details to start collaborating.</p>
                  </div>

                  <form onSubmit={handleStep1} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5 ml-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background/50 border-2 border-input focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                        placeholder="Virginia Woolf"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5 ml-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background/50 border-2 border-input focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                        placeholder="virginia@bloomsbury.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2 ml-1">I want to join as</label>
                      <div className="space-y-2">
                        {ROLE_OPTIONS.map((r) => (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => setRole(r.value)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                              role === r.value
                                ? "border-primary bg-primary/8 text-foreground"
                                : "border-input bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg transition-colors ${
                              role === r.value ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}>
                              {r.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground">{r.label}</p>
                              <p className="text-xs text-muted-foreground">{r.description}</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors flex items-center justify-center ${
                              role === r.value ? "border-primary bg-primary" : "border-input"
                            }`}>
                              {role === r.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button type="submit" className="w-full mt-2 text-lg h-14" disabled={!name || !email}>
                      {needsStep2 ? (
                        <span className="flex items-center gap-2">Next: Your Interests <ChevronRight className="w-4 h-4" /></span>
                      ) : (
                        "Enter the Room"
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-6">
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back
                    </button>
                    <h2 className="text-2xl font-serif font-bold text-foreground">Your Interests</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Help authors find the right collaborator for their work.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Areas of interest
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">select all that apply</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {GENRES.map((g) => {
                          const selected = selectedGenres.includes(g);
                          return (
                            <button
                              key={g}
                              type="button"
                              onClick={() => toggleGenre(g)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                selected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
                              }`}
                            >
                              {selected && <Check className="w-3 h-3" />}
                              {g}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">
                        Favourite authors, films & media
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">optional</span>
                      </label>
                      <textarea
                        value={mediaInterests}
                        onChange={(e) => setMediaInterests(e.target.value)}
                        placeholder="e.g. Toni Morrison, Blade Runner, The Wire, Raymond Carver, Studio Ghibli…"
                        className="w-full px-4 py-3 rounded-xl bg-background/50 border-2 border-input focus:border-primary outline-none text-sm resize-none"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Authors can use this to find contributors who share their taste.
                      </p>
                    </div>

                    <Button
                      onClick={handleSubmit}
                      className="w-full text-lg h-14"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Entering..." : "Enter the Room"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
