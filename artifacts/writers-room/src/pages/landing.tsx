import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useFreeSlots } from "@/hooks/use-free-slots";
import { useLocation } from "wouter";
import {
  Upload, Users, MessageSquare, BarChart2, Globe, Telescope,
  ArrowRight, Check, BookOpen, Star, Shield, Award, Mail, Menu, X, Droplets,
} from "lucide-react";
import typewriterRoom from "@/assets/writers-room-banner.jpg";
import { SEO, SOFTWARE_APP_SCHEMA } from "@/components/seo";

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

const FEATURES = [
  { icon: <Upload className="w-5 h-5" />, title: "Write or upload", desc: "Start from a blank page or bring existing work in any format — PDF, DOCX, TXT, Markdown, RTF. Lands in a clean reading view instantly." },
  { icon: <Users className="w-5 h-5" />, title: "Invite or post a pitch", desc: "Open the door to your Writing Room — send targeted invites to contributors matched by genre and track record, or post a Pitch and let the right people apply to join." },
  { icon: <MessageSquare className="w-5 h-5" />, title: "Inline diff suggestions", desc: "Everyone in your Writing Room can highlight any passage and propose a replacement. You see the original and the alternative side by side — accept or discard in one click." },
  { icon: <Shield className="w-5 h-5" />, title: "IP protection built in", desc: "Require contributors to sign an IP agreement before joining. Content is SHA-256 fingerprinted on demand and every view is logged." },
  { icon: <BarChart2 className="w-5 h-5" />, title: "Track who helps most", desc: "Per-project leaderboards and public acceptance-rate profiles show which contributors consistently improve the work." },
  { icon: <Globe className="w-5 h-5" />, title: "Publish here or export anywhere", desc: "When your Writing Room has done its work, publish within the platform with fine-grained visibility controls, or export a KDP-ready file for Amazon, Apple Books, Kobo, and beyond. Your work, your destination." },
  { icon: <Telescope className="w-5 h-5" />, title: "Discover published works", desc: "Browse a curated feed of works published within The Writers Room. Read in your favourite genres, leave feedback, and build your editorial reputation." },
  { icon: <Award className="w-5 h-5" />, title: "Contribution certificates", desc: "Contributors download a signed PDF for every project — listing accepted suggestions, timestamps, and a cryptographic content fingerprint. Proof of creative work, forever." },
  { icon: <Mail className="w-5 h-5" />, title: "Direct messaging", desc: "Discuss a suggestion in depth, ask about a project, or simply introduce yourself. Every great collaboration starts with a conversation." },
  { icon: <Droplets className="w-5 h-5" />, title: "Earn Ink", desc: "Every contribution earns Ink — a reputational currency that grows with your activity on the platform. Redeem it for subscription discounts, merchandise, and exclusive creative services as the platform grows." },
];

const FOR_AUTHORS = [
  "Write from scratch or upload in any format",
  "Invite handpicked collaborators by email",
  "Review inline diff suggestions side by side",
  "Track acceptance rates to find your best collaborators",
  "Publish within The Writers Room or export to KDP, Apple Books, Kobo",
];

const FOR_CONTRIBUTORS = [
  "Set your genre interests and media tastes",
  "Get discovered by authors who match your profile",
  "Highlight and suggest edits inline",
  "Build a track record of accepted suggestions",
  "Read and respond to published work in the Discover feed",
  "Earn Ink — reputational currency redeemable for discounts and services",
];

const STEPS = [
  { n: "I", title: "Create or join", desc: "Sign up free in under a minute. Open your own Writing Room, contribute to others', or do both — one account covers everything." },
  { n: "II", title: "Build your Writing Room", desc: "Write from scratch or upload a book or script in any format. Set your collaboration terms — what contributors can see, how many join, whether they sign an IP agreement. Your room, your rules." },
  { n: "III", title: "Open the door", desc: "Invite contributors who fit your project by genre, taste, and track record. Or post a Pitch and let the right people apply. Every person in your room is there because you chose them." },
  { n: "IV", title: "Publish & collect feedback", desc: "Publish within The Writers Room to reach readers directly, or export a KDP-ready file for Amazon, Apple Books, Kobo, and more. Collect feedback either way." },
];

const Rule = ({ className = "" }: { className?: string }) => (
  <div className={`border-t border-[#1A1614]/20 ${className}`} />
);

const ThickRule = ({ className = "" }: { className?: string }) => (
  <div className={`border-t-2 border-[#1A1614] ${className}`} />
);

export default function Landing() {
  const { openAuthModal, user } = useAuth();
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const freeSlots = useFreeSlots();

  const goTo = (path: string) => { setMenuOpen(false); navigate(path); };

  return (
    <div className="min-h-screen bg-[#F9F6EE] text-[#1A1614] overflow-x-hidden font-sans">
      <SEO
        title="Collaborative Writing Platform"
        description="Build your Writing Room — invite genre-matched collaborators to help shape, edit, and publish your manuscript. Free to join."
        canonicalPath="/"
        schema={SOFTWARE_APP_SCHEMA}
      />

      {/* ── MASTHEAD NAV — hidden when signed in (sidebar takes over) ── */}
      {!user && <header className="fixed top-0 inset-x-0 z-40 bg-[#F9F6EE]/95 backdrop-blur-sm">
        {/* Top metadata strip */}
        <div className="border-b border-[#1A1614]/15 px-6 md:px-14 py-1.5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.22em] text-[#7A6B5E] font-semibold">Collaborative Writing Platform</span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-[#7A6B5E] font-semibold">Free to join</span>
        </div>

        {/* Masthead */}
        <div className="px-6 md:px-14 py-3 text-center">
          <a href="/" className="font-serif font-bold text-2xl md:text-3xl tracking-[0.06em] text-[#1A1614] hover:text-[#E8B84B] transition-colors">The Writers Room</a>
        </div>

        {/* Nav links strip */}
        <ThickRule />
        <nav aria-label="Main navigation" className="px-6 md:px-14 py-2 flex items-center justify-between">
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => navigate("/how-it-works")} className="text-[11px] uppercase tracking-[0.16em] text-[#1A1614] font-semibold hover:text-[#E8B84B] transition-colors">How it works</button>
            <button onClick={() => navigate("/pricing")} className="text-[11px] uppercase tracking-[0.16em] text-[#1A1614] font-semibold hover:text-[#E8B84B] transition-colors">Pricing</button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex md:hidden p-1 text-[#1A1614] hover:text-[#E8B84B] transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-4">
            <button onClick={openAuthModal} className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#1A1614] hover:text-[#FDDCB5] transition-colors">Sign in</button>
            <button onClick={openAuthModal} className="px-4 py-1.5 bg-[#1A1614] text-[#F9F6EE] text-[11px] uppercase tracking-[0.16em] font-bold hover:bg-[#FDDCB5] transition-colors">Subscribe</button>
          </div>
        </nav>
        <Rule />

        {/* Mobile dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t-2 border-[#1A1614] bg-[#F9F6EE]"
            >
              <div className="flex flex-col divide-y divide-[#1A1614]/10">
                <button onClick={() => goTo("/how-it-works")} className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.18em] font-bold text-[#1A1614] hover:bg-[#E8B84B]/10 transition-colors">How it works</button>
                <button onClick={() => goTo("/pricing")} className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.18em] font-bold text-[#1A1614] hover:bg-[#E8B84B]/10 transition-colors">Pricing</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>}

      <main id="main-content">
      {/* ── HERO ── */}
      <section className={`${user ? "pt-0" : "pt-[9.5rem]"} pb-0 min-h-screen flex flex-col`}>

        {/* Yellow cover band */}
        <div className="bg-[#E8B84B] px-6 md:px-14 pt-14 pb-16 flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden">

          {/* Decorative teal accent lines */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#FDDCB5]" />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#1A1614]/60 mb-4">
              Est. 2025 &nbsp;·&nbsp; Collaborative Writing &nbsp;·&nbsp; Global
            </p>

            <ThickRule className="w-48 md:w-72 mx-auto mb-5 border-[#1A1614]" />

            <h1 className="font-serif font-bold text-[clamp(3.5rem,12vw,9rem)] leading-[0.9] tracking-tight text-[#1A1614] mb-5">
              The<br />Writers<br />Room
            </h1>

            <ThickRule className="w-48 md:w-72 mx-auto mb-5 border-[#1A1614]" />

            <p className="font-serif text-[clamp(0.85rem,1.8vw,1.15rem)] text-[#1A1614]/80 mb-2" style={{ fontVariant: "small-caps", letterSpacing: "0.04em" }}>
              Pitch. Write. Edit. Publish.
            </p>
            <p className="font-serif font-bold text-[clamp(1rem,2vw,1.35rem)] text-[#1A1614] mb-10" style={{ fontVariant: "small-caps", letterSpacing: "0.04em" }}>
              Together.
            </p>

            {freeSlots !== null && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="mb-5"
              >
                {freeSlots > 0 ? (
                  <div
                    className="inline-flex flex-col sm:flex-row items-center gap-4 border border-[#E8B84B]/30 bg-[#1A1614]/80 backdrop-blur-sm px-7 py-5 cursor-pointer"
                    onClick={openAuthModal}
                  >
                    <span className="text-[9px] uppercase tracking-[0.24em] font-bold text-[#1A1614] bg-[#E8B84B] px-3 py-1 shrink-0">Beta</span>
                    <div className="sm:border-l sm:border-[#F9F6EE]/15 sm:pl-4 text-center sm:text-left">
                      <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#E8B84B] mb-1">
                        We're in beta — testing the platform with early members
                      </p>
                      <p className="text-[11px] text-[#F9F6EE]/55 leading-relaxed">
                        To thank you for joining early, new signups receive a free Pro account while
                        {" "}<span className="text-[#E8B84B] font-semibold">{freeSlots} of 300 spots remain</span>.
                        No catch, no credit card.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-3 border border-[#F9F6EE]/15 px-6 py-3">
                    <span className="text-[9px] uppercase tracking-[0.24em] font-bold text-[#1A1614] bg-[#E8B84B] px-3 py-1">Beta</span>
                    <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#F9F6EE]/50">Free Pro accounts fully claimed — paid plans coming soon</p>
                  </div>
                )}
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={openAuthModal}
                className="flex items-center gap-2 px-8 py-3.5 bg-[#D94B1F] text-[#F9F6EE] text-sm font-bold uppercase tracking-[0.12em] hover:bg-[#C23A14] transition-colors"
              >
                Start for free <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Bottom teal accent */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#FDDCB5]" />
        </div>

        {/* Editorial standfirst strip */}
        <div className="bg-[#F9F6EE] border-b-2 border-[#1A1614] px-6 md:px-14 py-6 text-center">
          <p className="text-base md:text-lg text-[#1A1614] max-w-3xl mx-auto leading-relaxed font-serif font-semibold">
            Every manuscript deserves its own room. Each project you create becomes your Writing Room — a private creative space built around that specific work, filled with exactly the contributors it needs, on your terms. Collaborate here, then publish within the platform or export to Amazon, Apple Books, Kobo, and beyond.
          </p>
        </div>
      </section>

      {/* ── ILLUSTRATION ── */}
      <section className="bg-[#F9F6EE] border-b-2 border-[#1A1614]">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative w-full overflow-hidden"
        >
          <img
            src={typewriterRoom}
            alt="A writers room — collaborators gathered around a table"
            className="w-full object-cover"
            style={{ maxHeight: "520px", objectPosition: "center 30%" }}
          />
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-6 md:px-14 bg-[#F9F6EE]">
        <div className="max-w-5xl mx-auto">
          <motion.div {...inView()} className="mb-12">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">The Process</p>
            <ThickRule className="mb-2" />
            <h2 className="font-serif font-bold text-4xl md:text-5xl text-[#1A1614] mt-4">How it works</h2>
            <Rule className="mt-4" />
          </motion.div>

          <div className="grid md:grid-cols-4 gap-0 border-l-2 border-[#1A1614] md:border-l-0 md:border-t-2">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                {...inView(i * 0.1)}
                className="pl-6 md:pl-0 md:pt-6 md:pr-6 py-6 md:py-0 border-b-2 md:border-b-0 md:border-r-2 border-[#1A1614] last:border-0"
              >
                <span className="font-serif font-bold text-4xl text-[#E8B84B] leading-none block mb-3">{step.n}</span>
                <h3 className="font-bold text-[#1A1614] uppercase tracking-[0.1em] text-sm mb-2">{step.title}</h3>
                <p className="text-sm text-[#7A6B5E] leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 px-6 md:px-14 bg-[#1A1614] text-[#F9F6EE]">
        <div className="max-w-5xl mx-auto">
          <motion.div {...inView()} className="mb-12">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#E8B84B] mb-2">Features</p>
            <div className="border-t-2 border-[#F9F6EE]/20 mb-2" />
            <h2 className="font-serif font-bold text-4xl md:text-5xl text-[#F9F6EE] mt-4">Everything you need</h2>
            <div className="border-t border-[#F9F6EE]/20 mt-4" />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-0">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...inView(i * 0.07)}
                className="p-6 md:p-10 border border-[#F9F6EE]/10 hover:bg-[#F9F6EE]/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-sm bg-[#FDDCB5]/20 text-[#FDDCB5] flex items-center justify-center mb-4 group-hover:bg-[#E8B84B]/20 group-hover:text-[#E8B84B] transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-bold text-[#F9F6EE] uppercase tracking-[0.08em] text-xs mb-2">{f.title}</h3>
                <p className="text-sm text-[#F9F6EE]/60 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR AUTHORS / FOR CONTRIBUTORS ── */}
      <section className="py-20 px-6 md:px-14 bg-[#F9F6EE]">
        <div className="max-w-5xl mx-auto">
          <motion.div {...inView()} className="mb-12">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">Who it's for</p>
            <ThickRule className="mb-2" />
            <Rule className="mt-0.5" />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-0 border-2 border-[#1A1614]">
            {/* Authors */}
            <motion.div
              {...inView(0.05)}
              className="p-8 md:p-10 border-b-2 md:border-b-0 md:border-r-2 border-[#1A1614]"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#FDDCB5] flex items-center justify-center text-[#1A1614]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.22em] font-bold text-[#7A6B5E]">For the</p>
                  <h3 className="font-serif font-bold text-2xl text-[#1A1614] leading-none">Author</h3>
                </div>
              </div>
              <p className="text-sm text-[#7A6B5E] mb-6 leading-relaxed font-serif italic">
                Build the Writing Room your manuscript deserves — invite exactly the right people, on your terms, and keep full ownership throughout.
              </p>
              <ul className="space-y-3 mb-8">
                {FOR_AUTHORS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#1A1614]">
                    <Check className="w-4 h-4 text-[#FDDCB5] shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={openAuthModal}
                className="w-full py-3 bg-[#1A1614] text-[#F9F6EE] font-bold text-xs uppercase tracking-[0.14em] hover:bg-[#FDDCB5] transition-colors"
              >
                Start your manuscript
              </button>
            </motion.div>

            {/* Contributors */}
            <motion.div
              {...inView(0.12)}
              className="p-8 md:p-10 bg-[#E8B84B]"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#1A1614] flex items-center justify-center text-[#E8B84B]">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.22em] font-bold text-[#1A1614]/60">For the</p>
                  <h3 className="font-serif font-bold text-2xl text-[#1A1614] leading-none">Contributor</h3>
                </div>
              </div>
              <p className="text-sm text-[#1A1614]/70 mb-6 leading-relaxed font-serif italic">
                Find Writing Rooms that match your editorial instincts — and build a reputation as the collaborator authors come back to.
              </p>
              <ul className="space-y-3 mb-8">
                {FOR_CONTRIBUTORS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#1A1614]">
                    <Check className="w-4 h-4 text-[#1A1614]/60 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={openAuthModal}
                className="w-full py-3 border-2 border-[#1A1614] text-[#1A1614] font-bold text-xs uppercase tracking-[0.14em] hover:bg-[#1A1614] hover:text-[#E8B84B] transition-colors"
              >
                Join as a contributor
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 px-6 md:px-14 bg-[#FDDCB5] text-[#1A1614]">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...inView()}>
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#1A1614]/60 mb-4">Join Today</p>
            <div className="border-t-2 border-[#1A1614]/30 mb-6" />
            <h2 className="font-serif font-bold text-5xl md:text-6xl text-[#1A1614] mb-4 leading-tight">
              Ready to open<br />the room?
            </h2>
            <div className="border-t border-[#1A1614]/30 mb-6" />
            <p className="text-[#1A1614]/70 text-base mb-10 font-serif italic">
              Free to join. No credit card. Start writing or uploading and collaborate today.
            </p>
            <button
              onClick={openAuthModal}
              className="inline-flex items-center gap-3 px-10 py-4 bg-[#D94B1F] text-[#F9F6EE] font-bold text-sm uppercase tracking-[0.14em] hover:bg-[#C23A14] transition-colors"
            >
              Get started — it's free <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#1A1614] text-[#F9F6EE]/60 px-6 md:px-14 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[9px] uppercase tracking-[0.22em] font-bold text-[#E8B84B] mb-1">The Writers Room</p>
              <p className="font-serif font-bold text-xl text-[#F9F6EE]">The platform for serious<br />collaborative writing.</p>
            </div>
            <button
              onClick={openAuthModal}
              className="px-6 py-2.5 border border-[#F9F6EE]/20 text-[#F9F6EE] text-xs uppercase tracking-[0.14em] font-bold hover:border-[#E8B84B] hover:text-[#E8B84B] transition-colors"
            >
              Get started
            </button>
          </div>
          <div className="border-t border-[#F9F6EE]/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs">
            <span className="uppercase tracking-[0.12em] text-[10px]">© {new Date().getFullYear()} The Writers Room — Building Ink Ltd</span>
            <a href="mailto:info@jointhewritersroom.com" className="uppercase tracking-[0.12em] text-[10px] hover:text-[#E8B84B] transition-colors">info@jointhewritersroom.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
