import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Users, Layers, ChevronRight, Check, X, Eye, EyeOff } from "lucide-react";

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
  "Film & TV Script", "Long-form Fiction", "Non-fiction", "Short Story",
  "Poetry", "Fan Fiction", "Screenwriting", "Graphic Novel / Comics",
  "Children's Literature", "Literary Fiction", "Thriller / Mystery",
  "Romance", "Science Fiction / Fantasy", "Horror",
];

function PasswordInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        required
        minLength={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-background/50 border-2 border-input focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none pr-12"
        placeholder={placeholder ?? "••••••••"}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function AuthModal() {
  const { register, signIn, isLoading, authModalOpen, closeAuthModal } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sign In fields
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  // Sign Up fields
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suRole, setSuRole] = useState<UserRole>("both");
  const [suGenres, setSuGenres] = useState<string[]>([]);
  const [suMedia, setSuMedia] = useState("");

  if (isLoading || !authModalOpen) return null;

  const needsStep2 = suRole === "contributor" || suRole === "both";

  const switchMode = (m: "signin" | "signup") => {
    setMode(m);
    setStep(1);
    setError("");
  };

  const toggleGenre = (g: string) => {
    setSuGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  };

  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNeedsPasswordSetup(false);
    setIsSubmitting(true);
    try {
      await signIn({ email: siEmail, password: siPassword });
    } catch (err: any) {
      const msg: string = err.message || "Sign in failed";
      if (msg.includes("before passwords were required")) {
        setNeedsPasswordSetup(true);
        setError("Your account doesn't have a password yet.");
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (suPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError("");
    if (needsStep2) {
      setStep(2);
    } else {
      handleSignUpSubmit();
    }
  };

  const handleSignUpSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await register({
        name: suName,
        email: suEmail,
        password: suPassword,
        role: suRole,
        genres: JSON.stringify(suGenres),
        mediaInterests: suMedia,
      });
    } catch (err: any) {
      setError(err.message || "Registration failed");
      setStep(1);
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
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-full hover:bg-black/10 text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                  mode === m
                    ? "text-foreground border-b-2 border-primary -mb-px"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Step dots for signup */}
          {mode === "signup" && needsStep2 && (
            <div className="flex gap-2 px-8 pt-5">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${step >= s ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
          )}

          <div className="p-8 md:p-10 pt-6">
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* ── SIGN IN ── */}
              {mode === "signin" && (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center mb-7">
                    <h1 className="text-3xl font-serif font-semibold text-foreground">Welcome back</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Sign in to your Writers Room account.</p>
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5 ml-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={siEmail}
                        onChange={(e) => setSiEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background/50 border-2 border-input focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                        placeholder="virginia@bloomsbury.com"
                        autoComplete="email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5 ml-1">Password</label>
                      <PasswordInput
                        value={siPassword}
                        onChange={setSiPassword}
                        placeholder="Your password"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full mt-2 text-lg h-14"
                      disabled={isSubmitting || !siEmail || !siPassword}
                    >
                      {isSubmitting ? "Signing in…" : "Sign In"}
                    </Button>
                  </form>

                  {needsPasswordSetup && (
                    <div className="mt-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
                      <p className="font-semibold mb-1">No password on this account yet</p>
                      <p className="text-xs text-amber-700 mb-2">Go to <strong>Create Account</strong>, enter your existing email and choose a new password — your account and projects will be kept.</p>
                      <button
                        onClick={() => {
                          setSuEmail(siEmail);
                          switchMode("signup");
                        }}
                        className="text-xs font-bold text-primary underline"
                      >
                        Set up a password →
                      </button>
                    </div>
                  )}

                  <p className="text-center text-xs text-muted-foreground mt-5">
                    New here?{" "}
                    <button
                      onClick={() => switchMode("signup")}
                      className="text-primary font-semibold hover:underline"
                    >
                      Create an account
                    </button>
                  </p>
                </motion.div>
              )}

              {/* ── SIGN UP STEP 1 ── */}
              {mode === "signup" && step === 1 && (
                <motion.div
                  key="signup-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center mb-6">
                    <h1 className="text-3xl font-serif font-semibold text-foreground">Join Writers Room</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Create your account to start collaborating.</p>
                  </div>

                  <form onSubmit={handleSignUpStep1} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5 ml-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={suName}
                        onChange={(e) => setSuName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background/50 border-2 border-input focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                        placeholder="Virginia Woolf"
                        autoComplete="name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5 ml-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={suEmail}
                        onChange={(e) => setSuEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background/50 border-2 border-input focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                        placeholder="virginia@bloomsbury.com"
                        autoComplete="email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5 ml-1">Password</label>
                      <PasswordInput
                        value={suPassword}
                        onChange={setSuPassword}
                        placeholder="At least 8 characters"
                      />
                      <p className="text-xs text-muted-foreground mt-1 ml-1">Minimum 8 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2 ml-1">I want to join as</label>
                      <div className="space-y-2">
                        {ROLE_OPTIONS.map((r) => (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => setSuRole(r.value)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                              suRole === r.value
                                ? "border-primary bg-primary/8 text-foreground"
                                : "border-input bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg transition-colors ${suRole === r.value ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                              {r.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground">{r.label}</p>
                              <p className="text-xs text-muted-foreground">{r.description}</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors flex items-center justify-center ${suRole === r.value ? "border-primary bg-primary" : "border-input"}`}>
                              {suRole === r.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full mt-2 text-lg h-14"
                      disabled={!suName || !suEmail || !suPassword}
                    >
                      {needsStep2 ? (
                        <span className="flex items-center gap-2">Next: Your Interests <ChevronRight className="w-4 h-4" /></span>
                      ) : (
                        isSubmitting ? "Creating account…" : "Create Account"
                      )}
                    </Button>
                  </form>

                  <p className="text-center text-xs text-muted-foreground mt-5">
                    Already have an account?{" "}
                    <button
                      onClick={() => switchMode("signin")}
                      className="text-primary font-semibold hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </motion.div>
              )}

              {/* ── SIGN UP STEP 2 ── */}
              {mode === "signup" && step === 2 && (
                <motion.div
                  key="signup-2"
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
                          const selected = suGenres.includes(g);
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
                        value={suMedia}
                        onChange={(e) => setSuMedia(e.target.value)}
                        placeholder="e.g. Toni Morrison, Blade Runner, The Wire, Raymond Carver…"
                        className="w-full px-4 py-3 rounded-xl bg-background/50 border-2 border-input focus:border-primary outline-none text-sm resize-none"
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleSignUpSubmit}
                      className="w-full text-lg h-14"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creating account…" : "Create Account"}
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
