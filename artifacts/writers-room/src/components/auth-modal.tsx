import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFreeSlots } from "@/hooks/use-free-slots";
import type { UserRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check, X, Eye, EyeOff, ToggleLeft, ToggleRight } from "lucide-react";

const WRITING_SPECIALTIES = [
  "Plotting & Structure", "Character Development", "Dialogue & Voice", "World-building",
  "Pacing & Flow", "Research & Fact-checking", "Developmental Editing", "Line Editing",
  "Copy Editing & Proofreading", "Poetry", "Screenwriting", "Non-fiction",
  "Beta Reading", "Script Coverage",
];

const EXPERIENCE_LEVELS = [
  { value: "novice",       label: "Novice",       desc: "Just starting out" },
  { value: "intermediate", label: "Intermediate",  desc: "Some experience" },
  { value: "experienced",  label: "Experienced",   desc: "Several years" },
  { value: "professional", label: "Professional",  desc: "Working professionally" },
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
  const freeSlots = useFreeSlots();
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
  const suRole = "both" as const;
  const [suGenres, setSuGenres] = useState<string[]>([]);
  const [suMedia, setSuMedia] = useState("");

  // Credentials fields
  const [suCredTitle, setSuCredTitle] = useState("");
  const [suWorks, setSuWorks] = useState<WorkEntry[]>([]);
  const [suWebsite, setSuWebsite] = useState("");
  const [suLinkedin, setSuLinkedin] = useState("");
  const [suPatreon, setSuPatreon] = useState("");
  const [suSubstack, setSuSubstack] = useState("");
  const [suSpecialties, setSuSpecialties] = useState<string[]>([]);
  const [suExperience, setSuExperience] = useState("");
  const [suAvailableForWork, setSuAvailableForWork] = useState(true);

  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);

  if (isLoading || !authModalOpen) return null;

  // Everyone follows the same 2-step flow: basic info → profile/credentials
  const hasInterestsStep = false;
  const credentialsStep: 2 | 3 = 2;
  const totalSteps = 2;

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
        isPublishedAuthor: validWorks.length > 0,
        publishedWorks: validWorks,
        ...(suWebsite.trim() ? { website: suWebsite.trim() } : {}),
        ...(suLinkedin.trim() ? { linkedin: suLinkedin.trim() } : {}),
        ...(suPatreon.trim() ? { patreon: suPatreon.trim() } : {}),
        ...(suSubstack.trim() ? { substack: suSubstack.trim() } : {}),
        ...(suSpecialties.length > 0 ? { editingSpecialties: suSpecialties } : {}),
        ...(suExperience ? { experienceLevel: suExperience } : {}),
        availableForWork: suAvailableForWork,
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
          className="relative z-10 w-full max-w-md bg-card/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
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

          <div className="p-8 md:p-10 pt-6 overflow-y-auto flex-1">
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
                    <p className="text-muted-foreground mt-1 text-sm">Sign in to The Writers Room.</p>
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
                    <h1 className="text-3xl font-serif font-semibold text-foreground">Join The Writers Room</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Create your account to start collaborating.</p>
                    {freeSlots !== null && freeSlots > 0 && (
                      <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
                        </span>
                        <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
                          {freeSlots} free Pro {freeSlots === 1 ? "account" : "accounts"} left — you'll get Pro free
                        </span>
                      </div>
                    )}
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

                    <Button
                      type="submit"
                      className="w-full mt-2 text-lg h-14"
                      disabled={!suName || !suEmail || !suPassword}
                    >
                      <span className="flex items-center gap-2">
                        Continue
                        <ChevronRight className="w-4 h-4" />
                      </span>
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
                    <h2 className="text-2xl font-serif font-bold text-foreground">Your Profile</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      All optional — a complete profile helps others find and connect with you. You can always fill this in later.
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

                    {/* Platform links */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">
                        Platform profiles
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">optional</span>
                      </label>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                          <span className="w-24 flex-shrink-0 text-xs font-semibold text-[#0A66C2] bg-[#0A66C2]/10 px-2 py-1 rounded text-center">LinkedIn</span>
                          <input
                            type="url"
                            value={suLinkedin}
                            onChange={(e) => setSuLinkedin(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg bg-background/50 border-2 border-input focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm"
                            placeholder="https://linkedin.com/in/yourname"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-24 flex-shrink-0 text-xs font-semibold text-[#F96854] bg-[#F96854]/10 px-2 py-1 rounded text-center">Patreon</span>
                          <input
                            type="url"
                            value={suPatreon}
                            onChange={(e) => setSuPatreon(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg bg-background/50 border-2 border-input focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm"
                            placeholder="https://patreon.com/yourname"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-24 flex-shrink-0 text-xs font-semibold text-[#FF6719] bg-[#FF6719]/10 px-2 py-1 rounded text-center">Substack</span>
                          <input
                            type="url"
                            value={suSubstack}
                            onChange={(e) => setSuSubstack(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg bg-background/50 border-2 border-input focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm"
                            placeholder="https://yourname.substack.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Skills & specialties */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Skills & specialties
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">select all that apply</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {WRITING_SPECIALTIES.map((s) => {
                          const sel = suSpecialties.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setSuSpecialties((prev) => sel ? prev.filter((x) => x !== s) : [...prev, s])}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${sel ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
                            >
                              {sel && <Check className="w-3 h-3" />}
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Experience level */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Experience level
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">optional</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {EXPERIENCE_LEVELS.map((lvl) => (
                          <button
                            key={lvl.value}
                            type="button"
                            onClick={() => setSuExperience(suExperience === lvl.value ? "" : lvl.value)}
                            className={`px-3 py-2 rounded-xl text-left border-2 transition-all ${suExperience === lvl.value ? "border-primary bg-primary/8 text-foreground" : "border-input bg-background/50 text-muted-foreground hover:border-primary/40"}`}
                          >
                            <p className="text-xs font-bold">{lvl.label}</p>
                            <p className="text-[11px] font-normal opacity-70">{lvl.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Available for new projects */}
                    <label className="flex items-center justify-between gap-4 cursor-pointer group">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Available for new projects</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Shows authors you're open to collaboration requests</p>
                      </div>
                      <button type="button" onClick={() => setSuAvailableForWork((v) => !v)} aria-label="Toggle available">
                        {suAvailableForWork
                          ? <ToggleRight className="w-9 h-9 text-emerald-500" />
                          : <ToggleLeft className="w-9 h-9 text-muted-foreground/40" />}
                      </button>
                    </label>

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
