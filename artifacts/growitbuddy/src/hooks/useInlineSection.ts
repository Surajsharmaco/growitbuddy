import { useCallback, useRef, useState } from "react";
import { API_BASE } from "@/lib/api";
import { useAdmin } from "@/context/AdminContext";
import { usePublicContent } from "@/hooks/usePublicContent";

function setPath<T extends object>(obj: T, path: string, value: unknown): T {
  const parts = path.split(".").filter(Boolean);
  if (parts.length === 0) return obj;
  const clone: Record<string, unknown> = Array.isArray(obj)
    ? ([...(obj as unknown[])] as unknown as Record<string, unknown>)
    : { ...(obj as Record<string, unknown>) };
  let cursor: Record<string, unknown> = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = cursor[key];
    const isArrayIdx = /^\d+$/.test(parts[i + 1]);
    if (Array.isArray(next)) cursor[key] = [...next];
    else if (next && typeof next === "object") cursor[key] = { ...(next as Record<string, unknown>) };
    else cursor[key] = isArrayIdx ? [] : {};
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
  return clone as T;
}

export type InlineSaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseInlineSectionResult<T extends object> {
  data: T;
  isAdmin: boolean;
  status: InlineSaveStatus;
  lastError: string | null;
  saveField: (path: string, value: unknown) => Promise<void>;
  saveData: (next: T) => Promise<void>;
}

/**
 * Admin-aware variant of usePublicContent.
 * - Reads via usePublicContent (cache + cross-tab live updates).
 * - When the admin is signed in, exposes saveField/saveData which optimistically
 *   update local overlay, PUT to /admin/content/:section, and broadcast.
 * - When not signed in, behavior is identical to usePublicContent.
 */
export function useInlineSection<T extends object>(
  section: string,
  defaults: T,
): UseInlineSectionResult<T> {
  const remote = usePublicContent<T>(section, defaults);
  const { isAuthenticated, authFetch } = useAdmin();

  // Optimistic overlay. Cleared when remote catches up (we display overlay
  // until remote matches it, then drop it so future remote changes show).
  const [overlay, setOverlay] = useState<T | null>(null);
  const [status, setStatus] = useState<InlineSaveStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const lastSavedRef = useRef<string | null>(null);

  const data = overlay ?? remote;

  // Once the remote value matches our last successful save, drop the overlay
  // so future external updates (from another admin) take effect.
  if (overlay && lastSavedRef.current && JSON.stringify(remote) === lastSavedRef.current) {
    queueMicrotask(() => {
      setOverlay(null);
      lastSavedRef.current = null;
    });
  }

  const persist = useCallback(
    async (next: T) => {
      setOverlay(next);
      setStatus("saving");
      setLastError(null);
      try {
        const res = await authFetch(`${API_BASE}/admin/content/${section}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: next }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `Save failed (${res.status})`);
        }
        // Broadcast so every tab (including this one's usePublicContent
        // listeners) refetches and shows the new server-truth.
        try { localStorage.setItem("gb-content-updated", `${section}|${Date.now()}`); } catch { /* noop */ }
        lastSavedRef.current = JSON.stringify(next);
        setStatus("saved");
        setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1400);
      } catch (e) {
        setOverlay(null); // revert
        setStatus("error");
        setLastError(e instanceof Error ? e.message : "Save failed");
        setTimeout(() => setStatus((s) => (s === "error" ? "idle" : s)), 2400);
      }
    },
    [authFetch, section],
  );

  const saveField = useCallback(
    async (path: string, value: unknown) => {
      if (!isAuthenticated) return;
      const next = setPath(data, path, value);
      await persist(next);
    },
    [isAuthenticated, data, persist],
  );

  const saveData = useCallback(
    async (next: T) => {
      if (!isAuthenticated) return;
      await persist(next);
    },
    [isAuthenticated, persist],
  );

  return { data, isAdmin: isAuthenticated, status, lastError, saveField, saveData };
}
