import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import {
  PenTool, Upload, Users, Star, BookOpen, MessageSquare,
  Globe, ArrowRight, Check, Sparkles, Telescope, BarChart2
} from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: "easeOut" as const },
});

const FEATURES = [
  {
    icon: <Upload className="w-6 h-6" />,
    title: "Upload any format",
    desc: "PDF, DOCX, TXT, Markdown, RTF — paste or upload. The manuscript lands in a clean reading view instantly.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Invite your collaborators",
    desc: "Set your own room size and send targeted invites to contributors whose genre interests and media tastes align with your work.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Inline edit suggestions",
    desc: "Collaborators highlight any passage and propose a replacement. Authors accept, discard, or annotate each one.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: <BarChart2 className="w-6 h-6" />,
    title: "Track who helps most",
    desc: "An acceptance-rate leaderboard shows you, over time, which collaborators consistently improve your work.",
    color: "bg-violet-100 text-violet-600",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Publish with fine-grained control",
    desc: "Choose who reads your published work — all users, genre-matched readers, or contributors only — and who can comment.",
    color: "bg-rose-100 text-rose-600",
  },
  {
    icon: <Telescope className="w-6 h-6" />,
    title: "Discover published works",
    desc: "Browse and read works that match your interests, leave feedback, and build your reputation as a thoughtful editor.",
    color: "bg-sky-100 text-sky-600",
  },
];

const FOR_AUTHORS = [
  "Upload books or scripts in any format",
  "Invite handpicked collaborators by email",
  "Review inline diff suggestions side by side",
  "Track acceptance rates to find your best collaborators",
  "Publish with visibility controls and private feedback",
];

const FOR_CONTRIBUTORS = [
  "Set your genre interests and media tastes",
  "Get discovered by authors who match your profile",
  "Highlight and suggest edits inline",
  "Build a track record of accepted suggestions",
  "Read and respond to published work in the Discover feed",
];

const STEPS = [
  { n: "01", title: "Create or join", desc: "Sign up as an Author, a Contributor, or both. Set your genre profile in under a minute." },
  { n: "02", title: "Upload your manuscript", desc: "Authors upload a book or script. The platform parses it into a clean reading view." },
  { n: "03", title: "Collaborate", desc: "Invited collaborators highlight passages and propose edits. Authors decide what to keep." },
  { n: "04", title: "Publish & collect feedback", desc: "When ready, publish with the audience and feedback settings that work for you." },
];

export default function Landing() {
  const { openAuthModal } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-foreground overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-6 md:px-12 py-4 bg-[#FAF8F5]/80 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <PenTool className="w-4 h-4 text-primary" />
          </div>
          <span className="font-serif font-bold text-lg text-foreground tracking-tight">Writers Room</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAuthModal}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </button>
          <button
            onClick={openAuthModal}
            className="px-4 py-2 rounded-full bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
          >
            Get started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 md:px-12 max-w-5xl mx-auto text-center">
        {/* Background blob */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-radial from-primary/12 via-accent/8 to-transparent rounded-full blur-3xl" />
        </div>

        <motion.div {...fadeUp(0.05)}>
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" /> Collaborative writing, reimagined
          </span>
        </motion.div>

        <motion.h1 {...fadeUp(0.12)} className="text-5xl md:text-7xl font-serif font-bold text-foreground leading-[1.05] tracking-tight mb-6">
          The room where<br />
          <span className="text-primary">great writing</span> happens
        </motion.h1>

        <motion.p {...fadeUp(0.2)} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Writers Room is the platform where authors upload their manuscripts, invite genre-matched collaborators to suggest edits, and publish with total control over who reads — and who responds.
        </motion.p>

        <motion.div {...fadeUp(0.28)} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={openAuthModal}
            className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-foreground text-background font-semibold text-base hover:bg-foreground/90 transition-colors shadow-lg shadow-foreground/10"
          >
            Start for free <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={openAuthModal}
            className="px-7 py-3.5 rounded-full border border-border text-foreground font-semibold text-base hover:bg-accent/60 transition-colors"
          >
            Join as a contributor
          </button>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 md:px-12 bg-card/50 border-y border-border/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">How it works</h2>
            <p className="text-muted-foreground">Four steps from first draft to published work</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="relative"
              >
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px bg-border/60 -translate-y-px z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                    <span className="font-serif font-bold text-primary text-sm">{step.n}</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-6 md:px-12 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">Everything you need</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Built specifically for the writing process — not adapted from a generic tool</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="bg-card rounded-2xl border border-border p-6 hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Two columns: For Authors / For Contributors */}
      <section className="py-20 px-6 md:px-12 bg-card/50 border-y border-border/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
          {/* For Authors */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="bg-card rounded-3xl border border-border p-8"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-foreground mb-2">For Authors</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Keep full ownership of your work while opening it to the exact people who can make it better.
            </p>
            <ul className="space-y-3">
              {FOR_AUTHORS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={openAuthModal}
              className="mt-8 w-full py-3 rounded-xl bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 transition-colors"
            >
              Upload your manuscript
            </button>
          </motion.div>

          {/* For Contributors */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="bg-card rounded-3xl border border-border p-8"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-foreground mb-2">For Contributors</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Build a reputation as a skilled editor by working on projects that genuinely interest you.
            </p>
            <ul className="space-y-3">
              {FOR_CONTRIBUTORS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={openAuthModal}
              className="mt-8 w-full py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-accent/60 transition-colors"
            >
              Join as a contributor
            </button>
          </motion.div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="py-24 px-6 md:px-12 text-center">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4"
          >
            Ready to open the room?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-muted-foreground text-lg mb-8"
          >
            Free to join. No credit card. Start uploading and collaborating today.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.15 }}
            onClick={openAuthModal}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-foreground text-background font-semibold text-base hover:bg-foreground/90 transition-colors shadow-xl shadow-foreground/10"
          >
            Get started — it's free <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6 md:px-12 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-primary" />
          <span className="font-serif font-semibold text-foreground">Writers Room</span>
        </div>
        <p>The platform for serious collaborative writing.</p>
      </footer>
    </div>
  );
}
