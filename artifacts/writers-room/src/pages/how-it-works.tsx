import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  ArrowRight, PenTool, Users, MessageSquare, Star, BookOpen,
  Check, Lightbulb, Award, Shield, Heart, Globe, ArrowLeft,
  TrendingUp, Search, Mail, Handshake, Quote,
  Pencil, Eye, BadgeCheck, Crown, Repeat2, BookMarked, Droplets,
} from "lucide-react";
import { SEO, SOFTWARE_APP_SCHEMA } from "@/components/seo";

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: "easeOut" as const },
});

const Rule = ({ className = "" }: { className?: string }) => (
  <div className={`border-t border-[#1A1614]/20 ${className}`} />
);
const ThickRule = ({ className = "" }: { className?: string }) => (
  <div className={`border-t-2 border-[#1A1614] ${className}`} />
);

const COMMUNITY_VALUES = [
  {
    icon: Heart,
    title: "Built on genuine collaboration",
    body: "The Writers Room is not a marketplace. There are no fees, no bidding, no gigs. Authors invite contributors whose taste and background genuinely align with their work, and contributors choose projects that excite them. Every interaction is rooted in a shared love of storytelling.",
  },
  {
    icon: Handshake,
    title: "Mutual respect, not extraction",
    body: "Contributors are credited, certified, and recognised — not anonymous labour. When a suggestion is accepted, it becomes part of that contributor's permanent track record on the platform. Reputation is earned, not bought.",
  },
  {
    icon: TrendingUp,
    title: "A place to grow",
    body: "Whether you are a debut novelist or an experienced screenwriter, the community gives you access to perspectives you would never get alone. Collaborators push your work further. Your acceptance rate tells you who your strongest creative partners are.",
  },
];

const AUTHOR_STEPS = [
  {
    n: "01",
    title: "Start or upload your manuscript",
    body: "Write from scratch inside The Writers Room, or bring existing work in any format — PDF, DOCX, TXT, Markdown, RTF. Either way, it lands in a clean, distraction-free reading view your collaborators will love.",
  },
  {
    n: "02",
    title: "Set up your Writing Room",
    body: "Choose how many collaborators you want, what they can see (full manuscript or synopsis only), and whether you want them to sign an IP agreement before entering. You decide the terms — this is your room.",
  },
  {
    n: "03",
    title: "Open the door",
    body: "Browse contributor profiles by genre interest, media taste, and track record. Send targeted invites to the people most likely to elevate your specific work — or post a Pitch and let contributors apply. Every person who enters your Writing Room is there because you chose them.",
  },
  {
    n: "04",
    title: "Review suggestions inline",
    body: "Every collaborator suggestion arrives as a tracked change — the original passage crossed out, the proposed replacement shown alongside it. Accept, discard, or discuss with a single click.",
  },
  {
    n: "05",
    title: "Publish on your terms",
    body: "When you're ready, publish within The Writers Room — where your work joins a growing library of readable, discoverable projects — or export a formatted file ready for Amazon KDP, Apple Books, Kobo, and other platforms. Fine-grained visibility controls and public feedback settings apply either way.",
  },
];

const CONTRIBUTOR_STEPS = [
  {
    n: "01",
    title: "Build your profile",
    body: "Set your genre interests, favourite media, and preferred formats. A strong profile means the right authors find you first — people who are writing the kind of work you genuinely want to read.",
  },
  {
    n: "02",
    title: "Discover projects or respond to pitches",
    body: "Browse the Pitches board for authors actively seeking collaborators, or explore published work in the Discover feed. When something catches your eye, send a join request with a short note about why you are the right fit.",
  },
  {
    n: "03",
    title: "Read and highlight",
    body: "Once accepted, you read the manuscript in The Writers Room's clean reading view. Highlight any passage that you think could be stronger, and propose your alternative — with an optional comment explaining your reasoning.",
  },
  {
    n: "04",
    title: "Build your track record — and earn Ink",
    body: "Every accepted suggestion adds to your public track record. Authors can see your acceptance rate, the genres you have worked in, and the projects you have contributed to. And every contribution earns Ink — a reputational currency you accumulate over time and can redeem for subscription discounts, merchandise, and exclusive creative services.",
  },
  {
    n: "05",
    title: "Download your certificate",
    body: "For every project you contribute to, you can download a contribution certificate — a signed PDF listing your accepted suggestions, timestamps, and a cryptographic fingerprint of the manuscript. Proof of your creative work, forever.",
  },
];

const COMMUNITY_FEATURES = [
  {
    icon: Search,
    label: "Pitches board",
    desc: "Authors post Pitches when they are actively looking for collaborators. Each pitch describes the project, the kind of help they need, and the contributor profile they are after. Browse, read, and apply in seconds.",
  },
  {
    icon: Globe,
    label: "Discover feed",
    desc: "A curated feed of publicly published projects. Read work in your favourite genres, leave feedback, and discover authors whose voice resonates with you — before they even invite you.",
  },
  {
    icon: Mail,
    label: "Direct messaging",
    desc: "Communicate directly with authors or contributors. Discuss a suggestion in more detail, ask a question about the project, or simply introduce yourself. Every collaboration starts with a conversation.",
  },
  {
    icon: Star,
    label: "Contribution leaderboard",
    desc: "Each project has a leaderboard showing which contributors have had the most suggestions accepted. It creates a healthy, transparent record of who is doing the most to move the manuscript forward.",
  },
  {
    icon: Shield,
    label: "IP protection built in",
    desc: "Authors can require contributors to sign an IP agreement before joining. Content is fingerprinted with SHA-256 on demand. Access logs record every view. The community runs on trust — and the tools to back it up.",
  },
  {
    icon: Award,
    label: "Contribution certificates",
    desc: "Contributors can download a PDF certificate for every project — a permanent record of their creative contributions with a cryptographic content fingerprint. Recognition that exists outside the platform.",
  },
];

const TESTIMONIAL_PAIRS = [
  {
    author: {
      quote: "I had three beta readers before. Now I have eight collaborators who have collectively improved almost every chapter. The diff view means I can see every change at a glance and decide in seconds.",
      name: "Fiction author",
      role: "Novel in progress",
    },
    contributor: {
      quote: "I've always wanted to get closer to the editing process, but there was never a real way in. The Writers Room gave me a place to show what I can do, and now I have an acceptance rate I'm genuinely proud of.",
      name: "Literary contributor",
      role: "47 accepted suggestions",
    },
  },
];

export default function HowItWorks() {
  const { openAuthModal, user } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#F9F6EE] text-[#1A1614] overflow-x-hidden font-sans">
      <SEO
        title="How It Works — Collaborative Writing & Editing"
        description="Learn how The Writers Room connects authors with genre-matched contributors for inline editing, IP-protected collaboration, reputation tracking, and multi-platform publishing."
        canonicalPath="/how-it-works"
        schema={SOFTWARE_APP_SCHEMA}
      />

      {/* ── NAV ── */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#F9F6EE]/95 backdrop-blur-sm">
        <div className="border-b border-[#1A1614]/15 px-6 md:px-14 py-1.5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.22em] text-[#7A6B5E] font-semibold">Collaborative Writing Platform</span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-[#7A6B5E] font-semibold">Free to join</span>
        </div>
        <div className="px-6 md:px-14 py-3 text-center">
          <button onClick={() => navigate("/")} className="font-serif font-bold text-2xl md:text-3xl tracking-[0.06em] text-[#1A1614] hover:text-[#E8B84B] transition-colors">The Writers Room</button>
        </div>
        <ThickRule />
        <nav aria-label="Main navigation" className="px-6 md:px-14 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate("/how-it-works")} className="text-[11px] uppercase tracking-[0.16em] text-[#E8B84B] font-bold border-b border-[#E8B84B]">How it works</button>
            <button onClick={() => navigate("/pricing")} className="text-[11px] uppercase tracking-[0.16em] text-[#1A1614] font-semibold hover:text-[#E8B84B] transition-colors">Pricing</button>
          </div>
          <div className="flex items-center gap-4">
            {!user && (
              <>
                <button onClick={openAuthModal} className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#1A1614] hover:text-[#E8B84B] transition-colors">Sign in</button>
                <button onClick={openAuthModal} className="px-4 py-1.5 bg-[#1A1614] text-[#F9F6EE] text-[11px] uppercase tracking-[0.16em] font-bold hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors">Join free</button>
              </>
            )}
            {user && (
              <button onClick={() => navigate("/")} className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#1A1614] hover:text-[#E8B84B] transition-colors">Dashboard</button>
            )}
          </div>
        </nav>
      </header>

      <main id="main-content">
      {/* ── HERO ── */}
      <section className="pt-44 pb-24 bg-[#1A1614] min-h-[600px]">
        <div className="px-6 md:px-14 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#E8B84B] mb-4">The Community</p>
            <ThickRule className="border-[#F9F6EE]/20 w-32 mx-auto mb-6" />
            <h1 className="font-serif font-bold text-[clamp(2.6rem,7vw,5.5rem)] leading-[1.0] text-[#F9F6EE] mb-6">
              How The Writers Room<br />actually works
            </h1>
            <ThickRule className="border-[#F9F6EE]/20 w-32 mx-auto mb-8" />
            <p className="font-serif italic text-[#F9F6EE]/70 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              A community of writers and editors who make each other's work genuinely better. All human. No AI.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Standfirst */}
      <div className="bg-[#F9F6EE] px-6 md:px-14 py-5 text-center">
        <p className="text-base md:text-lg text-[#1A1614] max-w-3xl mx-auto leading-relaxed font-serif">
          Think of each project as a room you build around your manuscript — your Writing Room. You decide who enters, what they can see, and what they're there to do. Contributors earn their place through quality, not volume. The result is a creative space that exists entirely to serve your work.
        </p>
      </div>

      {/* ── COMMUNITY VALUES ── */}
      <section className="pt-12 pb-20 px-6 md:px-14 bg-[#F9F6EE]">
        <div className="max-w-5xl mx-auto">
          <motion.div {...inView()} className="mb-12">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">What we believe</p>
            <ThickRule className="mb-2" />
            <h2 className="font-serif font-bold text-4xl md:text-5xl text-[#1A1614] mt-4">Community first</h2>
            <Rule className="mt-4" />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-0 border-2 border-[#1A1614]">
            {COMMUNITY_VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                {...inView(i * 0.1)}
                className="p-8 border-b-2 md:border-b-0 md:border-r-2 border-[#1A1614] last:border-0 flex flex-col gap-4"
              >
                <div className="w-10 h-10 bg-[#E8B84B]/20 flex items-center justify-center text-[#1A1614]">
                  <v.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#1A1614] text-sm uppercase tracking-[0.1em]">{v.title}</h3>
                <p className="text-sm text-[#7A6B5E] leading-relaxed">{v.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR AUTHORS ── */}
      <section className="py-20 px-6 md:px-14 bg-[#FDDCB5]">
        <div className="max-w-5xl mx-auto">
          <motion.div {...inView()} className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#1A1614] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#E8B84B]" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.22em] font-bold text-[#1A1614]/50">If you are an</p>
                <h2 className="font-serif font-bold text-3xl md:text-4xl text-[#1A1614] leading-none">Author</h2>
              </div>
            </div>
            <ThickRule className="border-[#1A1614]/30 mb-2 mt-4" />
            <p className="font-serif italic text-[#1A1614]/70 text-base mt-4 max-w-2xl">
              Your manuscript stays yours. Your Writing Room is yours to build — invite exactly the right people, set your terms, and stay in control at every step.
            </p>
            <Rule className="mt-4 border-[#1A1614]/20" />
          </motion.div>

          <div className="space-y-0">
            {AUTHOR_STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                {...inView(i * 0.08)}
                className="flex gap-6 md:gap-10 items-start border-b border-[#1A1614]/20 py-7 last:border-0"
              >
                <span className="font-serif font-bold text-4xl text-[#1A1614]/25 leading-none shrink-0 w-10 text-right">{step.n}</span>
                <div>
                  <h3 className="font-bold text-[#1A1614] uppercase tracking-[0.1em] text-sm mb-2">{step.title}</h3>
                  <p className="text-sm text-[#1A1614]/65 leading-relaxed max-w-xl">{step.body}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div {...inView(0.2)} className="mt-10">
            <button
              onClick={openAuthModal}
              className="flex items-center gap-2 px-8 py-3.5 bg-[#1A1614] text-[#F9F6EE] text-sm font-bold uppercase tracking-[0.12em] hover:bg-[#D94B1F] transition-colors"
            >
              Start your manuscript <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── FOR CONTRIBUTORS ── */}
      <section className="py-20 px-6 md:px-14 bg-[#1A1614]">
        <div className="max-w-5xl mx-auto">
          <motion.div {...inView()} className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#E8B84B] flex items-center justify-center">
                <Star className="w-5 h-5 text-[#1A1614]" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.22em] font-bold text-[#F9F6EE]/40">If you are a</p>
                <h2 className="font-serif font-bold text-3xl md:text-4xl text-[#F9F6EE] leading-none">Contributor</h2>
              </div>
            </div>
            <div className="border-t-2 border-[#F9F6EE]/20 mt-4 mb-2" />
            <p className="font-serif italic text-[#F9F6EE]/60 text-base mt-4 max-w-2xl">
              Every acceptance is a recognition of your editorial instinct. Build a track record that speaks for itself.
            </p>
            <div className="border-t border-[#F9F6EE]/10 mt-4" />
          </motion.div>

          <div className="space-y-0">
            {CONTRIBUTOR_STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                {...inView(i * 0.08)}
                className="flex gap-6 md:gap-10 items-start border-b border-[#F9F6EE]/10 py-7 last:border-0"
              >
                <span className="font-serif font-bold text-4xl text-[#E8B84B]/40 leading-none shrink-0 w-10 text-right">{step.n}</span>
                <div>
                  <h3 className="font-bold text-[#F9F6EE] uppercase tracking-[0.1em] text-sm mb-2">{step.title}</h3>
                  <p className="text-sm text-[#F9F6EE]/55 leading-relaxed max-w-xl">{step.body}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div {...inView(0.2)} className="mt-10">
            <button
              onClick={openAuthModal}
              className="flex items-center gap-2 px-8 py-3.5 bg-[#E8B84B] text-[#1A1614] text-sm font-bold uppercase tracking-[0.12em] hover:bg-[#FDDCB5] transition-colors"
            >
              Join as a contributor <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── REPUTATION & ACHIEVEMENTS ── */}
      <section className="py-20 px-6 md:px-14 bg-[#F9F6EE] border-t-2 border-[#1A1614]">
        <div className="max-w-5xl mx-auto">
          <motion.div {...inView()} className="mb-12">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">Standing in the community</p>
            <ThickRule className="mb-2" />
            <h2 className="font-serif font-bold text-4xl md:text-5xl text-[#1A1614] mt-4">Reputation, not scores</h2>
            <Rule className="mt-4" />
            <p className="text-sm text-[#7A6B5E] mt-6 max-w-2xl leading-relaxed">
              The Writers Room does not have points, leaderboards, or engagement metrics. What we track instead is quality — the kind of editorial instinct that makes a manuscript genuinely better. Achievements are earned, not collected.
            </p>
          </motion.div>

          {/* Achievement grid */}
          <div className="grid md:grid-cols-2 gap-0 border-2 border-[#1A1614] mb-12">
            {[
              { icon: Pencil,    tier: "Bronze",   label: "First Mark",       desc: "Your first suggestion accepted by an author. The beginning of a track record.", tierColor: "text-amber-700 bg-amber-50 border-amber-200" },
              { icon: Eye,       tier: "Silver",   label: "Sharp Eye",         desc: "60% or above acceptance rate across 5 or more suggestions. You are consistently improving manuscripts.", tierColor: "text-slate-600 bg-slate-50 border-slate-200" },
              { icon: Repeat2,   tier: "Silver",   label: "Consistent Voice",  desc: "Accepted suggestions across 3 or more different projects. Your editorial judgement travels.", tierColor: "text-slate-600 bg-slate-50 border-slate-200" },
              { icon: Users,     tier: "Bronze",   label: "Collaborator",      desc: "Joined as an active collaborator on 3 or more projects. You are a trusted part of multiple creative teams.", tierColor: "text-amber-700 bg-amber-50 border-amber-200" },
              { icon: BadgeCheck,tier: "Gold",     label: "Trusted Voice",     desc: "75% or above acceptance rate across 10 or more suggestions. Authors know your suggestions are worth reading.", tierColor: "text-yellow-700 bg-yellow-50 border-yellow-300" },
              { icon: Star,      tier: "Gold",     label: "Sought After",      desc: "Active collaborator on 5 or more projects. Authors compete for your attention.", tierColor: "text-yellow-700 bg-yellow-50 border-yellow-300" },
              { icon: BookOpen,  tier: "Gold",     label: "Published Credit",  desc: "Your contributions appear in at least one published manuscript. Your words are in the world.", tierColor: "text-yellow-700 bg-yellow-50 border-yellow-300" },
              { icon: Crown,     tier: "Platinum", label: "Master Editor",     desc: "90% or above acceptance rate across 10 or more suggestions. The highest standard of editorial quality.", tierColor: "text-[#F9F6EE] bg-[#1A1614] border-[#E8B84B]" },
            ].map((a, i) => (
              <motion.div
                key={a.label}
                {...inView(i * 0.06)}
                className="flex gap-5 p-6 border-b border-r border-[#1A1614]/12 last:border-b-0 odd:border-r-2 even:border-r-0 [&:nth-last-child(2)]:border-b-0 hover:bg-[#F9F6EE] transition-colors group"
              >
                <div className="w-36 shrink-0 mt-0.5">
                  <span className={`inline-flex w-full items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] border ${a.tierColor}`}>
                    <a.icon className="w-3 h-3 shrink-0" />
                    {a.label}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] mb-1">{a.tier}</p>
                  <p className="text-sm text-[#1A1614]/70 leading-relaxed">{a.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Reputation score callout */}
          <motion.div {...inView(0.1)} className="grid md:grid-cols-2 gap-0 border-2 border-[#1A1614]">
            <div className="p-8 border-b-2 md:border-b-0 md:border-r-2 border-[#1A1614]">
              <div className="w-9 h-9 bg-[#E8B84B] flex items-center justify-center mb-5">
                <TrendingUp className="w-4 h-4 text-[#1A1614]" />
              </div>
              <h3 className="font-bold text-[#1A1614] uppercase tracking-[0.1em] text-sm mb-3">Your reputation score</h3>
              <p className="text-sm text-[#7A6B5E] leading-relaxed">
                Every contributor profile carries a reputation score from 0–100, computed from acceptance rate, the number of different projects you have contributed to, and whether any of those projects reached publication. It rises as your track record deepens — and it cannot be gamed by volume alone.
              </p>
            </div>
            <div className="p-8 bg-[#1A1614]">
              <div className="w-9 h-9 bg-[#E8B84B]/20 flex items-center justify-center mb-5">
                <BookMarked className="w-4 h-4 text-[#E8B84B]" />
              </div>
              <h3 className="font-bold text-[#F9F6EE] uppercase tracking-[0.1em] text-sm mb-3">Why it matters for authors</h3>
              <p className="text-sm text-[#F9F6EE]/60 leading-relaxed">
                When an author browses for collaborators, reputation achievements are shown directly on contributor profiles. A contributor with a <span className="text-[#E8B84B] font-semibold">Trusted Voice</span> badge and a <span className="text-[#E8B84B] font-semibold">Published Credit</span> is not self-described — those achievements are independently verified by the platform from real acceptance data.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── INK ── */}
      <section className="py-20 px-6 md:px-14 bg-[#E8B84B] border-t-2 border-[#1A1614]">
        <div className="max-w-5xl mx-auto">
          <motion.div {...inView()} className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#1A1614] flex items-center justify-center">
                <Droplets className="w-5 h-5 text-[#E8B84B]" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.22em] font-bold text-[#1A1614]/50">Reputational currency</p>
                <h2 className="font-serif font-bold text-3xl md:text-4xl text-[#1A1614] leading-none">Building Ink</h2>
              </div>
            </div>
            <div className="border-t-2 border-[#1A1614]/30 mt-4 mb-2" />
            <p className="font-serif italic text-[#1A1614]/70 text-base mt-4 max-w-2xl">
              Ink is not a points system. It is a ledger of genuine creative contribution — a currency that grows with you and opens doors as the platform grows.
            </p>
            <div className="border-t border-[#1A1614]/20 mt-4" />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-0 border-2 border-[#1A1614]">
            {/* How you earn */}
            <motion.div {...inView(0.05)} className="p-8 border-b-2 md:border-b-0 md:border-r-2 border-[#1A1614]">
              <h3 className="font-bold text-[#1A1614] uppercase tracking-[0.1em] text-sm mb-5">How you earn Ink</h3>
              <div className="space-y-4">
                {[
                  { action: "Submit a suggestion", amount: "+2", note: "Every time you propose an edit" },
                  { action: "Suggestion accepted", amount: "+10", note: "When an author accepts your edit" },
                  { action: "Joined as collaborator", amount: "+5", note: "Each new project you join" },
                  { action: "Published project credit", amount: "+25", note: "When a project you worked on is published" },
                  { action: "Referral — new signup", amount: "+15", note: "Someone joins using your referral code" },
                  { action: "Referral — Pro upgrade", amount: "+50", note: "A referred member upgrades to a paid plan" },
                  { action: "Collaboration invite accepted", amount: "+5", note: "A collaborator you invite joins your project" },
                  { action: "Pro collaborator bonus", amount: "+15", note: "Bonus when the invited collaborator is a Pro member" },
                ].map((row) => (
                  <div key={row.action} className="flex items-center justify-between gap-4 py-2.5 border-b border-[#1A1614]/15 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-[#1A1614]">{row.action}</p>
                      <p className="text-[11px] text-[#1A1614]/55">{row.note}</p>
                    </div>
                    <span className="font-serif font-bold text-2xl text-[#1A1614] shrink-0">{row.amount}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* What you can do with it */}
            <motion.div {...inView(0.1)} className="p-8 bg-[#1A1614]">
              <h3 className="font-bold text-[#F9F6EE] uppercase tracking-[0.1em] text-sm mb-5">What Ink unlocks</h3>
              <div className="space-y-5">
                {[
                  { label: "Subscription discounts", desc: "Redeem Ink against your monthly or annual subscription — the more you contribute, the less you pay.", soon: false },
                  { label: "Merchandise", desc: "The Writers Room branded items for contributors who have earned the right to wear the badge.", soon: true },
                  { label: "Book printing", desc: "Discounts on professional print runs through our partner services.", soon: true },
                  { label: "Cover design & editing", desc: "Redeemable against professional cover design and copy-editing services.", soon: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 border-b border-[#F9F6EE]/10 pb-4 last:border-0 last:pb-0">
                    <div className="w-1.5 h-1.5 bg-[#E8B84B] shrink-0 mt-1.5" />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-[#F9F6EE]">{item.label}</p>
                        {item.soon && (
                          <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 bg-[#E8B84B]/15 text-[#E8B84B] border border-[#E8B84B]/30">Coming soon</span>
                        )}
                      </div>
                      <p className="text-xs text-[#F9F6EE]/50 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── THE SUGGESTION SYSTEM ── */}
      <section className="py-20 px-6 md:px-14 bg-[#F9F6EE]">
        <div className="max-w-5xl mx-auto">
          <motion.div {...inView()} className="mb-12">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">How the editing works</p>
            <ThickRule className="mb-2" />
            <h2 className="font-serif font-bold text-4xl md:text-5xl text-[#1A1614] mt-4">The suggestion system</h2>
            <Rule className="mt-4" />
            <p className="text-sm text-[#7A6B5E] mt-6 max-w-2xl leading-relaxed">
              At the heart of The Writers Room is a tracked-change system designed for fiction and scripts, not spreadsheets or code. Here's how a suggestion travels from idea to accepted edit.
            </p>
          </motion.div>

          {/* Visual flow */}
          <div className="grid md:grid-cols-4 gap-0 border-2 border-[#1A1614] mb-12">
            {[
              { icon: PenTool, label: "Highlight", desc: "A contributor highlights any passage in the manuscript — a sentence, a paragraph, a line of dialogue." },
              { icon: Lightbulb, label: "Propose", desc: "They write their alternative version and optionally add a comment explaining their reasoning." },
              { icon: MessageSquare, label: "Review", desc: "The author sees the original and proposed text side by side as a clean diff, with the contributor's note." },
              { icon: Check, label: "Decide", desc: "Accept to apply the change, or discard it. Either way, the contributor's record is updated instantly." },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                {...inView(i * 0.1)}
                className="p-6 border-b-2 md:border-b-0 md:border-r-2 border-[#1A1614] last:border-0"
              >
                <div className="w-9 h-9 bg-[#E8B84B] flex items-center justify-center mb-4">
                  <s.icon className="w-4 h-4 text-[#1A1614]" />
                </div>
                <h3 className="font-bold text-[#1A1614] uppercase tracking-[0.1em] text-xs mb-2">{s.label}</h3>
                <p className="text-xs text-[#7A6B5E] leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Example callout */}
          <motion.div {...inView(0.1)} className="border-l-4 border-[#E8B84B] bg-[#E8B84B]/8 p-6 md:p-8">
            <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#7A6B5E] mb-4">An example suggestion</p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#7A6B5E] mb-1">Original</p>
                <p className="text-sm text-[#C0392B] line-through decoration-[#C0392B]/60 font-serif leading-relaxed bg-red-50 px-3 py-2 rounded">
                  He walked across the room and sat down at the table.
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#7A6B5E] mb-1">Suggested</p>
                <p className="text-sm text-[#1A6B3A] font-serif leading-relaxed bg-emerald-50 px-3 py-2 rounded">
                  He crossed to the table without looking at her.
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#7A6B5E] mb-1">Contributor's note</p>
                <p className="text-sm text-[#7A6B5E] font-serif italic">"The original doesn't do any dramatic work. Adding the detail about her makes the tension visible without stating it."</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── COMMUNITY FEATURES ── */}
      <section className="py-20 px-6 md:px-14 bg-[#1A1614] text-[#F9F6EE]">
        <div className="max-w-5xl mx-auto">
          <motion.div {...inView()} className="mb-12">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#E8B84B] mb-2">The wider platform</p>
            <div className="border-t-2 border-[#F9F6EE]/20 mb-2" />
            <h2 className="font-serif font-bold text-4xl md:text-5xl text-[#F9F6EE] mt-4">Beyond the manuscript</h2>
            <div className="border-t border-[#F9F6EE]/20 mt-4" />
            <p className="text-sm text-[#F9F6EE]/55 mt-6 max-w-2xl leading-relaxed">
              The Writers Room is more than an editing tool. It is a community with its own rhythms — pitches, discovery, reputation, and recognition.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-0">
            {COMMUNITY_FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                {...inView(i * 0.07)}
                className="p-6 border border-[#F9F6EE]/10 hover:bg-[#F9F6EE]/5 transition-colors group"
              >
                <div className="w-8 h-8 bg-[#E8B84B]/15 text-[#E8B84B] flex items-center justify-center mb-4 group-hover:bg-[#E8B84B]/25 transition-colors">
                  <f.icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#F9F6EE] uppercase tracking-[0.08em] text-xs mb-2">{f.label}</h3>
                <p className="text-sm text-[#F9F6EE]/55 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-6 md:px-14 bg-[#F9F6EE]">
        <div className="max-w-5xl mx-auto">
          <motion.div {...inView()} className="mb-12">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">From the community</p>
            <ThickRule className="mb-2" />
            <h2 className="font-serif font-bold text-4xl md:text-5xl text-[#1A1614] mt-4">In their own words</h2>
            <Rule className="mt-4" />
          </motion.div>

          {TESTIMONIAL_PAIRS.map((pair, i) => (
            <motion.div key={i} {...inView(i * 0.1)} className="grid md:grid-cols-2 gap-0 border-2 border-[#1A1614] mb-8">
              <div className="p-8 md:p-10 border-b-2 md:border-b-0 md:border-r-2 border-[#1A1614]">
                <Quote className="w-6 h-6 text-[#E8B84B] mb-4" />
                <p className="font-serif italic text-[#1A1614] text-base leading-relaxed mb-6">"{pair.author.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#FDDCB5] flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-[#1A1614]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1A1614] uppercase tracking-[0.1em]">{pair.author.name}</p>
                    <p className="text-[11px] text-[#7A6B5E]">{pair.author.role}</p>
                  </div>
                </div>
              </div>
              <div className="p-8 md:p-10 bg-[#E8B84B]">
                <Quote className="w-6 h-6 text-[#1A1614]/40 mb-4" />
                <p className="font-serif italic text-[#1A1614] text-base leading-relaxed mb-6">"{pair.contributor.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1A1614] flex items-center justify-center">
                    <Star className="w-4 h-4 text-[#E8B84B]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1A1614] uppercase tracking-[0.1em]">{pair.contributor.name}</p>
                    <p className="text-[11px] text-[#1A1614]/60">{pair.contributor.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-6 md:px-14 bg-[#F9F6EE] border-t-2 border-[#1A1614]">
        <div className="max-w-3xl mx-auto">
          <motion.div {...inView()} className="mb-12">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">Common questions</p>
            <ThickRule className="mb-2" />
            <h2 className="font-serif font-bold text-4xl text-[#1A1614] mt-4">Good to know</h2>
            <Rule className="mt-4" />
          </motion.div>

          {[
            {
              q: "Is it free to join?",
              a: "Yes. The Writers Room is free to join for both authors and contributors. Every author account includes one full project with no restrictions. Contributors are always completely free — there is no upgrade path needed. Authors who want to run more than one project simultaneously can upgrade to Pro for £5 a month or £50 a year."
            },
            {
              q: "Who owns my manuscript?",
              a: "You do, completely. Adding your work to The Writers Room — whether written here or uploaded — does not transfer any rights. We store it so your collaborators can read it. You can delete your project at any time and the content is permanently removed."
            },
            {
              q: "What happens if a contributor's suggestion is accepted — do they own part of it?",
              a: "No. Contributions are made under the project's IP agreement, which authors can set before collaborators join. The default agreement makes clear that accepted suggestions become part of the author's work under the author's copyright. Contribution certificates record what was contributed, but they do not confer ownership."
            },
            {
              q: "Can I be both an author and a contributor?",
              a: "Absolutely. Many of our members run their own projects while contributing to others. Your author dashboard and your contributor profile are separate, so you can keep your roles distinct or let them inform each other."
            },
            {
              q: "How do contributors get discovered?",
              a: "Authors search for contributors by genre, media interest, and track record. A strong profile with a good acceptance rate and relevant genre tags will put you in front of the right authors. You can also apply directly to pitches posted on the Pitches board."
            },
            {
              q: "What is the Pitches board?",
              a: "Authors who are actively looking for collaborators can post a Pitch — a short description of their project and what kind of contributors they are after. Contributors browse these and send a join request directly. It is the fastest way to find a project that suits you."
            },
          ].map((item, i) => (
            <motion.div key={i} {...inView(i * 0.05)} className="border-b border-[#1A1614]/20 py-6 last:border-0">
              <h3 className="font-bold text-[#1A1614] text-sm uppercase tracking-[0.08em] mb-3">{item.q}</h3>
              <p className="text-sm text-[#7A6B5E] leading-relaxed">{item.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 md:px-14 bg-[#E8B84B] text-[#1A1614]">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...inView()}>
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#1A1614]/60 mb-4">Ready?</p>
            <div className="border-t-2 border-[#1A1614]/30 mb-6" />
            <h2 className="font-serif font-bold text-5xl md:text-6xl text-[#1A1614] mb-4 leading-tight">
              Join the room.
            </h2>
            <div className="border-t border-[#1A1614]/30 mb-6" />
            <p className="text-[#1A1614]/70 text-base mb-10 font-serif italic">
              Free to join. No credit card. Start writing, upload your manuscript, or build your contributor profile today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={openAuthModal}
                className="flex items-center gap-2 px-8 py-3.5 bg-[#D94B1F] text-[#F9F6EE] text-sm font-bold uppercase tracking-[0.12em] hover:bg-[#C23A14] transition-colors"
              >
                Start as an author <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={openAuthModal}
                className="px-8 py-3.5 border-2 border-[#1A1614] text-[#1A1614] text-sm font-bold uppercase tracking-[0.12em] hover:bg-[#1A1614] hover:text-[#E8B84B] transition-colors"
              >
                Join as a contributor
              </button>
            </div>
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
            <span className="uppercase tracking-[0.12em] text-[10px]">© {new Date().getFullYear()} The Writers Room</span>
            <button onClick={() => navigate("/")} className="uppercase tracking-[0.12em] text-[10px] hover:text-[#E8B84B] transition-colors">← Back to home</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
