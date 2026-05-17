"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type AuthSession } from "@/types";

interface AuthContextValue {
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store"
        });

        if (!response.ok) {
          if (active) setSession(null);
          return;
        }

        const data = (await response.json()) as { user?: AuthSession | null };
        if (active) {
          setSession(data.user ?? null);
        }
      } catch {
        if (active) setSession(null);
      }
    }

    loadSession();

    return () => {
      active = false;
    };
  }, []);

  return <AuthContext.Provider value={{ session, setSession }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
