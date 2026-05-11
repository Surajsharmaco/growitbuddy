import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { AdminRole } from "./adminPermissions";

import { API_BASE } from "@/lib/api";
const TOKEN_KEY = "gb_admin_token";

export type { AdminRole };

interface AdminContextValue {
  token: string | null;
  isAuthenticated: boolean;
  role: AdminRole | null;
  permissions: string[];
  isSuperAdmin: boolean;
  verifying: boolean;
  hasPermission: (perm: string) => boolean;
  login: (password: string) => Promise<void>;
  teamLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getContent: (section: string) => Promise<Record<string, unknown> | null>;
  saveContent: (section: string, data: Record<string, unknown>) => Promise<void>;
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [role, setRole] = useState<AdminRole | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [verifying, setVerifying] = useState(true);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const isAuthenticated = token !== null;
  const isSuperAdmin = role === "super";

  const hasPermission = useCallback(
    (perm: string): boolean => {
      if (role === "super") return true;
      if (permissions.includes("all")) return true;
      return permissions.includes(perm);
    },
    [role, permissions],
  );

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setRole(null);
    setPermissions([]);
  }, []);

  const authFetch = useCallback(
    async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
      const headers = new Headers(init?.headers);
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${tokenRef.current ?? ""}`);
      }
      const res = await fetch(input, { ...init, headers });
      if (res.status === 401) {
        clearSession();
      }
      return res;
    },
    [clearSession],
  );

  const runVerify = useCallback(async () => {
    const t = tokenRef.current;
    if (!t) {
      setVerifying(false);
      return;
    }
    try {
      const r = await fetch(`${API_BASE}/admin/verify`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!r.ok) {
        clearSession();
      } else {
        const data = await r.json();
        setRole(data.role ?? null);
        setPermissions(data.permissions ?? []);
      }
    } catch {
    } finally {
      setVerifying(false);
    }
  }, [clearSession]);

  useEffect(() => {
    runVerify();
    const id = setInterval(runVerify, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [runVerify]);

  const login = useCallback(async (password: string) => {
    let r: Response | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        r = await fetch(`${API_BASE}/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        break;
      } catch {
        if (attempt === 3) throw new Error("Server is not responding. It may be starting up — please wait 30 seconds and try again.");
        await new Promise((res) => setTimeout(res, attempt * 2000));
      }
    }
    if (!r) throw new Error("No response from server.");
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      let msg = `Server error ${r.status}`;
      try { msg = (JSON.parse(body) as { error?: string }).error ?? msg; } catch { msg = body || msg; }
      throw new Error(msg);
    }
    const data = await r.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    tokenRef.current = data.token;
    setRole(data.role ?? "super");
    setPermissions(data.permissions ?? ["all"]);
  }, []);

  const teamLogin = useCallback(async (email: string, password: string) => {
    let r: Response | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        r = await fetch(`${API_BASE}/admin/team/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        break;
      } catch {
        if (attempt === 3) throw new Error("Server is not responding. It may be starting up — please wait 30 seconds and try again.");
        await new Promise((res) => setTimeout(res, attempt * 2000));
      }
    }
    if (!r) throw new Error("No response from server.");
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      let msg = `Server error ${r.status}`;
      try { msg = (JSON.parse(body) as { error?: string }).error ?? msg; } catch { msg = body || msg; }
      throw new Error(msg);
    }
    const data = await r.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    tokenRef.current = data.token;
    setRole(data.role ?? "member");
    setPermissions(data.permissions ?? []);
  }, []);

  const logout = useCallback(async () => {
    const t = tokenRef.current;
    if (t) {
      await fetch(`${API_BASE}/admin/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}` },
      }).catch(() => {});
    }
    clearSession();
  }, [clearSession]);

  const getContent = useCallback(
    async (section: string): Promise<Record<string, unknown> | null> => {
      const r = await authFetch(`${API_BASE}/admin/content/${section}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!r.ok) return null;
      const row = await r.json();
      return row.data ?? null;
    },
    [authFetch],
  );

  const saveContent = useCallback(
    async (section: string, data: Record<string, unknown>) => {
      const r = await authFetch(`${API_BASE}/admin/content/${section}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Save failed (${r.status})`);
      }
    },
    [authFetch],
  );

  return (
    <AdminContext.Provider
      value={{
        token,
        isAuthenticated,
        role,
        permissions,
        isSuperAdmin,
        verifying,
        hasPermission,
        login,
        teamLogin,
        logout,
        getContent,
        saveContent,
        authFetch,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
