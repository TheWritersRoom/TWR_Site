import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useFreeSlots } from "@/hooks/use-free-slots";
import {
  Check, Zap, ArrowLeft, ArrowRight, Shield, BookText,
  Star, Crown,
} from "lucide-react";

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay, ease: "easeOut" as const },
});

const ThickRule = ({ className = "" }: { className?: string }) => (
  <div className={`border-t-2 border-[#1A1614] ${className}`} />
);

const FREE_FEATURES = [
  { text: "1 active project as an author" },
  { text: "Full collaboration tools" },
  { text: "Invite up to 6 contributors per project" },
  { text: "IP protection & contributor agreements" },
  { text: "SHA-256 content fingerprinting" },
  { text: "Contribution certificates (PDF)" },
  { text: "EPUB & DOCX export" },
  { text: "Pitches board access" },
  { text: "Discover & Browse feed" },
  { text: "Direct messaging" },
];

const PRO_FEATURES = [
  { text: "Unlimited active projects", highlight: true },
  { text: "Everything in Free" },
  { text: "Pro badge on your public profile" },
  { text: "Priority listing on the Pitches board" },
  { text: "Early access to new features" },
];

const FAQS = [
  {
    q: "What does Free include?",
    a: "Everything you need to get started — one active project with the full collaboration toolkit, IP protection, contributor agreements, SHA-256 fingerprinting, contribution certificates, EPUB & DOCX export, Pitches board access, and direct messaging. No credit card required.",
  },
  {
    q: "What happens to my project if I don't upgrade?",
    a: "Nothing. Your existing project stays fully active. You simply can't open a second one until you upgrade to Pro or archive the current project.",
  },
  {
    q: "Can I contribute to other people's projects on Free?",
    a: "Yes, absolutely. Collaborating on others' projects — leaving suggestions, building your reputation, earning achievements, downloading certificates — is included in Free with no restrictions.",
  },
  {
    q: "When will payments be available?",
    a: "We're finalising the payment integration now. If you'd like to be notified when Pro launches, get in touch via the community.",
  },
];

export default function Pricing() {
  const [, navigate] = useLocation();
  const { user, openAuthModal } = useAuth();
  const freeSlots = useFreeSlots();

  return (
    <div className="min-h-screen bg-[#F9F6EE] text-[#1A1614] overflow-x-hidden">

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
        <div className="px-6 md:px-14 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate("/how-it-works")} className="text-[11px] uppercase tracking-[0.16em] text-[#1A1614] font-semibold hover:text-[#E8B84B] transition-colors">How it works</button>
            <button onClick={() => navigate("/pricing")} className="text-[11px] uppercase tracking-[0.16em] text-[#E8B84B] font-bold border-b border-[#E8B84B]">Pricing</button>
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
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="pt-44 pb-36 px-6 md:px-14 bg-[#1A1614] min-h-[600px]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#E8B84B] mb-4">Simple, honest pricing</p>
            <div className="border-t border-[#F9F6EE]/20 w-24 mx-auto mb-6" />
            <h1 className="font-serif font-bold text-[clamp(2.4rem,6vw,4.5rem)] text-[#F9F6EE] leading-tight mb-6">
              Free to start.<br />Pro when you're ready.
            </h1>
            <div className="border-t border-[#F9F6EE]/20 w-24 mx-auto mb-6" />
            <p className="font-serif italic text-[#F9F6EE]/65 text-lg max-w-2xl mx-auto leading-relaxed">
              Every account gets a free project with the full feature set. Pay only when you need more.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section className="py-16 px-6 md:px-14">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-0 border-2 border-[#1A1614]">

            {/* Free */}
            <motion.div {...inView(0)} className="p-8 md:p-10 border-b-2 md:border-b-0 md:border-r-2 border-[#1A1614]">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <BookText className="w-4 h-4 text-[#7A6B5E]" />
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#7A6B5E]">Free</p>
                </div>
                <p className="font-serif font-bold text-5xl text-[#1A1614]">£0</p>
                <p className="text-sm text-[#7A6B5E] mt-2">Forever. No credit card. One project, the full platform.</p>
              </div>
              <ThickRule className="mb-6" />
              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map(f => (
                  <li key={f.text} className="flex items-start gap-2.5 text-sm text-[#7A6B5E]">
                    <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#7A6B5E]/50" />
                    {f.text}
                  </li>
                ))}
              </ul>
              <button
                onClick={openAuthModal}
                className="w-full py-2.5 border-2 border-[#1A1614] text-[#1A1614] text-[11px] uppercase tracking-[0.14em] font-bold hover:bg-[#1A1614] hover:text-[#F9F6EE] transition-colors"
              >
                {user ? "Your current plan" : "Get started free"}
              </button>
            </motion.div>

            {/* Pro */}
            <motion.div {...inView(0.08)} className="p-8 md:p-10 bg-[#E8B84B]/8 relative">
              <div className="absolute top-0 left-0 right-0 flex justify-center -translate-y-1/2">
                <span className="bg-[#E8B84B] text-[#1A1614] px-4 py-1 text-[10px] uppercase tracking-[0.18em] font-bold border-2 border-[#1A1614]">
                  Most popular
                </span>
              </div>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-[#E8B84B]" />
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#7A5A00]">Pro</p>
                </div>
                <p className="font-serif font-bold text-5xl text-[#1A1614]">£5<span className="text-xl font-sans font-normal text-[#7A6B5E]">/mo</span></p>
                <p className="text-sm text-[#7A6B5E] mt-2">or £50/year — save £10. Unlimited projects, priority listing.</p>
              </div>
              <ThickRule className="mb-6" />
              <ul className="space-y-3 mb-8">
                {PRO_FEATURES.map(f => (
                  <li key={f.text} className={`flex items-start gap-2.5 text-sm ${f.highlight ? "font-semibold text-[#1A1614]" : "text-[#7A6B5E]"}`}>
                    <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${f.highlight ? "text-[#E8B84B]" : "text-[#7A6B5E]/50"}`} />
                    {f.text}
                  </li>
                ))}
              </ul>
              <button
                onClick={openAuthModal}
                className="w-full py-2.5 bg-[#1A1614] text-[#F9F6EE] text-[11px] uppercase tracking-[0.14em] font-bold hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors"
              >
                {user ? "You're on Pro" : "Claim your free Pro account"}
              </button>

              {freeSlots !== null && freeSlots > 0 && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8B84B] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#E8B84B]" />
                  </span>
                  <p className="text-[10px] text-[#7A5A00] font-bold uppercase tracking-[0.14em]">
                    {freeSlots} of 300 free accounts remaining
                  </p>
                </div>
              )}
              {freeSlots === 0 && (
                <p className="text-center text-[10px] text-[#7A6B5E] mt-2">Free Pro accounts fully claimed — paid plans coming soon.</p>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── WHY PRO ── */}
      <section className="py-16 px-6 md:px-14 bg-[#F9F6EE] border-t-2 border-[#1A1614]">
        <div className="max-w-4xl mx-auto">
          <motion.div {...inView()} className="mb-10">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">The logic behind it</p>
            <ThickRule className="mb-2" />
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-[#1A1614] mt-4">Why not just free everything?</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-0 border-2 border-[#1A1614]">
            {[
              { icon: Shield, title: "Quality over volume", body: "A platform where anyone can open unlimited simultaneous projects is one where most projects are abandoned. One free project creates focus. The work gets done." },
              { icon: Star, title: "Pro is for prolific writers", body: "If you are running three projects at once, you are getting significant value from the platform. £5 a month is the cost of one paperback. We think that is fair." },
            ].map((item, i) => (
              <motion.div key={item.title} {...inView(i * 0.1)} className="p-7 border-b-2 md:border-b-0 md:border-r-2 border-[#1A1614] last:border-0">
                <div className="w-9 h-9 bg-[#E8B84B]/20 flex items-center justify-center mb-4">
                  <item.icon className="w-4 h-4 text-[#7A5A00]" />
                </div>
                <h3 className="font-bold text-[#1A1614] text-sm uppercase tracking-[0.1em] mb-3">{item.title}</h3>
                <p className="text-sm text-[#7A6B5E] leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-6 md:px-14 border-t-2 border-[#1A1614]">
        <div className="max-w-3xl mx-auto">
          <motion.div {...inView()} className="mb-10">
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">Questions</p>
            <ThickRule className="mb-2" />
            <h2 className="font-serif font-bold text-3xl text-[#1A1614] mt-4">Pricing FAQ</h2>
          </motion.div>
          {FAQS.map((item, i) => (
            <motion.div key={i} {...inView(i * 0.05)} className="border-b border-[#1A1614]/20 py-6 last:border-0">
              <h3 className="font-bold text-[#1A1614] text-sm uppercase tracking-[0.08em] mb-2">{item.q}</h3>
              <p className="text-sm text-[#7A6B5E] leading-relaxed">{item.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 md:px-14 bg-[#E8B84B]">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...inView()}>
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#1A1614]/60 mb-4">Ready?</p>
            <ThickRule className="border-[#1A1614]/30 mb-6" />
            <h2 className="font-serif font-bold text-4xl md:text-5xl text-[#1A1614] mb-6 leading-tight">Start writing today.</h2>
            <div className="border-t border-[#1A1614]/30 mb-8" />
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={openAuthModal}
                className="flex items-center gap-2 px-8 py-3.5 bg-[#1A1614] text-[#F9F6EE] text-sm font-bold uppercase tracking-[0.12em] hover:bg-[#D94B1F] transition-colors"
              >
                Get started free <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
