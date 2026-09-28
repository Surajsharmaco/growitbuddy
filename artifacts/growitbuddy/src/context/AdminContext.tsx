import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { AdminRole } from "./adminPermissions";
import { useLocation } from "wouter";

import { API_BASE } from "@/lib/api";
import { variantContentKey } from "@/lib/variantSources";
const TOKEN_KEY = "gb_admin_token";

function getRequestedVariantSlug(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return new URLSearchParams(window.location.search).get("variant");
  } catch {
    return null;
  }
}

export type { AdminRole };

export interface AdminVariantInfo {
  slug: string;
  sourceKey: string;
  label: string;
}

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
  // Like getContent, but distinguishes a genuine load FAILURE (HTTP error /
  // network throw) from a section that is simply empty / never-configured.
  // Editors that persist user-deletable lists MUST use this so a failed read
  // can never be saved over real data (re-introducing deleted "ghost" items).
  getContentResult: (
    section: string,
  ) => Promise<{ ok: boolean; data: Record<string, unknown> | null }>;
  saveContent: (section: string, data: Record<string, unknown>) => Promise<void>;
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  // When admin is editing a variant (URL contains ?variant=<slug>), this is set.
  // getContent/saveContent automatically namespace their section key when
  // editing a section that matches the active variant's sourceKey.
  currentVariant: AdminVariantInfo | null;
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
  const isSuperAdmin = role === "super" || permissions.includes("all");

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
        if (attempt === 3) throw new Error("Server is not responding. It may be starting up - please wait 30 seconds and try again.");
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
        if (attempt === 3) throw new Error("Server is not responding. It may be starting up - please wait 30 seconds and try again.");
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

  // ── Variant-aware editing ──
  // When admin navigates to e.g. /admin/home?variant=home-students, all
  // getContent/saveContent calls for section "home" are transparently
  // redirected to the namespaced key `home__v__home-students` - so the same
  // existing admin forms (AdminHome, AdminAbout, etc.) edit variant content
  // without any per-page changes.
  const [location] = useLocation();
  const [, refreshVariantQuery] = useState(0);
  useEffect(() => {
    const onLocationChange = () => refreshVariantQuery((revision) => revision + 1);
    window.addEventListener("popstate", onLocationChange);
    window.addEventListener("hashchange", onLocationChange);
    return () => {
      window.removeEventListener("popstate", onLocationChange);
      window.removeEventListener("hashchange", onLocationChange);
    };
  }, []);
  const requestedVariantSlug = getRequestedVariantSlug();
  const requestedVariantSlugRef = useRef(requestedVariantSlug);
  requestedVariantSlugRef.current = requestedVariantSlug;
  const [variantResolution, setVariantResolution] = useState<{
    slug: string | null;
    status: "none" | "pending" | "resolved" | "failed";
    variant: AdminVariantInfo | null;
  }>({ slug: null, status: "none", variant: null });
  const variantResolutionRef = useRef(variantResolution);
  variantResolutionRef.current = variantResolution;
  const variantLookupsRef = useRef(new Map<string, Promise<AdminVariantInfo | null>>());

  const loadRequestedVariant = useCallback((slug: string): Promise<AdminVariantInfo | null> => {
    const pending = variantLookupsRef.current.get(slug);
    if (pending) return pending;

    setVariantResolution({ slug, status: "pending", variant: null });
    const lookup = (async () => {
      try {
        // Use the auth-protected admin list so hidden variants are also resolved.
        const r = await authFetch(`${API_BASE}/admin/variants`);
        if (!r.ok) throw new Error(`Variant lookup failed (${r.status})`);
        const rows = await r.json() as Array<{ slug: string; sourceKey: string; label: string }>;
        if (!Array.isArray(rows)) throw new Error("Variant lookup returned invalid data");
        const match = rows.find((variant) => variant.slug === slug);
        if (match && (typeof match.sourceKey !== "string" || !match.sourceKey)) {
          throw new Error("Variant lookup returned invalid variant data");
        }
        const variant = match
          ? { slug: match.slug, sourceKey: match.sourceKey, label: match.label }
          : null;
        if (requestedVariantSlugRef.current === slug) {
          setVariantResolution({ slug, status: variant ? "resolved" : "failed", variant });
        }
        return variant;
      } catch {
        if (requestedVariantSlugRef.current === slug) {
          setVariantResolution({ slug, status: "failed", variant: null });
        }
        return null;
      } finally {
        variantLookupsRef.current.delete(slug);
      }
    })();
    variantLookupsRef.current.set(slug, lookup);
    return lookup;
  }, [authFetch]);

  const currentVariant = requestedVariantSlug
    && variantResolution.slug === requestedVariantSlug
    && variantResolution.status === "resolved"
    ? variantResolution.variant
    : null;

  useEffect(() => {
    const slug = requestedVariantSlug;
    if (!slug) {
      setVariantResolution({ slug: null, status: "none", variant: null });
      return;
    }
    if (
      variantResolutionRef.current.slug === slug
      && variantResolutionRef.current.status === "resolved"
    ) return;
    void loadRequestedVariant(slug);
  }, [location, isAuthenticated, requestedVariantSlug, loadRequestedVariant]);

  const resolveSectionForAccess = useCallback(async (section: string) => {
    const requestedSlug = getRequestedVariantSlug();
    requestedVariantSlugRef.current = requestedSlug;
    if (!requestedSlug) return { key: section, requestedSlug: null };

    const resolution = variantResolutionRef.current;
    let variant = resolution.slug === requestedSlug && resolution.status === "resolved"
      ? resolution.variant
      : null;
    if (!variant) variant = await loadRequestedVariant(requestedSlug);
    if (!variant || requestedVariantSlugRef.current !== requestedSlug) return null;

    // Do not fall back for unrelated/shared sections either: callers may pass
    // base-page identifiers (including page_visibility) that are not variant-scoped.
    if (variant.sourceKey !== section) return null;

    return {
      key: variantContentKey(variant.sourceKey, variant.slug),
      requestedSlug,
    };
  }, [loadRequestedVariant]);

  // Keep section-level read failures so an older editor using getContent
  // cannot turn a failed read into a save of its empty defaults.
  const contentReadSequenceRef = useRef(new Map<string, number>());
  const failedContentReadsRef = useRef(new Set<string>());

  const getContentResult = useCallback(
    async (
      section: string,
    ): Promise<{ ok: boolean; data: Record<string, unknown> | null }> => {
      const resolved = await resolveSectionForAccess(section);
      if (!resolved || resolved.requestedSlug !== requestedVariantSlugRef.current) {
        return { ok: false, data: null };
      }
      const key = resolved.key;
      const sequence = (contentReadSequenceRef.current.get(key) ?? 0) + 1;
      contentReadSequenceRef.current.set(key, sequence);
      try {
        const r = await authFetch(`${API_BASE}/admin/content/${key}`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!r.ok) {
          if (contentReadSequenceRef.current.get(key) === sequence) failedContentReadsRef.current.add(key);
          return { ok: false, data: null };
        }
        const row = await r.json();
        if (contentReadSequenceRef.current.get(key) === sequence) failedContentReadsRef.current.delete(key);
        return { ok: true, data: row.data ?? null };
      } catch {
        if (contentReadSequenceRef.current.get(key) === sequence) failedContentReadsRef.current.add(key);
        return { ok: false, data: null };
      }
    },
    [authFetch, requestedVariantSlug, resolveSectionForAccess],
  );

  const getContent = useCallback(
    async (section: string): Promise<Record<string, unknown> | null> => {
      const res = await getContentResult(section);
      return res.ok ? res.data : null;
    },
    [getContentResult],
  );

  const saveContent = useCallback(
    async (section: string, data: Record<string, unknown>) => {
      const resolved = await resolveSectionForAccess(section);
      if (!resolved || resolved.requestedSlug !== requestedVariantSlugRef.current) {
        throw new Error("Cannot save because the requested variant could not be resolved. Reload the variant and try again.");
      }
      const key = resolved.key;
      if (failedContentReadsRef.current.has(key)) {
        throw new Error("Cannot save this section because its latest content read failed. Reload the section and try again.");
      }
      const r = await authFetch(`${API_BASE}/admin/content/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Save failed (${r.status})`);
      }
      // Ping every other tab in this browser so public pages re-fetch and
      // never show stale content. Public SPA tabs listen via the `storage`
      // event in usePublicContent and DynamicPageSEO. We use "|" as the
      // section/timestamp separator because section names themselves may
      // contain ":" (e.g. "seo:home").
      try {
        localStorage.setItem("gb-content-updated", `${key}|${Date.now()}`);
      } catch { /* localStorage may be unavailable */ }
    },
    [authFetch, requestedVariantSlug, resolveSectionForAccess],
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
        getContentResult,
        saveContent,
        authFetch,
        currentVariant,
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
