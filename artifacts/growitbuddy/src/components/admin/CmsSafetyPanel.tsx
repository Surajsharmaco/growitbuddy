import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { API_BASE } from "@/lib/api";
import { cmsRequest, notifyCmsChanged, type CmsCollection } from "@/lib/cmsSafetyClient";
import type { BlogPost } from "@/data/blogPosts";
import { marked } from "marked";
import safetyGuide from "../../../../../docs/growitbuddy-data-safety-guide.md?raw";
import driveScript from "../../../../../docs/growitbuddy-drive-backup.gs?raw";

type Backup = { id: string; reason: string; created_at: string; blogs: number; pages: number };
type KeyInfo = { id: string; revoked: boolean; expires_at: string };
type Plan = { expectedState: string; plan: Record<string, { missing: number; existingSkipped: number }> };
type Revision = { id: string; slug: string; title: string; reason: string; created_at: string };
function downloadSafetyFile(filename: string, type: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function CmsSafetyPanel() {
  const { authFetch } = useAdmin();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [document, setDocument] = useState<unknown>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [newKey, setNewKey] = useState("");
  const [section, setSection] = useState("blog");
  const [sections, setSections] = useState(["blog", "cms-pages"]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const refresh = useCallback(async () => {
    const [b, k] = await Promise.all([
      cmsRequest<{ backups: Backup[]; sections: string[] }>(authFetch, "/backups"),
      cmsRequest<{ keys: KeyInfo[] }>(authFetch, "/offsite-keys"),
    ]);
    setBackups(b.backups); setSections(b.sections); setKeys(k.keys);
  }, [authFetch]);
  useEffect(() => { refresh().catch((e) => setError(e.message)); }, [refresh]);
  async function action(fn: () => Promise<void>) {
    setBusy(true); setError(""); setNotice("");
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Operation failed."); }
    finally { setBusy(false); }
  }
  async function getDocument(id: string) {
    return cmsRequest<unknown>(authFetch, `/backups/${id}/download`);
  }
  async function download(id: string) {
    const doc = await getDocument(id);
    const url = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" }));
    const a = window.document.createElement("a");
    a.href = url; a.download = `growitbuddy-cms-${id}.json`; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("JSON downloaded. It contains blog/page text, not image bytes. Store it privately outside this database.");
  }
  async function preview(doc: unknown) {
    setPlan(null); setConfirmText("");
    const result = await cmsRequest<Plan>(authFetch, "/restore/preview", "POST", { document: doc });
    setDocument(doc); setPlan(result);
  }
  async function recoverRevision(id: string) {
    const revision = await cmsRequest<{ post: BlogPost }>(authFetch, `/${section}/revisions/${id}`);
    const current = await cmsRequest<CmsCollection>(authFetch, `/${section}`);
    const existing = current.data.posts.find((p) => p.slug === revision.post.slug);
    if (!confirm(`Restore "${revision.post.title}" as a draft? ${existing ? "This replaces the current saved version; it will be kept in history." : "The missing post will be recreated."} It will not be published.`)) return;
    await cmsRequest(authFetch, `/${section}`, "PATCH", {
      operations: [{ type: "upsert", previousSlug: revision.post.slug, expectedVersion: current.versions[revision.post.slug] ?? null,
        post: { ...revision.post, status: "draft", trashed: false } }],
    });
    notifyCmsChanged(section);
    setNotice("Revision restored as a draft. Review it in Blogs/Pages before publishing.");
  }
  return <section className="mb-6 rounded-2xl border border-[#ECECE7] bg-white p-5 space-y-4">
    <h2 className="text-lg font-bold">Blog & page data safety</h2>
    <button type="button" className="text-sm font-semibold underline" onClick={() => {
      const code = driveScript.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const html = `<!doctype html><html lang="hi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GrowitBuddy data safety guide</title><style>body{max-width:960px;margin:24px auto;padding:20px;font-family:system-ui,sans-serif;line-height:1.75;color:#162033}h1,h2,h3{line-height:1.4}table{display:block;overflow:auto;border-collapse:collapse}th,td{border:1px solid #ddd;padding:10px;text-align:left;min-width:140px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f5f5f5;padding:18px;border-radius:12px;font-size:12px}</style><body>${marked.parse(safetyGuide, { async: false })}<h2>Google Apps Script — copy into your private project</h2><pre>${code}</pre></body></html>`;
      downloadSafetyFile("growitbuddy-data-safety-guide.html", "text/html;charset=utf-8", html);
    }}>Download safety & recovery guide</button>
    <p className="text-sm leading-relaxed text-gray-600">
      Saves change only the edited posts and reject stale versions. Up to 20 prior versions per post,
      30 daily database snapshots and 60 other snapshots are retained. Database snapshots are <strong>not independent backups</strong>.
      Download JSON and the content + photos ZIP below, then keep private copies in Drive and on your computer.
    </p>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    <button type="button" disabled={busy} className="rounded-lg bg-[#1E293B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      onClick={() => void action(async () => { const { id } = await cmsRequest<{ id: string }>(authFetch, "/backups", "POST", {}); await download(id); await refresh(); })}>
      Create & download CMS JSON backup
    </button>
    <button type="button" disabled={busy} className="ml-3 text-sm underline" onClick={() => void action(refresh)}>Refresh safety status</button>
    <div className="max-h-64 overflow-auto space-y-2">
      {!backups.length && !error && <p className="text-sm">No snapshots yet. Create your first backup.</p>}
      {backups.map((b) => <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs">
        <span>{new Date(b.created_at).toLocaleString()} · {b.reason} · {b.blogs} blogs / {b.pages} pages</span>
        <div className="flex gap-3">
          <button type="button" disabled={busy} className="underline" onClick={() => void action(() => download(b.id))}>Download JSON</button>
          <button type="button" disabled={busy} className="underline" onClick={() => void action(async () => preview(await getDocument(b.id)))}>Preview restore</button>
        </div>
      </div>)}
    </div>
    <div className="rounded-xl border p-4 space-y-3">
      <h3 className="font-semibold">Restore missing posts from a JSON backup</h3>
      <p className="text-xs leading-relaxed">Existing URLs are skipped, never overwritten. Missing posts (including archived ones) return as drafts.
        A before-restore snapshot is created automatically. Images are not restored by this JSON tool.</p>
      <input type="file" accept=".json,application/json" disabled={busy} aria-label="Choose CMS safety JSON backup" className="block w-full text-sm"
        onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setPlan(null);
          void action(async () => { if (f.size > 49 * 1024 * 1024) throw new Error("Backup exceeds the 49MB upload limit. Ask for a staged restore."); await preview(JSON.parse(await f.text())); }); }} />
      {plan && <div className="space-y-3 text-sm">
        {Object.entries(plan.plan).map(([key, p]) => <p key={key}>{key}: {p.missing} missing to restore; {p.existingSkipped} existing URLs skipped.</p>)}
        <label className="block">Type <strong>RESTORE MISSING POSTS</strong> to confirm
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="mt-1 w-full rounded-lg border p-2" />
        </label>
        <button type="button" disabled={busy || confirmText !== "RESTORE MISSING POSTS"} className="rounded-lg bg-amber-700 px-4 py-2 text-white disabled:opacity-40"
          onClick={() => void action(async () => {
            await cmsRequest(authFetch, "/restore", "POST", { document, expectedState: plan.expectedState, confirm: confirmText });
            notifyCmsChanged("blog"); notifyCmsChanged("cms-pages"); setPlan(null); setConfirmText("");
            setNotice("Missing posts restored as drafts. Existing posts were not overwritten. Review before publishing."); await refresh();
          })}>Restore missing posts as drafts</button>
      </div>}
    </div>
    <details className="rounded-xl border p-4">
      <summary className="cursor-pointer font-semibold">Recover an earlier or permanently deleted article</summary>
      <p className="mt-3 text-xs">Revisions begin when this safety feature is enabled. Up to 20 per post are retained; no old history can be reconstructed.</p>
      <select aria-label="Revision collection" value={section} onChange={(e) => { setSection(e.target.value); setRevisions([]); }} className="my-3 rounded border p-2 text-sm">
        {sections.map((s) => <option key={s} value={s}>{s === "blog" ? "Blogs" : s === "cms-pages" ? "Pages" : s}</option>)}
      </select>
      <button type="button" disabled={busy} className="ml-3 text-sm underline" onClick={() => void action(async () => {
        setRevisions((await cmsRequest<{ revisions: Revision[] }>(authFetch, `/${section}/revisions`)).revisions);
      })}>Load recent revisions</button>
      <div className="max-h-60 overflow-auto">{revisions.map((r) => <div key={r.id} className="border-t py-2 text-xs flex flex-wrap justify-between gap-2">
        <span>{r.title} · {new Date(r.created_at).toLocaleString()} · {r.reason}</span>
        <button type="button" disabled={busy} className="underline" onClick={() => void action(() => recoverRevision(r.id))}>Restore as draft</button>
      </div>)}</div>
    </details>
    <details className="rounded-xl border p-4">
      <summary className="cursor-pointer font-semibold">Independent Google Drive backup setup</summary>
      <button type="button" className="mt-3 text-sm underline" onClick={() => downloadSafetyFile("growitbuddy-drive-backup.gs", "text/plain;charset=utf-8", driveScript)}>Download Google Drive backup script</button>
      <p className="my-3 text-xs leading-relaxed">Not active automatically. Install the supplied Apps Script in your own Google account, store a backup-only key in Script Properties, and run setup.
        It exports CMS JSON daily and copies uploaded media in hourly batches. Check the first full media backup completes. External image URLs are not included.
        This key can only download backup data; it cannot edit or delete content. Keys expire after 90 days.</p>
      <button type="button" disabled={busy} className="text-sm underline" onClick={() => void action(async () => {
        const created = await cmsRequest<{ key: string }>(authFetch, "/offsite-keys", "POST", {});
        setNewKey(created.key); setNotice("Backup-only key created. Copy it privately into Apps Script Properties; never into a public repository or chat."); await refresh();
      })}>Create backup-only key</button>
      {newKey && <div className="my-3 space-y-2">
        <label className="text-xs block">One-time key — keep private<input type="password" readOnly value={newKey} className="mt-1 w-full rounded border p-2" /></label>
        <button type="button" className="text-sm underline" onClick={() => void action(async () => {
          await navigator.clipboard.writeText(newKey); setNotice("Key copied. Paste into Apps Script Properties only.");
        })}>Copy key</button>
        <button type="button" className="ml-3 text-sm underline" onClick={() => setNewKey("")}>Hide key</button>
      </div>}
      {keys.map((k) => <div key={k.id} className="mt-2 border-t pt-2 text-xs flex justify-between gap-2">
        <span>{k.revoked ? "Revoked" : "Backup key"} · expires {new Date(k.expires_at).toLocaleDateString()}</span>
        {!k.revoked && <button type="button" disabled={busy} className="underline" onClick={() => {
          if (confirm("Revoke this key? Any scheduled backup using it will stop until you replace it.")) void action(async () => { await cmsRequest(authFetch, `/offsite-keys/${k.id}`, "DELETE"); await refresh(); });
        }}>Revoke</button>}
      </div>)}
      <p className="mt-3 text-xs text-gray-500">API base for Apps Script: {API_BASE}. Use the verified production Render API, not the preview API.</p>
    </details>
  </section>;
}
