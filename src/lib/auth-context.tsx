import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { router } from "expo-router";
import { api, ApiError, getToken, setToken } from "./api";
import { registerForPushNotifications } from "./notifications";
import type { User } from "../types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    const token = await getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const me = await api.get<User>("/auth/me");
      setUser(me);
      registerForPushNotifications();
    } catch {
      await setToken(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<{ user: User; token: string }>("/auth/login", { email, password });
    await setToken(res.token);
    setUser(res.user);
    registerForPushNotifications();
    router.replace(res.user.role === "customer" ? "/(store)" : "/(tabs)");
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // token mungkin sudah invalid, tetap lanjut clear di device
    }
    await setToken(null);
    setUser(null);
    router.replace("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}

export { ApiError };
