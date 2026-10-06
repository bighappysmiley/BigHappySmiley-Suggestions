"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthConfigStatus, PublicUser } from "@/lib/auth/types";

type AuthState = {
  user: PublicUser | null;
  config: AuthConfigStatus | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [config, setConfig] = useState<AuthConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) {
      setUser(null);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as {
      user: PublicUser | null;
      config: AuthConfigStatus;
    };
    setUser(data.user);
    setConfig(data.config);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    await refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ user, config, loading, refresh, logout }),
    [user, config, loading, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
