import { useEffect, useRef, useState } from "react";
import type { BlogPost } from "@/data/blogPosts";

type Draft = { savedAt: string; post: BlogPost };
export function draftOwner(token: string | null): string {
  // Existing auth tokens are expiry.nonce.role.permissions.signature, not JWTs.
  // Super admin has one stable identity. Team drafts are session-isolated.
  if (token?.split(".")[2] === "super") return "super";
  let hash = 14695981039346656037n;
  for (const char of token ?? "") hash = BigInt.asUintN(64, (hash ^ BigInt(char.charCodeAt(0))) * 1099511628211n);
  return "session-" + hash.toString(16);
}
export function useCmsDraftRecovery(key: string, snapshot: () => BlogPost) {
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const [recovery, setRecovery] = useState<Draft | null>(null);
  const [message, setMessage] = useState("");
  const baseline = useRef("");
  const dirty = useRef(false);
  useEffect(() => {
    baseline.current = JSON.stringify(snapshotRef.current());
    dirty.current = false;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const value = JSON.parse(raw) as Draft;
        if (value.post && typeof value.post.content === "string" && value.savedAt && JSON.stringify(value.post) !== baseline.current) setRecovery(value);
      }
    } catch { setMessage("Browser draft storage is unavailable. Save drafts on the server regularly."); }
    const store = () => {
      const post = snapshotRef.current();
      dirty.current = JSON.stringify(post) !== baseline.current;
      if (!dirty.current) return;
      try {
        localStorage.setItem(key, JSON.stringify({ post, savedAt: new Date().toISOString() }));
        setMessage("Unsaved changes backed up on this browser only.");
      } catch { setMessage("Browser draft backup failed (storage full or blocked). Save or copy your text now."); }
    };
    const timer = window.setInterval(store, 2000);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      store();
      if (dirty.current) { event.preventDefault(); event.returnValue = ""; }
    };
    const visibility = () => { if (document.visibilityState === "hidden") store(); };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      store(); clearInterval(timer);
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [key]);
  function clear(savedStatus: "draft" | "published") {
    baseline.current = JSON.stringify({ ...snapshotRef.current(), status: savedStatus });
    dirty.current = false;
    try { localStorage.removeItem(key); } catch { /* Already shown by draft status. */ }
    setRecovery(null); setMessage("Saved on the server.");
  }
  function dismiss() {
    try { localStorage.removeItem(key); } catch { /* Optional browser storage. */ }
    setRecovery(null);
  }
  return { recovery, message, clear, dismiss };
}
