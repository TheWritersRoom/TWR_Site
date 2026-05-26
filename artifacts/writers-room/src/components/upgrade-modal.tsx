import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Zap, Shield, ArrowRight } from "lucide-react";
import { EmbeddedCheckoutModal } from "@/components/embedded-checkout-modal";

const FREE_FEATURES = [
  "1 active project",
  "Full collaboration tools",
  "IP protection & agreements",
  "Contributor certificates",
  "EPUB & DOCX export",
  "Contributor reputation system",
];

const PRO_FEATURES = [
  "Unlimited active projects",
  "Everything in Free",
  "Pro badge on your profile",
  "Priority on the Pitches board",
  "Early access to new features",
];

export function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [checkoutPlan, setCheckoutPlan] = useState<"monthly" | "yearly" | null>(null);

  if (checkoutPlan) {
    return (
      <EmbeddedCheckoutModal
        plan={checkoutPlan}
        onClose={() => setCheckoutPlan(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-[#F9F6EE] border-2 border-[#1A1614] w-full max-w-2xl shadow-2xl overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#7A6B5E] hover:text-[#1A1614] hover:bg-[#1A1614]/5 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-[#1A1614] px-8 py-7">
          <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#E8B84B] mb-2">Writers Room Pro</p>
          <div className="border-t border-[#F9F6EE]/20 mb-4" />
          <h2 className="font-serif font-bold text-3xl text-[#F9F6EE] leading-tight">
            You've reached your free project limit
          </h2>
          <p className="text-[#F9F6EE]/60 text-sm mt-2 font-serif italic">
            Upgrade to Pro to run unlimited projects — everything else stays the same.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 divide-y-2 md:divide-y-0 md:divide-x-2 divide-[#1A1614]/15">

          {/* Free */}
          <div className="p-7">
            <div className="flex items-baseline justify-between mb-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#7A6B5E]">Free</p>
                <p className="font-serif font-bold text-2xl text-[#1A1614] mt-0.5">£0<span className="text-sm font-sans font-normal text-[#7A6B5E]">/month</span></p>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] bg-[#1A1614]/8 text-[#7A6B5E] border border-[#1A1614]/15">Current plan</span>
            </div>
            <ul className="space-y-2.5">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#7A6B5E]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#7A6B5E]/50" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="p-7 bg-[#E8B84B]/6">
            <div className="flex items-baseline justify-between mb-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#7A5A00] flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Pro
                </p>
                <div className="flex items-baseline gap-3 mt-0.5">
                  <p className="font-serif font-bold text-2xl text-[#1A1614]">£5<span className="text-sm font-sans font-normal text-[#7A6B5E]">/month</span></p>
                  <p className="text-[11px] text-[#7A6B5E]">or £50/year</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] bg-[#E8B84B] text-[#1A1614] border border-[#E8B84B]">Recommended</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#1A1614]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#E8B84B]" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="space-y-2">
              <button
                onClick={() => setCheckoutPlan("monthly")}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#1A1614] text-[#F9F6EE] text-[11px] uppercase tracking-[0.14em] font-bold hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                Monthly — £5 / month
              </button>
              <button
                onClick={() => setCheckoutPlan("yearly")}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-[#1A1614] text-[#1A1614] text-[11px] uppercase tracking-[0.14em] font-bold hover:bg-[#1A1614] hover:text-[#F9F6EE] transition-colors"
              >
                Yearly — £50 / year <span className="text-[#7A5A00] font-normal normal-case tracking-normal">save £10</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="border-t-2 border-[#1A1614]/10 px-8 py-4 flex items-center gap-3">
          <Shield className="w-4 h-4 text-[#7A6B5E] shrink-0" />
          <p className="text-xs text-[#7A6B5E] leading-relaxed">
            Secure payment via Stripe. Cancel any time from your profile. Contributors are always free.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
