import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { cmsRequest } from "@/lib/cmsSafetyClient";
import type { BlogPost } from "@/data/blogPosts";

type Revision = { id: string; slug: string; title: string; reason: string; created_at: string };
export function CmsVersionHistory({ section, slug, onLoad }: {
  section: string; slug: string; onLoad: (post: BlogPost) => void;
}) {
  const { authFetch } = useAdmin();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Revision[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    setOpen(true); setBusy(true); setError("");
    try { setRows((await cmsRequest<{ revisions: Revision[] }>(authFetch, `/${section}/revisions?slug=${encodeURIComponent(slug)}`)).revisions); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load history."); }
    finally { setBusy(false); }
  }
  async function select(id: string) {
    if (!confirm("Load this earlier version into the editor as a draft? Unsaved editor changes will be replaced. The live post will not change until you save.")) return;
    setBusy(true); setError("");
    try {
      const result = await cmsRequest<{ post: BlogPost }>(authFetch, `/${section}/revisions/${id}`);
      onLoad({ ...result.post, slug, status: "draft", trashed: false });
      setOpen(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load revision."); }
    finally { setBusy(false); }
  }
  return <div className="mb-4">
    <button type="button" onClick={() => open ? setOpen(false) : void load()} className="text-xs font-semibold border rounded-lg px-3 py-2">
      {open ? "Close version history" : "Version history"}
    </button>
    {open && <div className="mt-2 rounded-xl border bg-white p-4 text-sm space-y-3">
      <p>Up to 20 earlier versions per post. Loading one does not publish it.</p>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {busy && <p>Loading…</p>}
      {!busy && !error && rows.length === 0 && <p>No earlier saved versions yet. History starts after the safety feature is enabled.</p>}
      {rows.map((r) => <div key={r.id} className="flex flex-wrap gap-2 justify-between border-t pt-2">
        <span>{new Date(r.created_at).toLocaleString()} · {r.reason}</span>
        <button type="button" disabled={busy} onClick={() => void select(r.id)} className="font-semibold underline">Load as draft</button>
      </div>)}
    </div>}
  </div>;
}
