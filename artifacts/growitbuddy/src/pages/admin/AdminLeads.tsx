import { useEffect, useState, useCallback, useRef } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card } from "@/components/admin/AdminField";
import {
  Trash2, Download, RefreshCw, Search, Mail, User, Clock,
  Calendar, X, ChevronLeft, ChevronRight, SlidersHorizontal,
  CheckSquare, Square, Tag, FileText, ArrowUpDown,
} from "lucide-react";
import ExcelJS from "exceljs";

import { API_BASE } from "@/lib/api";
const PAGE_SIZE = 25;

interface Lead {
  id: number;
  type: string;
  name: string | null;
  email: string;
  data: Record<string, unknown>;
  status: string;
  notes: string;
  createdAt: string;
}

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  contact:       { label: "Contact",    color: "#2563eb", bg: "#eff6ff" },
  creator:       { label: "Influencer", color: "#1E293B", bg: "#e8edf2" },
  "page-owner":  { label: "Page Owner", color: "#0891b2", bg: "#ecfeff" },
  page:          { label: "Page Owner", color: "#0891b2", bg: "#ecfeff" },
  freelancer:    { label: "Freelancer", color: "#059669", bg: "#ecfdf5" },
  "full-time":   { label: "Full-Time",  color: "#d97706", bg: "#fffbeb" },
  internship:    { label: "Internship", color: "#be185d", bg: "#fdf2f8" },
  newsletter:    { label: "Newsletter", color: "#db2777", bg: "#fdf2f8" },
};

const LEAD_STATUSES = [
  { key: "new",        label: "New",        color: "#2563eb", bg: "#eff6ff" },
  { key: "reviewed",   label: "Reviewed",   color: "#6b7280", bg: "#f3f4f6" },
  { key: "contacted",  label: "Contacted",  color: "#0891b2", bg: "#ecfeff" },
  { key: "approved",   label: "Approved",   color: "#059669", bg: "#ecfdf5" },
  { key: "rejected",   label: "Rejected",   color: "#dc2626", bg: "#fef2f2" },
  { key: "archived",   label: "Archived",   color: "#9ca3af", bg: "#f9fafb" },
];

const DATE_PRESETS = [
  { key: "all",  label: "All time"    },
  { key: "24h",  label: "Last 24 hrs" },
  { key: "7d",   label: "Last 7 days" },
  { key: "30d",  label: "Last 30 days"},
  { key: "90d",  label: "Last 90 days"},
  { key: "1y",   label: "Last year"   },
];

const DATE_MS: Record<string, number> = {
  "24h": 24 * 3600 * 1000,
  "7d":  7  * 86400 * 1000,
  "30d": 30 * 86400 * 1000,
  "90d": 90 * 86400 * 1000,
  "1y":  365 * 86400 * 1000,
};

function applyDateFilter(leads: Lead[], df: string): Lead[] {
  if (df === "all") return leads;
  const cutoff = Date.now() - DATE_MS[df];
  return leads.filter((l) => new Date(l.createdAt).getTime() >= cutoff);
}

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function fmtShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function matchSearch(lead: Lead, q: string): boolean {
  if (!q) return true;
  const lq = q.toLowerCase();
  if ((lead.name ?? "").toLowerCase().includes(lq)) return true;
  if (lead.email.toLowerCase().includes(lq)) return true;
  if (lead.status.toLowerCase().includes(lq)) return true;
  if (lead.notes.toLowerCase().includes(lq)) return true;
  const dataStr = Object.values(lead.data).map(String).join(" ").toLowerCase();
  return dataStr.includes(lq);
}

function TypeBadge({ type }: { type: string }) {
  const m = TYPE_META[type] ?? { label: type, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 100, background: m.bg, color: m.color, whiteSpace: "nowrap" }}>
      {m.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = LEAD_STATUSES.find((x) => x.key === status) ?? { label: status, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 100, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

/* ── Detail Drawer ── */
function LeadDrawer({
  lead,
  onClose,
  onStatusChange,
  onNotesChange,
  onDelete,
}: {
  lead: Lead;
  onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
  onNotesChange: (id: number, notes: string) => void;
  onDelete: (id: number) => void;
}) {
  const [notes, setNotes] = useState(lead.notes);
  const [saving, setSaving] = useState(false);
  const { authFetch } = useAdmin();

  useEffect(() => { setNotes(lead.notes); }, [lead.id, lead.notes]);

  async function saveNotes() {
    setSaving(true);
    try {
      await authFetch(`${API_BASE}/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      onNotesChange(lead.id, notes);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(newStatus: string) {
    await authFetch(`${API_BASE}/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    onStatusChange(lead.id, newStatus);
  }

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="flex-1 bg-black/20" />
      {/* Drawer */}
      <div
        className="w-full max-w-[460px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#0B0B0B]/8 sticky top-0 bg-white z-10">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#0B0B0B]/6 text-[#0B0B0B]/40 transition-colors">
            <X size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-[#0B0B0B] truncate">{lead.name || lead.email}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <TypeBadge type={lead.type} />
              <StatusBadge status={lead.status} />
            </div>
          </div>
          <button
            onClick={() => onDelete(lead.id)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Contact info */}
          <div>
            <p className="text-[10px] font-bold text-[#0B0B0B]/35 uppercase tracking-widest mb-2">Contact Info</p>
            <div className="space-y-2">
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-[#0B0B0B]/30 shrink-0" />
                  <a href={`mailto:${lead.email}`} className="text-[13px] text-[#1E293B] hover:underline">{lead.email}</a>
                </div>
              )}
              {lead.name && (
                <div className="flex items-center gap-2">
                  <User size={13} className="text-[#0B0B0B]/30 shrink-0" />
                  <span className="text-[13px] text-[#0B0B0B]">{lead.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-[#0B0B0B]/30 shrink-0" />
                <span className="text-[12px] text-[#0B0B0B]/50">{fmt(lead.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-[10px] font-bold text-[#0B0B0B]/35 uppercase tracking-widest mb-2">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {LEAD_STATUSES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => changeStatus(s.key)}
                  style={lead.status === s.key ? { background: s.bg, color: s.color, borderColor: s.color + "60" } : {}}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${
                    lead.status === s.key
                      ? "border-current"
                      : "border-[#0B0B0B]/10 text-[#0B0B0B]/45 hover:border-[#0B0B0B]/25 hover:text-[#0B0B0B]/60"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submission data */}
          {Object.keys(lead.data).length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#0B0B0B]/35 uppercase tracking-widest mb-2">Submission Data</p>
              <div className="rounded-xl border border-[#0B0B0B]/8 divide-y divide-[#0B0B0B]/5 overflow-hidden">
                {Object.entries(lead.data).filter(([, v]) => v != null && v !== "").map(([k, v]) => (
                  <div key={k} className="px-4 py-2.5 flex gap-3">
                    <span className="text-[11px] font-semibold text-[#0B0B0B]/40 uppercase tracking-wide w-28 shrink-0">{k}</span>
                    <span className="text-[12px] text-[#0B0B0B] break-words flex-1">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-[10px] font-bold text-[#0B0B0B]/35 uppercase tracking-widest mb-2">Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes about this lead..."
              rows={4}
              className="w-full border border-[#0B0B0B]/12 rounded-xl px-4 py-3 text-[13px] text-[#0B0B0B] placeholder-[#0B0B0B]/30 outline-none focus:border-[#0B0B0B]/30 resize-none bg-white"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={saveNotes}
                disabled={saving || notes === lead.notes}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B0B0B] text-white text-[12px] font-semibold disabled:opacity-40 transition-colors hover:bg-[#0B0B0B]/85"
              >
                <FileText size={12} />
                {saving ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function AdminLeads() {
  const [leads, setLeads]               = useState<Lead[]>([]);
  const [loading, setLoading]           = useState(true);
  const [typeFilter, setTypeFilter]     = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter]     = useState("all");
  const [search, setSearch]             = useState("");
  const [sortDir, setSortDir]           = useState<"desc" | "asc">("desc");
  const [page, setPage]                 = useState(1);
  const [selected, setSelected]         = useState<Set<number>>(new Set());
  const [drawer, setDrawer]             = useState<Lead | null>(null);
  const [filtersOpen, setFiltersOpen]   = useState(false);
  const [bulkStatus, setBulkStatus]     = useState("");

  const { authFetch } = useAdmin();
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await authFetch(`${API_BASE}/admin/leads`);
      const data = await r.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  /* Reset page on filter change */
  useEffect(() => { setPage(1); }, [typeFilter, statusFilter, dateFilter, search, sortDir]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this lead permanently?")) return;
    await authFetch(`${API_BASE}/admin/leads/${id}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l.id !== id));
    if (drawer?.id === id) setDrawer(null);
  }

  function handleStatusChange(id: number, status: string) {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    if (drawer?.id === id) setDrawer((d) => d ? { ...d, status } : d);
  }

  function handleNotesChange(id: number, notes: string) {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, notes } : l));
    if (drawer?.id === id) setDrawer((d) => d ? { ...d, notes } : d);
  }

  async function handleBulkStatus() {
    if (!bulkStatus || selected.size === 0) return;
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) =>
      authFetch(`${API_BASE}/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: bulkStatus }),
      })
    ));
    setLeads((prev) => prev.map((l) => selected.has(l.id) ? { ...l, status: bulkStatus } : l));
    setSelected(new Set());
    setBulkStatus("");
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} lead(s) permanently?`)) return;
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) =>
      authFetch(`${API_BASE}/admin/leads/${id}`, { method: "DELETE" })
    ));
    setLeads((prev) => prev.filter((l) => !selected.has(l.id)));
    setSelected(new Set());
  }

  /* Date-filtered base — used for counts so chips reflect active period */
  const dateFiltered = applyDateFilter(leads, dateFilter);

  /* Type-filtered base — byStatus counts must match what the list will actually show */
  const typeFiltered = typeFilter !== "all"
    ? dateFiltered.filter((l) => l.type === typeFilter)
    : dateFiltered;

  /* byType: counts for the type-chip strip (date window only, all types) */
  const byType: Record<string, number> = {};
  for (const l of dateFiltered) {
    byType[l.type] = (byType[l.type] ?? 0) + 1;
  }

  /* byStatus: counts scoped to both date window AND active type filter */
  const byStatus: Record<string, number> = {};
  for (const l of typeFiltered) {
    byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
  }

  /* Filtering pipeline */
  let visible = typeFiltered;
  if (statusFilter !== "all") visible = visible.filter((l) => l.status === statusFilter);
  if (search) visible = visible.filter((l) => matchSearch(l, search));
  if (sortDir === "asc") visible = [...visible].reverse();

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const paginated = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allPageSelected = paginated.length > 0 && paginated.every((l) => selected.has(l.id));

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelected((s) => { const n = new Set(s); paginated.forEach((l) => n.delete(l.id)); return n; });
    } else {
      setSelected((s) => { const n = new Set(s); paginated.forEach((l) => n.add(l.id)); return n; });
    }
  }

  async function exportExcel() {
    const DATE_LABELS: Record<string, string> = {
      all: "All time", "24h": "Last 24 hrs", "7d": "Last 7 days",
      "30d": "Last 30 days", "90d": "Last 90 days", "1y": "Last year",
    };

    const wb = new ExcelJS.Workbook();
    wb.creator = "GrowitBuddy Admin";
    wb.created = new Date();

    const ws = wb.addWorksheet("Leads", {
      views: [{ state: "frozen", ySplit: 4 }],
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
    });

    const COLS: { header: string; key: string; width: number }[] = [
      { header: "#",       key: "idx",     width: 5  },
      { header: "Type",    key: "type",    width: 14 },
      { header: "Status",  key: "status",  width: 12 },
      { header: "Name",    key: "name",    width: 26 },
      { header: "Email",   key: "email",   width: 30 },
      { header: "Date",    key: "date",    width: 20 },
      { header: "Notes",   key: "notes",   width: 36 },
      { header: "Details", key: "details", width: 60 },
    ];
    ws.columns = COLS;

    /* Row 1: Title */
    ws.mergeCells(1, 1, 1, COLS.length);
    const titleCell = ws.getCell("A1");
    titleCell.value = "GrowitBuddy — Leads & CRM Export";
    titleCell.font  = { bold: true, size: 15, color: { argb: "FF0A0A0A" }, name: "Calibri" };
    titleCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F8F6" } };
    titleCell.alignment = { vertical: "middle" };
    ws.getRow(1).height = 32;

    /* Row 2: Subtitle */
    ws.mergeCells(2, 1, 2, COLS.length);
    const metaParts: string[] = [`${visible.length} lead${visible.length !== 1 ? "s" : ""}`];
    if (typeFilter !== "all") metaParts.push(`Type: ${TYPE_META[typeFilter]?.label ?? typeFilter}`);
    if (statusFilter !== "all") metaParts.push(`Status: ${LEAD_STATUSES.find((s) => s.key === statusFilter)?.label ?? statusFilter}`);
    metaParts.push(`Period: ${DATE_LABELS[dateFilter] ?? dateFilter}`);
    metaParts.push(`Exported: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`);
    const subCell = ws.getCell("A2");
    subCell.value = metaParts.join("   ·   ");
    subCell.font  = { size: 10, color: { argb: "FF5F5F5F" }, name: "Calibri" };
    subCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F8F6" } };
    subCell.alignment = { vertical: "middle" };
    ws.getRow(2).height = 20;

    /* Row 3: Spacer */
    ws.mergeCells(3, 1, 3, COLS.length);
    ws.getCell("A3").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F8F6" } };
    ws.getRow(3).height = 6;

    /* Row 4: Header */
    const headerRow = ws.getRow(4);
    COLS.forEach((col, ci) => {
      const cell = headerRow.getCell(ci + 1);
      cell.value = col.header;
      cell.font  = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Calibri" };
      cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
      cell.alignment = { vertical: "middle", horizontal: ci === 0 ? "center" : "left" };
      cell.border = { bottom: { style: "thin", color: { argb: "FF2D3F55" } } };
    });
    headerRow.height = 26;
    ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: COLS.length } };

    /* Data rows */
    visible.forEach((l, i) => {
      const isEven   = i % 2 === 1;
      const bgArgb   = isEven ? "FFEFEFEA" : "FFFFFFFF";
      const typeMeta = TYPE_META[l.type] ?? { label: l.type, color: "#6b7280", bg: "#f3f4f6" };
      const statusMeta = LEAD_STATUSES.find((s) => s.key === l.status) ?? { label: l.status, color: "#6b7280", bg: "#f3f4f6" };
      const detailsText = Object.entries(l.data)
        .filter(([, v]) => v != null && v !== "")
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");

      const row = ws.addRow({
        idx:     i + 1,
        type:    typeMeta.label,
        status:  statusMeta.label,
        name:    l.name ?? "",
        email:   l.email,
        date:    fmt(l.createdAt),
        notes:   l.notes ?? "",
        details: detailsText,
      });

      row.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
        cell.font = { size: 11, color: { argb: "FF0A0A0A" }, name: "Calibri" };
        cell.alignment = { vertical: "middle", wrapText: colNum >= 7 };
        cell.border = { bottom: { style: "hair", color: { argb: "FFE5E5E0" } } };
        if (colNum === 1) cell.alignment = { horizontal: "center", vertical: "middle" };
        /* Type cell — colour-coded */
        if (colNum === 2) {
          const argbBg = typeMeta.bg.replace("#", "FF").padStart(8, "FF");
          const argbFg = typeMeta.color.replace("#", "FF").padStart(8, "FF");
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argbBg } };
          cell.font = { bold: true, size: 10, name: "Calibri", color: { argb: argbFg } };
        }
        /* Status cell — colour-coded */
        if (colNum === 3) {
          const argbBg = statusMeta.bg.replace("#", "FF").padStart(8, "FF");
          const argbFg = statusMeta.color.replace("#", "FF").padStart(8, "FF");
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argbBg } };
          cell.font = { bold: true, size: 10, name: "Calibri", color: { argb: argbFg } };
        }
      });
      row.height = detailsText.split("\n").length > 3 ? 60 : 20;
    });

    /* Download */
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    const fParts: string[] = [];
    if (typeFilter !== "all")   fParts.push(typeFilter);
    if (statusFilter !== "all") fParts.push(statusFilter);
    if (dateFilter !== "all")   fParts.push(dateFilter);
    a.download = `leads${fParts.length ? `-${fParts.join("-")}` : ""}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const activeFilters = (typeFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (dateFilter !== "all" ? 1 : 0);

  return (
    <div>
      {drawer && (
        <LeadDrawer
          lead={drawer}
          onClose={() => setDrawer(null)}
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
          onDelete={handleDelete}
        />
      )}

      <PageHeader
        title="Leads & CRM"
        description={`${leads.length} total submission${leads.length !== 1 ? "s" : ""}${dateFilter !== "all" ? ` · ${dateFiltered.length} in period` : ""}`}
      />

      {/* Type stats strip */}
      <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
        {[{ key: "all", label: "All" }, ...Object.keys(TYPE_META).map((k) => ({ key: k, label: TYPE_META[k].label }))].map(({ key, label }) => {
          const count = key === "all" ? dateFiltered.length : (byType[key] ?? 0);
          return (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`text-left p-3 rounded-xl border transition-all ${typeFilter === key ? "border-[#0B0B0B] bg-[#0B0B0B] text-white" : "border-[#0B0B0B]/10 bg-white hover:border-[#0B0B0B]/25"}`}
            >
              <p className={`text-[18px] font-black tracking-tight leading-none ${typeFilter === key ? "text-white" : "text-[#0B0B0B]"}`}>{count}</p>
              <p className={`text-[9px] font-semibold mt-1 leading-tight ${typeFilter === key ? "text-white/60" : "text-[#0B0B0B]/40"}`}>{label}</p>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0B0B0B]/35" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, notes, any field..."
            className="w-full pl-9 pr-9 py-2.5 border border-[#0B0B0B]/12 rounded-xl text-[13px] text-[#0B0B0B] placeholder-[#0B0B0B]/30 outline-none focus:border-[#0B0B0B]/30 bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0B0B0B]/30 hover:text-[#0B0B0B]">
              <X size={13} />
            </button>
          )}
        </div>
        <button
          onClick={() => setFiltersOpen((p) => !p)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-[13px] font-semibold transition-colors ${filtersOpen || activeFilters > 0 ? "border-[#0B0B0B] bg-[#0B0B0B] text-white" : "border-[#0B0B0B]/12 text-[#0B0B0B]/60 hover:border-[#0B0B0B]/25"}`}
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilters > 0 && <span className="w-4 h-4 rounded-full bg-white/25 text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>}
        </button>
        <button
          onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#0B0B0B]/12 text-[13px] text-[#0B0B0B]/50 hover:border-[#0B0B0B]/25 transition-colors"
          title={sortDir === "desc" ? "Newest first" : "Oldest first"}
        >
          <ArrowUpDown size={14} />
          <span className="hidden sm:inline">{sortDir === "desc" ? "Newest" : "Oldest"}</span>
        </button>
        <button onClick={load} className="p-2.5 border border-[#0B0B0B]/12 rounded-xl hover:bg-[#0B0B0B]/5 text-[#0B0B0B]/50 transition-colors">
          <RefreshCw size={15} />
        </button>
        <button
          onClick={exportExcel}
          className="flex items-center gap-2 border border-[#0B0B0B]/12 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-[#0B0B0B]/60 hover:bg-[#0B0B0B]/5 transition-colors"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Export Excel</span>
        </button>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <Card className="mb-4 p-4 space-y-4">
          {/* Date */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar size={11} className="text-[#0B0B0B]/40" />
              <span className="text-[10px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest">Date Range</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
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
          </div>

          {/* Status */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Tag size={11} className="text-[#0B0B0B]/40" />
              <span className="text-[10px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest">Status</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${statusFilter === "all" ? "bg-[#0B0B0B] border-[#0B0B0B] text-white" : "bg-white border-[#0B0B0B]/12 text-[#0B0B0B]/55 hover:border-[#0B0B0B]/25"}`}
              >
                All ({typeFiltered.length})
              </button>
              {LEAD_STATUSES.map((s) => {
                const cnt = byStatus[s.key] ?? 0;
                return (
                  <button
                    key={s.key}
                    onClick={() => setStatusFilter(s.key)}
                    style={statusFilter === s.key ? { background: s.bg, color: s.color, borderColor: s.color + "60" } : {}}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${statusFilter === s.key ? "" : "bg-white border-[#0B0B0B]/12 text-[#0B0B0B]/55 hover:border-[#0B0B0B]/25"}`}
                  >
                    {s.label} ({cnt})
                  </button>
                );
              })}
            </div>
          </div>

          {activeFilters > 0 && (
            <button
              onClick={() => { setDateFilter("all"); setStatusFilter("all"); }}
              className="text-[12px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] transition-colors flex items-center gap-1"
            >
              <X size={11} /> Clear all filters
            </button>
          )}
        </Card>
      )}

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 bg-[#0B0B0B] text-white px-4 py-2.5 rounded-xl">
          <CheckSquare size={14} className="shrink-0" />
          <span className="text-[13px] font-semibold flex-1">{selected.size} selected</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="text-[12px] bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white outline-none"
          >
            <option value="">Set status...</option>
            {LEAD_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button
            onClick={handleBulkStatus}
            disabled={!bulkStatus}
            className="text-[12px] font-semibold px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg disabled:opacity-40 transition-colors"
          >
            Apply
          </button>
          <button
            onClick={handleBulkDelete}
            className="text-[12px] font-semibold px-3 py-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
          >
            Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="text-white/50 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-[13px] text-[#0B0B0B]/35">Loading leads...</div>
        ) : visible.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[14px] font-semibold text-[#0B0B0B]/30">No leads found</p>
            <p className="text-[12px] text-[#0B0B0B]/25 mt-1">
              {search || dateFilter !== "all" || statusFilter !== "all" ? "Try adjusting your filters" : "Form submissions will appear here automatically"}
            </p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="hidden md:grid grid-cols-[36px_110px_1fr_1fr_100px_120px_44px] gap-0 px-4 py-3 border-b border-[#0B0B0B]/6 bg-[#FAFAFA]">
              <div className="flex items-center">
                <button onClick={toggleSelectAll} className="text-[#0B0B0B]/30 hover:text-[#0B0B0B]">
                  {allPageSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                </button>
              </div>
              {["Type", "Name", "Email", "Status", "Date", ""].map((h) => (
                <span key={h} className="text-[10px] font-bold text-[#0B0B0B]/35 uppercase tracking-widest self-center">{h}</span>
              ))}
            </div>

            {paginated.map((lead) => (
              <div
                key={lead.id}
                className="border-b border-[#0B0B0B]/5 hover:bg-[#0B0B0B]/2 transition-colors cursor-pointer"
                onClick={() => setDrawer(lead)}
              >
                {/* Desktop row */}
                <div className="hidden md:grid grid-cols-[36px_110px_1fr_1fr_100px_120px_44px] gap-0 px-4 py-3.5 items-center">
                  <div onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelected((s) => { const n = new Set(s); n.has(lead.id) ? n.delete(lead.id) : n.add(lead.id); return n; })}
                      className="text-[#0B0B0B]/30 hover:text-[#0B0B0B]"
                    >
                      {selected.has(lead.id) ? <CheckSquare size={14} className="text-[#8B3A1A]" /> : <Square size={14} />}
                    </button>
                  </div>
                  <div><TypeBadge type={lead.type} /></div>
                  <div className="flex items-center gap-2 min-w-0 pr-3">
                    <span className="text-[13px] text-[#0B0B0B] truncate">{lead.name || <span className="text-[#0B0B0B]/30 italic text-[12px]">No name</span>}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 pr-3">
                    <span className="text-[13px] text-[#0B0B0B]/60 truncate">{lead.email}</span>
                  </div>
                  <div><StatusBadge status={lead.status} /></div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-[#0B0B0B]/40">{fmtShort(lead.createdAt)}</span>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(lead.id)}
                      className="p-1.5 rounded hover:bg-red-50 hover:text-red-500 text-[#0B0B0B]/20 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Mobile card */}
                <div className="md:hidden px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TypeBadge type={lead.type} />
                      <StatusBadge status={lead.status} />
                    </div>
                    <span className="text-[10px] text-[#0B0B0B]/35 shrink-0">{fmtShort(lead.createdAt)}</span>
                  </div>
                  <p className="text-[13px] font-semibold text-[#0B0B0B]">{lead.name || <span className="italic text-[#0B0B0B]/40">No name</span>}</p>
                  <p className="text-[12px] text-[#0B0B0B]/55 mt-0.5 truncate">{lead.email}</p>
                  {lead.notes && <p className="text-[11px] text-[#0B0B0B]/40 mt-1 truncate italic">{lead.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[12px] text-[#0B0B0B]/40">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, visible.length)} of {visible.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-[#0B0B0B]/12 disabled:opacity-30 hover:bg-[#0B0B0B]/5 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pg = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 rounded-xl text-[12px] font-semibold transition-colors ${pg === page ? "bg-[#0B0B0B] text-white" : "border border-[#0B0B0B]/12 text-[#0B0B0B]/50 hover:bg-[#0B0B0B]/5"}`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-[#0B0B0B]/12 disabled:opacity-30 hover:bg-[#0B0B0B]/5 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {!loading && visible.length > 0 && totalPages <= 1 && (
        <p className="text-[11px] text-[#0B0B0B]/30 text-center mt-3">
          {visible.length} lead{visible.length !== 1 ? "s" : ""}
          {(search || activeFilters > 0) && ` · filtered`}
          {" · "}Click any row to open details
        </p>
      )}
    </div>
  );
}
