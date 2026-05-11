import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, SaveBar } from "@/components/admin/AdminField";
import {
  Plus, Trash2, ChevronDown, ChevronUp, ShieldCheck, ShieldX,
  Copy, ExternalLink, Download, Search, X, ChevronLeft, ChevronRight,
  Calendar, RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx";

import { API_BASE } from "@/lib/api";
const PAGE_SIZE = 20;

interface Certificate {
  id: number;
  certificateId: string;
  name: string;
  email: string | null;
  role: string;
  issueDate: string;
  status: "verified" | "revoked";
  createdAt: string;
}

const STATUSES = ["verified", "revoked"] as const;

const DATE_PRESETS = [
  { key: "all",  label: "All time"    },
  { key: "7d",   label: "Last 7 days" },
  { key: "30d",  label: "Last 30 days"},
  { key: "90d",  label: "Last 90 days"},
  { key: "1y",   label: "Last year"   },
];

const DATE_MS: Record<string, number> = {
  "7d":  7  * 86400 * 1000,
  "30d": 30 * 86400 * 1000,
  "90d": 90 * 86400 * 1000,
  "1y":  365 * 86400 * 1000,
};

function generateId(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `GB-${year}-${rand}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function applyDateFilter(certs: Certificate[], df: string): Certificate[] {
  if (df === "all") return certs;
  const cutoff = Date.now() - DATE_MS[df];
  return certs.filter((c) => new Date(c.createdAt).getTime() >= cutoff);
}

function matchSearch(cert: Certificate, q: string): boolean {
  if (!q) return true;
  const lq = q.toLowerCase();
  return (
    cert.name.toLowerCase().includes(lq) ||
    cert.certificateId.toLowerCase().includes(lq) ||
    cert.role.toLowerCase().includes(lq) ||
    (cert.email ?? "").toLowerCase().includes(lq)
  );
}

/* ── Certificate Row (edit panel) ── */
function CertRow({
  cert, onUpdate, onDelete,
}: {
  cert: Certificate;
  onUpdate: (cert: Certificate) => void;
  onDelete: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...cert });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const { authFetch } = useAdmin();

  const set = (patch: Partial<typeof form>) => { setForm((p) => ({ ...p, ...patch })); setSaved(false); };

  async function handleSave() {
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/certificates/${cert.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, role: form.role, issueDate: form.issueDate, status: form.status }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); alert(err.error || "Save failed"); return; }
      const updated = await res.json();
      onUpdate(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function copyLink() {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}verify/${cert.certificateId}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const verifyUrl = `${import.meta.env.BASE_URL}verify/${cert.certificateId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(window.location.origin + "/" + verifyUrl.replace(/^\//, ""))}`;

  return (
    <div className="border border-[#0B0B0B]/8 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center gap-2 pr-3 hover:bg-[#0B0B0B]/3 transition-colors">
        <button onClick={() => setOpen((p) => !p)} className="flex-1 flex items-center gap-3 px-4 py-3.5 text-left min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {cert.status === "verified"
                ? <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                : <ShieldX size={14} className="text-red-400 shrink-0" />}
              <p className="text-[13px] font-semibold text-[#0B0B0B] truncate">{cert.name}</p>
              <span className="text-[10px] font-bold text-[#0B0B0B]/40 bg-[#0B0B0B]/6 px-2 py-0.5 rounded-full shrink-0 font-mono">
                {cert.certificateId}
              </span>
            </div>
            <p className="text-[11px] text-[#0B0B0B]/40 mt-0.5">{cert.role} &middot; {cert.issueDate}</p>
          </div>
          {open ? <ChevronUp size={14} className="text-[#0B0B0B]/40 shrink-0" /> : <ChevronDown size={14} className="text-[#0B0B0B]/40 shrink-0" />}
        </button>
        <button onClick={() => onDelete(cert.id)} className="p-1.5 rounded hover:bg-red-50 hover:text-red-500 text-[#0B0B0B]/30 transition-colors shrink-0">
          <Trash2 size={14} />
        </button>
      </div>

      {open && (
        <div className="border-t border-[#0B0B0B]/8 px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full Name" value={form.name} onChange={(e) => set({ name: e.target.value })} />
            <Input label="Email (optional)" value={form.email || ""} onChange={(e) => set({ email: e.target.value })} />
            <Input label="Role / Program" value={form.role} onChange={(e) => set({ role: e.target.value })} placeholder="Intern, Contributor, etc." />
            <Input label="Issue Date" value={form.issueDate} onChange={(e) => set({ issueDate: e.target.value })} placeholder="e.g. January 2025" />
            <div className="col-span-2">
              <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-2 uppercase tracking-wider">Status</label>
              <div className="flex gap-2">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => set({ status: s })}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors ${form.status === s ? s === "verified" ? "bg-emerald-500 text-white" : "bg-red-400 text-white" : "bg-[#0B0B0B]/6 text-[#0B0B0B]/50 hover:bg-[#0B0B0B]/10"}`}>
                    {s === "verified" ? <ShieldCheck size={13} /> : <ShieldX size={13} />}
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-[#0B0B0B]/8 rounded-xl p-4 flex gap-6 items-start bg-[#F7F7F5]">
            <img src={qrUrl} alt="QR Code" className="w-20 h-20 shrink-0 rounded-lg" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-[#0B0B0B]/40 uppercase tracking-wider mb-1">Certificate ID</p>
              <p className="text-[15px] font-bold text-[#0B0B0B] font-mono mb-2">{cert.certificateId}</p>
              <p className="text-[11px] text-[#0B0B0B]/40 mb-3 truncate">{verifyUrl}</p>
              <div className="flex gap-2">
                <button onClick={copyLink} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0B0B0B]/60 hover:text-[#0B0B0B] transition-colors">
                  <Copy size={12} />{copied ? "Copied!" : "Copy link"}
                </button>
                <a href={verifyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0B0B0B]/60 hover:text-[#0B0B0B] transition-colors">
                  <ExternalLink size={12} />Preview
                </a>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            {saved && <span className="text-[12px] text-emerald-500 font-semibold self-center">Saved</span>}
            <button onClick={handleSave} disabled={saving} className="bg-[#0B0B0B] text-white text-[13px] font-semibold px-4 py-2 rounded-xl hover:bg-[#0B0B0B]/85 transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main page ── */
export default function AdminCertificates() {
  const { authFetch } = useAdmin();
  const [certs, setCerts]           = useState<Certificate[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showNew, setShowNew]       = useState(false);
  const [creating, setCreating]     = useState(false);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "revoked">("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage]             = useState(1);
  const [newForm, setNewForm]       = useState({
    certificateId: generateId(),
    name: "", email: "", role: "", issueDate: "",
    status: "verified" as "verified" | "revoked",
  });

  async function load() {
    setLoading(true);
    try {
      const r = await authFetch(`${API_BASE}/admin/certificates`);
      const data = await r.json();
      if (Array.isArray(data)) setCerts(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [authFetch]);

  useEffect(() => { setPage(1); }, [search, statusFilter, dateFilter]);

  async function handleCreate() {
    if (!newForm.certificateId || !newForm.name || !newForm.role || !newForm.issueDate) {
      alert("Certificate ID, name, role, and issue date are required.");
      return;
    }
    setCreating(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Creation failed"); return; }
      setCerts((p) => [data, ...p]);
      setShowNew(false);
      setNewForm({ certificateId: generateId(), name: "", email: "", role: "", issueDate: "", status: "verified" });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this certificate? This cannot be undone.")) return;
    await authFetch(`${API_BASE}/admin/certificates/${id}`, { method: "DELETE" });
    setCerts((p) => p.filter((c) => c.id !== id));
  }

  /* Filtering */
  let visible = applyDateFilter(certs, dateFilter);
  if (statusFilter !== "all") visible = visible.filter((c) => c.status === statusFilter);
  if (search) visible = visible.filter((c) => matchSearch(c, search));

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const paginated = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const verified = certs.filter((c) => c.status === "verified").length;
  const revoked  = certs.filter((c) => c.status === "revoked").length;

  function exportExcel() {
    const rows = visible.map((c) => ({
      ID: c.id,
      "Certificate ID": c.certificateId,
      Name: c.name,
      Email: c.email || "",
      Role: c.role,
      "Issue Date": c.issueDate,
      Status: c.status,
      "Created At": fmtDate(c.createdAt),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Certificates");
    XLSX.writeFile(wb, "growitbuddy-certificates.xlsx");
  }

  return (
    <div>
      <PageHeader
        title="Certificates"
        description="Issue and manage certificates for interns, contributors, and collaborators."
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total",    value: certs.length, color: "#0B0B0B",  active: statusFilter === "all" },
          { label: "Verified", value: verified,      color: "#10b981",  active: statusFilter === "verified" },
          { label: "Revoked",  value: revoked,       color: "#f87171",  active: statusFilter === "revoked" },
        ].map(({ label, value, color, active }) => (
          <button
            key={label}
            onClick={() => setStatusFilter(label.toLowerCase() as typeof statusFilter)}
            className={`text-center py-4 rounded-xl border transition-all ${active ? "border-[#0B0B0B]/20 bg-white shadow-sm" : "border-[#0B0B0B]/8 bg-white hover:border-[#0B0B0B]/15"}`}
          >
            <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", color }}>{value}</p>
            <p className="text-[12px] text-[#0B0B0B]/40 font-semibold uppercase tracking-wider mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0B0B0B]/35" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, certificate ID, role, email..."
            className="w-full pl-9 pr-9 py-2.5 border border-[#0B0B0B]/12 rounded-xl text-[13px] text-[#0B0B0B] placeholder-[#0B0B0B]/30 outline-none focus:border-[#0B0B0B]/30 bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0B0B0B]/30 hover:text-[#0B0B0B]">
              <X size={13} />
            </button>
          )}
        </div>
        <button onClick={load} className="p-2.5 border border-[#0B0B0B]/12 rounded-xl hover:bg-[#0B0B0B]/5 text-[#0B0B0B]/50 transition-colors">
          <RefreshCw size={15} />
        </button>
        <button
          onClick={exportExcel}
          disabled={visible.length === 0}
          className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-xl border border-[#0B0B0B]/12 text-[#0B0B0B]/60 hover:text-[#0B0B0B] hover:border-[#0B0B0B]/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-white"
        >
          <Download size={14} /> Export Excel
        </button>
        <button
          onClick={() => setShowNew((p) => !p)}
          className="flex items-center gap-2 bg-[#0B0B0B] text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0B0B0B]/85 transition-colors"
        >
          <Plus size={15} /> Issue Certificate
        </button>
      </div>

      {/* Date filter chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Calendar size={12} className="text-[#0B0B0B]/30 shrink-0" />
        <span className="text-[10px] font-bold text-[#0B0B0B]/35 uppercase tracking-widest mr-1">Period:</span>
        {DATE_PRESETS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setDateFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${dateFilter === key ? "bg-[#8B3A1A] border-[#8B3A1A] text-white" : "bg-white border-[#0B0B0B]/12 text-[#0B0B0B]/55 hover:border-[#0B0B0B]/25"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* New cert form */}
      {showNew && (
        <Card className="mb-5">
          <SectionTitle>New Certificate</SectionTitle>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="col-span-2 flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="Certificate ID"
                  value={newForm.certificateId}
                  onChange={(e) => setNewForm((p) => ({ ...p, certificateId: e.target.value.toUpperCase() }))}
                  placeholder="GB-2025-XXXXX"
                />
              </div>
              <button
                onClick={() => setNewForm((p) => ({ ...p, certificateId: generateId() }))}
                className="px-3 py-2 text-[12px] font-semibold text-[#0B0B0B]/50 hover:text-[#0B0B0B] bg-[#0B0B0B]/6 rounded-xl hover:bg-[#0B0B0B]/10 transition-colors shrink-0 mb-0.5"
              >
                Auto-generate
              </button>
            </div>
            <Input label="Full Name" value={newForm.name} onChange={(e) => setNewForm((p) => ({ ...p, name: e.target.value }))} />
            <Input label="Email (optional)" value={newForm.email} onChange={(e) => setNewForm((p) => ({ ...p, email: e.target.value }))} />
            <Input label="Role / Program" value={newForm.role} onChange={(e) => setNewForm((p) => ({ ...p, role: e.target.value }))} placeholder="Content Marketing Intern" />
            <Input label="Issue Date" value={newForm.issueDate} onChange={(e) => setNewForm((p) => ({ ...p, issueDate: e.target.value }))} placeholder="January 2025" />
            <div className="col-span-2">
              <label className="block text-[12px] font-semibold text-[#0B0B0B]/60 mb-2 uppercase tracking-wider">Status</label>
              <div className="flex gap-2">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => setNewForm((p) => ({ ...p, status: s }))}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors ${newForm.status === s ? s === "verified" ? "bg-emerald-500 text-white" : "bg-red-400 text-white" : "bg-[#0B0B0B]/6 text-[#0B0B0B]/50 hover:bg-[#0B0B0B]/10"}`}>
                    {s === "verified" ? <ShieldCheck size={13} /> : <ShieldX size={13} />}
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowNew(false)} className="px-4 py-2 text-[13px] text-[#0B0B0B]/50 hover:text-[#0B0B0B] transition-colors">Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="bg-[#0B0B0B] text-white text-[13px] font-semibold px-5 py-2 rounded-xl hover:bg-[#0B0B0B]/85 transition-colors disabled:opacity-50">
              {creating ? "Creating..." : "Issue Certificate"}
            </button>
          </div>
        </Card>
      )}

      {/* Results info */}
      {!loading && certs.length > 0 && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] text-[#0B0B0B]/40">
            {visible.length === certs.length
              ? `${certs.length} certificate${certs.length !== 1 ? "s" : ""}`
              : `${visible.length} of ${certs.length} certificates`}
            {(search || statusFilter !== "all" || dateFilter !== "all") && " · filtered"}
          </p>
          {(search || statusFilter !== "all" || dateFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setStatusFilter("all"); setDateFilter("all"); }}
              className="text-[11px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] flex items-center gap-1 transition-colors"
            >
              <X size={10} /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-[#0B0B0B]/30 text-sm">Loading certificates...</div>
      ) : visible.length === 0 ? (
        <Card className="text-center py-12">
          <ShieldCheck size={28} className="mx-auto text-[#0B0B0B]/15 mb-3" />
          <p className="text-[14px] font-semibold text-[#0B0B0B]/40">
            {search || statusFilter !== "all" ? "No matching certificates" : "No certificates yet"}
          </p>
          <p className="text-[12px] text-[#0B0B0B]/25 mt-1">
            {search || statusFilter !== "all" ? "Try different search terms or clear the filter" : "Click \"Issue Certificate\" to create your first one."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {paginated.map((cert) => (
            <CertRow
              key={cert.id}
              cert={cert}
              onUpdate={(updated) => setCerts((p) => p.map((c) => (c.id === updated.id ? updated : c)))}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-[12px] text-[#0B0B0B]/40">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-[#0B0B0B]/12 disabled:opacity-30 hover:bg-[#0B0B0B]/5 transition-colors">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((pg) => (
              <button key={pg} onClick={() => setPage(pg)} className={`w-8 h-8 rounded-xl text-[12px] font-semibold transition-colors ${pg === page ? "bg-[#0B0B0B] text-white" : "border border-[#0B0B0B]/12 text-[#0B0B0B]/50 hover:bg-[#0B0B0B]/5"}`}>
                {pg}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-[#0B0B0B]/12 disabled:opacity-30 hover:bg-[#0B0B0B]/5 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
