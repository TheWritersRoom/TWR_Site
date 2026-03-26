import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Users, Layers, ChevronRight, Check, X, Eye, EyeOff } from "lucide-react";

// Social provider configuration — only Google is active; Apple & Facebook need developer credentials
const SOCIAL_PROVIDERS = [
  {
    id: "google",
    label: "Continue with Google",
    href: "/api/auth/google",
    active: true,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  {
    id: "apple",
    label: "Continue with Apple",
    href: null,
    active: false,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.42.07 2.4.82 3.24.87.87-.16 1.71-.96 3.24-.87 1.76.14 3.07.89 3.94 2.28-3.92 2.37-3.24 7.1.76 8.17-.55 1.27-1.21 2.48-2.18 3.43zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Continue with Facebook",
    href: null,
    active: false,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
] as const;

function SocialButtons() {
  const [inactiveMsg, setInactiveMsg] = useState<string | null>(null);

  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="space-y-2">
        {SOCIAL_PROVIDERS.map((p) => {
          if (p.active && p.href) {
            return (
              <a
                key={p.id}
                href={p.href}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-input bg-background/50 hover:border-primary/40 hover:bg-background transition-all text-sm font-semibold text-foreground"
              >
                {p.icon}
                <span>{p.label}</span>
              </a>
            );
          }
          return (
            <div key={p.id} className="relative">
              <button
                type="button"
                onClick={() => setInactiveMsg(p.id === inactiveMsg ? null : p.id)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-input bg-background/30 text-sm font-semibold text-muted-foreground cursor-not-allowed opacity-60"
              >
                {p.icon}
                <span>{p.label}</span>
                <span className="ml-auto text-xs font-normal border border-border px-1.5 py-0.5 rounded-md">Soon</span>
              </button>
              {inactiveMsg === p.id && (
                <p className="text-xs text-muted-foreground mt-1.5 px-1 leading-relaxed">
                  {p.id === "apple"
                    ? "Apple sign-in requires an Apple Developer account. Contact us to enable it."
                    : "Facebook sign-in requires a Facebook App ID. Contact us to enable it."}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

type WorkEntry = { title: string; year: string; publisher: string };

export function AuthModal() {
  const { register, signIn, isLoading, authModalOpen, closeAuthModal } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<1 | 2 | 3>(1);
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

  // Credentials fields
  const [suCredTitle, setSuCredTitle] = useState("");
  const [suIsPublished, setSuIsPublished] = useState(false);
  const [suWorks, setSuWorks] = useState<WorkEntry[]>([]);
  const [suWebsite, setSuWebsite] = useState("");

  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);

  if (isLoading || !authModalOpen) return null;

  // Roles that need the interests step (step 2)
  const hasInterestsStep = suRole === "contributor" || suRole === "both";
  // Credentials is always the last step — step 2 for authors, step 3 for contributor/both
  const credentialsStep: 2 | 3 = hasInterestsStep ? 3 : 2;
  const totalSteps = hasInterestsStep ? 3 : 2;

  const switchMode = (m: "signin" | "signup") => {
    setMode(m);
    setStep(1);
    setError("");
    setSuCredTitle("");
    setSuIsPublished(false);
    setSuWorks([]);
    setSuWebsite("");
  };

  const toggleGenre = (g: string) => {
    setSuGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  };

  const addWork = () => setSuWorks((prev) => [...prev, { title: "", year: "", publisher: "" }]);
  const removeWork = (i: number) => setSuWorks((prev) => prev.filter((_, j) => j !== i));
  const updateWork = (i: number, field: keyof WorkEntry, value: string) =>
    setSuWorks((prev) => prev.map((w, j) => j === i ? { ...w, [field]: value } : w));

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
    setStep(2); // always advance — step 2 is interests (contributor/both) or credentials (author)
  };

  const handleSignUpSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const validWorks = suWorks
        .filter((w) => w.title.trim())
        .map((w) => ({
          title: w.title.trim(),
          ...(w.year.trim() ? { year: parseInt(w.year) } : {}),
          ...(w.publisher.trim() ? { publisher: w.publisher.trim() } : {}),
        }));

      const credentials = JSON.stringify({
        ...(suCredTitle.trim() ? { professionalTitle: suCredTitle.trim() } : {}),
        isPublishedAuthor: suIsPublished || validWorks.length > 0,
        publishedWorks: validWorks,
        ...(suWebsite.trim() ? { website: suWebsite.trim() } : {}),
      });

      await register({
        name: suName,
        email: suEmail,
        password: suPassword,
        role: suRole,
        genres: JSON.stringify(suGenres),
        mediaInterests: suMedia,
        credentials,
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
          {mode === "signup" && (
            <div className="flex gap-2 px-8 pt-5">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
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

                  <SocialButtons />

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
                      <span className="flex items-center gap-2">
                        {hasInterestsStep ? "Next: Your Interests" : "Next: Your Credentials"}
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </Button>
                  </form>

                  <SocialButtons />

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

              {/* ── SIGN UP STEP 2: INTERESTS (contributor / both only) ── */}
              {mode === "signup" && step === 2 && hasInterestsStep && (
                <motion.div
                  key="signup-interests"
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
                      type="button"
                      onClick={() => setStep(3)}
                      className="w-full text-lg h-14"
                    >
                      <span className="flex items-center gap-2">
                        Next: Your Credentials <ChevronRight className="w-4 h-4" />
                      </span>
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── SIGN UP STEP: CREDENTIALS (step 2 for author, step 3 for contributor/both) ── */}
              {mode === "signup" && step === credentialsStep && (
                <motion.div
                  key="signup-credentials"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-5">
                    <button
                      onClick={() => setStep(hasInterestsStep ? 2 : 1)}
                      className="text-xs text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back
                    </button>
                    <h2 className="text-2xl font-serif font-bold text-foreground">Your Credentials</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      All optional — but published authors stand out to collaborators.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {/* Professional title */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">
                        Professional title
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">optional</span>
                      </label>
                      <input
                        type="text"
                        value={suCredTitle}
                        onChange={(e) => setSuCredTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background/50 border-2 border-input focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm"
                        placeholder="e.g. Published novelist & screenwriter"
                        maxLength={120}
                      />
                    </div>

                    {/* Published author checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={suIsPublished}
                          onChange={(e) => setSuIsPublished(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${suIsPublished ? "bg-primary border-primary" : "border-input group-hover:border-primary/60"}`}>
                          {suIsPublished && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">I am a published author</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Adds a verified badge to your profile</p>
                      </div>
                    </label>

                    {/* Published works */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Published works
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">optional</span>
                      </label>
                      <div className="space-y-2">
                        {suWorks.map((work, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <input
                                type="text"
                                value={work.title}
                                onChange={(e) => updateWork(i, "title", e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg bg-background/50 border-2 border-input focus:border-primary outline-none transition-all"
                                placeholder="Title"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={work.year}
                                  onChange={(e) => updateWork(i, "year", e.target.value.replace(/\D/g, "").slice(0, 4))}
                                  className="w-20 px-3 py-2 text-sm rounded-lg bg-background/50 border-2 border-input focus:border-primary outline-none transition-all"
                                  placeholder="Year"
                                />
                                <input
                                  type="text"
                                  value={work.publisher}
                                  onChange={(e) => updateWork(i, "publisher", e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-background/50 border-2 border-input focus:border-primary outline-none transition-all"
                                  placeholder="Publisher (optional)"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeWork(i)}
                              className="mt-2 p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addWork}
                          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mt-1"
                        >
                          + Add a work
                        </button>
                      </div>
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">
                        Portfolio or website
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">optional</span>
                      </label>
                      <input
                        type="url"
                        value={suWebsite}
                        onChange={(e) => setSuWebsite(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background/50 border-2 border-input focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm"
                        placeholder="https://yoursite.com"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={handleSignUpSubmit}
                      className="w-full text-lg h-14"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creating account…" : "Create Account"}
                    </Button>
                    <button
                      type="button"
                      onClick={handleSignUpSubmit}
                      disabled={isSubmitting}
                      className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Skip credentials for now
                    </button>
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
