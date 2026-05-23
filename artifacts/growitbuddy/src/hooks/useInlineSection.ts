import { useCallback, useEffect, useRef, useState } from "react";
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
 *
 * Concurrency model: each call to persist() gets a monotonic version. Only the
 * latest save can mutate global state (status, overlay) on completion/failure
 * so rapid successive edits never drop or revert in-flight newer ones.
 */
export function useInlineSection<T extends object>(
  section: string,
  defaults: T,
): UseInlineSectionResult<T> {
  const remote = usePublicContent<T>(section, defaults);
  const { isAuthenticated, authFetch } = useAdmin();

  const [overlay, setOverlay] = useState<T | null>(null);
  const [status, setStatus] = useState<InlineSaveStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  // Latest persist() version that started. Stale callbacks (older version)
  // must not touch shared state.
  const saveVersionRef = useRef(0);
  // Snapshot of the most recent payload we sent (any version). Used to drop
  // overlay once `remote` catches up to it from the server.
  const lastSentRef = useRef<string | null>(null);
  // Overlay we displayed for that lastSent — used to compare with new `remote`.
  const overlayRef = useRef<T | null>(null);
  overlayRef.current = overlay;

  const data = overlay ?? remote;

  // Reconcile: when remote refetch matches whatever we last sent, drop overlay
  // so future external updates (from another admin tab) take effect.
  useEffect(() => {
    if (!overlayRef.current) return;
    if (!lastSentRef.current) return;
    try {
      if (JSON.stringify(remote) === lastSentRef.current) {
        setOverlay(null);
        lastSentRef.current = null;
      }
    } catch { /* JSON.stringify can fail on weird objects — non-fatal */ }
  }, [remote]);

  const persist = useCallback(
    async (next: T) => {
      const myVersion = ++saveVersionRef.current;
      // Always update overlay/status to the latest user intent. Older
      // in-flight saves will detect they're stale and bail out below.
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
        // Only the most recent successful save mutates UI state and broadcasts.
        if (myVersion !== saveVersionRef.current) return;
        lastSentRef.current = JSON.stringify(next);
        try { localStorage.setItem("gb-content-updated", `${section}|${Date.now()}`); } catch { /* noop */ }
        setStatus("saved");
        setTimeout(() => {
          // Only flip back if we're still on the same version (no newer save started).
          if (myVersion === saveVersionRef.current) {
            setStatus((s) => (s === "saved" ? "idle" : s));
          }
        }, 1400);
      } catch (e) {
        // Older save failed but a newer one is in flight — keep newer overlay.
        if (myVersion !== saveVersionRef.current) return;
        // Latest save failed — revert overlay to whatever remote currently is.
        setOverlay(null);
        lastSentRef.current = null;
        setStatus("error");
        setLastError(e instanceof Error ? e.message : "Save failed");
        setTimeout(() => {
          if (myVersion === saveVersionRef.current) {
            setStatus((s) => (s === "error" ? "idle" : s));
          }
        }, 2400);
      }
    },
    [authFetch, section],
  );

  const saveField = useCallback(
    async (path: string, value: unknown) => {
      if (!isAuthenticated) return;
      // Always derive next from the freshest local view (overlay if present
      // else remote) so rapid sequential field edits compose correctly.
      const base = (overlayRef.current ?? remote) as T;
      const next = setPath(base, path, value);
      await persist(next);
    },
    [isAuthenticated, remote, persist],
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
