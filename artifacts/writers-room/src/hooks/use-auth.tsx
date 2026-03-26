import { useState, useEffect, createContext, useContext } from "react";
import type { User } from "@workspace/api-client-react";

const AUTH_KEY = "writers_room_user";

export type UserRole = "author" | "contributor" | "both";

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  genres?: string;
  mediaInterests?: string;
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

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(AUTH_KEY);
      }
    }
    setIsLoading(false);
  }, []);

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
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Registration failed");
    setUser(data);
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    setAuthModalOpen(false);
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

  /** Called after the OAuth redirect — exchanges the one-time token for the user object */
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
  };

  return (
    <AuthContext.Provider value={{
      user,
      register,
      signIn,
      loginWithToken,
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
