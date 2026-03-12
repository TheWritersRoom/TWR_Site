import { useState, useEffect, createContext, useContext } from "react";
import { useCreateUser } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

const AUTH_KEY = "writers_room_user";

export type UserRole = "author" | "contributor" | "both";

export type LoginPayload = {
  name: string;
  email: string;
  role: UserRole;
  genres?: string;
  mediaInterests?: string;
};

type AuthContextType = {
  user: User | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const createUserMutation = useCreateUser();

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem(AUTH_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (payload: LoginPayload) => {
    try {
      const newUser = await createUserMutation.mutateAsync({
        data: {
          name: payload.name,
          email: payload.email,
          role: payload.role,
          genres: payload.genres ?? "[]",
          mediaInterests: payload.mediaInterests ?? "",
        },
      });
      setUser(newUser);
      localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
