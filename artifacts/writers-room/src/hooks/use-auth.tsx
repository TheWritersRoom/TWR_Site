import { useState, useEffect, useCallback, createContext, useContext } from "react";
import type { User } from "@workspace/api-client-react";

const AUTH_KEY = "writers_room_user";
const POLL_INTERVAL_MS = 60_000;

export type UserRole = "author" | "contributor" | "both";

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  genres?: string;
  mediaInterests?: string;
  bio?: string;
  credentials?: string;
};

export type SignInPayload = {
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  register: (payload: RegisterPayload) => Promise<void>;
  signIn: (payload: SignInPayload) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  updateUser: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const refreshUser = useCallback(async (email: string) => {
    try {
      const res = await fetch(`/api/users/me?email=${encodeURIComponent(email)}`);
      if (res.status === 404) {
        setUser(null);
        localStorage.removeItem(AUTH_KEY);
        return;
      }
      if (!res.ok) return;
      const fresh: User = await res.json();
      setUser(fresh);
      localStorage.setItem(AUTH_KEY, JSON.stringify(fresh));
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("[auth] Failed to refresh user profile:", err);
      }
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        const parsed: User = JSON.parse(stored);
        setUser(parsed);
        refreshUser(parsed.email).finally(() => setIsLoading(false));
        return;
      } catch {
        localStorage.removeItem(AUTH_KEY);
      }
    }
    setIsLoading(false);
  }, [refreshUser]);

  useEffect(() => {
    if (!user?.email) return;

    const email = user.email;

    const intervalId = setInterval(() => {
      refreshUser(email);
    }, POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshUser(email);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user?.email, refreshUser]);

  const register = async (payload: RegisterPayload) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: payload.role,
        genres: payload.genres ?? "[]",
        mediaInterests: payload.mediaInterests ?? "",
        bio: payload.bio ?? "",
        credentials: payload.credentials ?? "{}",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Registration failed");
    // Do not log the user in yet — they must verify their email first.
    // The modal will show the "check your email" screen.
  };

  const signIn = async (payload: SignInPayload) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: payload.email, password: payload.password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Sign in failed");
    setUser(data);
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    setAuthModalOpen(false);
  };

  const loginWithToken = async (token: string) => {
    const res = await fetch(`/api/auth/token/${token}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Token exchange failed");
    setUser(data);
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
    fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      user,
      register,
      signIn,
      loginWithToken,
      updateUser,
      logout,
      isLoading,
      authModalOpen,
      openAuthModal: () => setAuthModalOpen(true),
      closeAuthModal: () => setAuthModalOpen(false),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
