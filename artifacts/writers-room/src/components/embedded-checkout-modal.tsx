import { useCallback, useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

interface EmbeddedCheckoutModalProps {
  plan: "monthly" | "yearly";
  onClose: () => void;
}

export function EmbeddedCheckoutModal({ plan, onClose }: EmbeddedCheckoutModalProps) {
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/stripe/checkout/embedded", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ plan }),
    });
    const data = await res.json() as { clientSecret?: string; error?: string };
    if (!res.ok || !data.clientSecret) {
      const msg = data.error ?? "Failed to load checkout. Please try again.";
      setError(msg);
      throw new Error(msg);
    }
    return data.clientSecret;
  }, [plan]);

  const options = { fetchClientSecret };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        className="relative w-full max-w-lg bg-[#F9F6EE] border-2 border-[#1A1614] shadow-2xl overflow-hidden"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#1A1614] bg-[#1A1614]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.26em] font-bold text-[#E8B84B]">Writers Room Pro</p>
            <p className="text-sm font-serif font-semibold text-[#F9F6EE] mt-0.5">
              {plan === "monthly" ? "£5 / month" : "£50 / year"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#F9F6EE]/50 hover:text-[#F9F6EE] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stripe Embedded Checkout */}
        <div className="p-4">
          {error ? (
            <div className="py-10 text-center">
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 border-2 border-[#1A1614] text-sm font-semibold text-[#1A1614] hover:bg-[#1A1614] hover:text-[#F9F6EE] transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </div>
      </motion.div>
    </div>
  );
}
