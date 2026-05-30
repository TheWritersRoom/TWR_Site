import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

/**
 * This page is the landing point after a Google (or other) OAuth redirect.
 * The API server redirects here with ?token=<uuid> after a successful sign-in.
 * We exchange the one-time token for the user object and then redirect home.
 */
export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { loginWithToken } = useAuth();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error || !token) {
      const messages: Record<string, string> = {
        access_denied: "You cancelled the sign-in.",
        not_configured: "Google sign-in is not yet configured.",
        token_exchange_failed: "Could not complete sign-in — please try again.",
        profile_fetch_failed: "Could not retrieve your Google profile.",
        no_email: "Your Google account does not have a verified email address.",
        server_error: "A server error occurred. Please try again.",
      };
      setErrorMsg(messages[error ?? ""] ?? "Sign-in failed. Please try again.");
      setStatus("error");
      return;
    }

    const verified = params.get("verified") === "1";
    loginWithToken(token)
      .then(() => {
        const pendingJoin = sessionStorage.getItem("pendingJoinToken");
        if (pendingJoin) {
          sessionStorage.removeItem("pendingJoinToken");
          setLocation(`/join/${pendingJoin}`);
        } else {
          setLocation(verified ? "/dashboard" : "/");
        }
      })
      .catch((err: Error) => {
        setErrorMsg(err.message || "Could not complete sign-in.");
        setStatus("error");
      });
  }, [loginWithToken, setLocation]);

  return (
    <div className="min-h-screen bg-[#F9F6EE] flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-4">
        {status === "loading" ? (
          <>
            <div className="w-8 h-8 border-2 border-[#E8B84B] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[#7A6B5E]">Signing you in…</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="font-serif text-xl text-[#1A1614]">Sign-in failed</h2>
            <p className="text-sm text-[#7A6B5E]">{errorMsg}</p>
            <button
              onClick={() => setLocation("/")}
              className="mt-4 px-6 py-2 bg-[#1A1614] text-white text-sm font-semibold tracking-wide hover:bg-[#2d2420] transition-colors"
            >
              Back to home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
