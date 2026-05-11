import { useState, useCallback, useEffect, useRef } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Card } from "@/components/admin/AdminField";
import {
  Zap, ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
  Loader2, RotateCcw, Database, HardDrive, FolderOpen,
  Server, Clock, Activity, Search, List, Image as ImageIcon,
  Layers, RefreshCw, Cpu, TrendingUp, WifiOff,
} from "lucide-react";

import { API_BASE } from "@/lib/api";

type Tab = "cache" | "performance" | "insights" | "logs";
type BusyKey = string;

interface ToastMsg { id: number; ok: boolean; text: string; }

interface SpeedData { dbResponseMs: number; contentRows: number; leadsRows: number; uptimeSeconds: number; }
interface IssueData { warnings: string[]; imageCount: number; largeCount: number; totalKb: number; }
interface LogEntry { ts: number; action: string; detail: string; ok: boolean; }

const PERF_TOGGLES = [
  {
    id: "lazyLoad",
    label: "Lazy Loading",
    desc: "Images and off-screen content load only when visible in the viewport.",
    icon: <Layers size={15} />,
    status: "enabled" as const,
  },
  {
    id: "codeSplit",
    label: "Code Splitting",
    desc: "JavaScript is split into chunks and loaded only when each page is visited.",
    icon: <Cpu size={15} />,
    status: "enabled" as const,
  },
  {
    id: "preconnect",
    label: "DNS Preconnect",
    desc: "Early DNS resolution for external services (Cal.com, Unsplash, Google Fonts).",
    icon: <TrendingUp size={15} />,
    status: "enabled" as const,
  },
  {
    id: "hmr",
    label: "Hot Module Replacement",
    desc: "Development-only: live updates without full page reload.",
    icon: <RefreshCw size={15} />,
    status: "dev-only" as const,
  },
  {
    id: "treeshake",
    label: "Tree Shaking",
    desc: "Unused code is removed automatically at build time via Rollup.",
    icon: <Zap size={15} />,
    status: "enabled" as const,
  },
];

function fmtUptime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function Toast({ msg, onDone }: { msg: ToastMsg; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold transition-all animate-fade-in ${
        msg.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
      }`}
    >
      {msg.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
      {msg.text}
    </div>
  );
}

function ActionCard({
  icon, title, desc, buttonLabel, buttonVariant = "default",
  busy, result, onAction,
}: {
  icon: React.ReactNode; title: string; desc: string;
  buttonLabel: string; buttonVariant?: "default" | "amber" | "danger";
  busy: boolean; result?: { ok: boolean; detail: string } | null;
  onAction: () => void;
}) {
  const btnStyle = {
    default: "bg-[#0B0B0B] hover:bg-[#222] text-white",
    amber: "bg-amber-500 hover:bg-amber-600 text-white",
    danger: "bg-red-500 hover:bg-red-600 text-white",
  }[buttonVariant];

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl border border-[#0B0B0B]/8 bg-white">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#0B0B0B]/6 flex items-center justify-center text-[#0B0B0B]/50 shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-[#0B0B0B] leading-tight">{title}</p>
          <p className="text-[11.5px] text-[#0B0B0B]/45 mt-0.5 leading-snug">{desc}</p>
        </div>
      </div>
      {result && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11.5px] font-medium ${
          result.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
        }`}>
          {result.ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {result.detail}
        </div>
      )}
      <button
        onClick={onAction}
        disabled={busy}
        className={`flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] font-bold transition-all ${
          busy ? "bg-[#0B0B0B]/8 text-[#0B0B0B]/30 cursor-not-allowed" : `${btnStyle} shadow-sm`
        }`}
      >
        {busy ? <><Loader2 size={13} className="animate-spin" /> Working...</> : buttonLabel}
      </button>
    </div>
  );
}

export default function AdminOptimize() {
  const { authFetch } = useAdmin();
  const [tab, setTab] = useState<Tab>("cache");
  const [busy, setBusy] = useState<Record<BusyKey, boolean>>({});
  const [results, setResults] = useState<Record<BusyKey, { ok: boolean; detail: string } | null>>({});
  const [speedData, setSpeedData] = useState<SpeedData | null>(null);
  const [issueData, setIssueData] = useState<IssueData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const nextId = useRef(0);

  function addToast(ok: boolean, text: string) {
    setToasts((p) => [...p, { id: nextId.current++, ok, text }]);
  }
  function removeToast(id: number) {
    setToasts((p) => p.filter((t) => t.id !== id));
  }

  const callAction = useCallback(async (
    key: BusyKey, endpoint: string, method = "POST",
    onSuccess?: (data: Record<string, unknown>) => void,
  ) => {
    setBusy((p) => ({ ...p, [key]: true }));
    setResults((p) => ({ ...p, [key]: null }));
    try {
      const r = await authFetch(`${API_BASE}/admin/optimize/${endpoint}`, { method });
      const data = await r.json() as { ok: boolean; detail?: string; error?: string } & Record<string, unknown>;
      const detail = data.detail ?? data.error ?? (data.ok ? "Done" : "Failed");
      setResults((p) => ({ ...p, [key]: { ok: !!data.ok, detail } }));
      addToast(!!data.ok, data.ok ? detail : `Failed: ${detail}`);
      if (data.ok && onSuccess) onSuccess(data);
    } catch {
      setResults((p) => ({ ...p, [key]: { ok: false, detail: "Could not reach server" } }));
      addToast(false, "Could not reach server");
    } finally {
      setBusy((p) => ({ ...p, [key]: false }));
    }
  }, [authFetch]);

  const fetchLogs = useCallback(async () => {
    try {
      const r = await authFetch(`${API_BASE}/admin/optimize/logs`, { method: "GET" });
      const data = await r.json() as { logs: LogEntry[] };
      setLogs(data.logs ?? []);
    } catch { /* ignore */ }
  }, [authFetch]);

  useEffect(() => {
    if (tab === "logs") fetchLogs();
  }, [tab, fetchLogs]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "cache",       label: "Cache Controls",    icon: <RotateCcw size={14} /> },
    { id: "performance", label: "Optimizations",     icon: <Zap size={14} /> },
    { id: "insights",    label: "Performance Check", icon: <Activity size={14} /> },
    { id: "logs",        label: "Activity Log",      icon: <List size={14} /> },
  ];

  return (
    <div style={{ position: "relative" }}>
      {/* Toast stack */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map((t) => (
          <Toast key={t.id} msg={t} onDone={() => removeToast(t.id)} />
        ))}
      </div>

      <div className="mb-7">
        <h1 className="text-[22px] font-black tracking-tight text-[#0B0B0B]">Performance &amp; Optimization</h1>
        <p className="text-[14px] text-[#0B0B0B]/50 mt-1">
          Safe, non-destructive tools to keep the site fast. No data is deleted or modified.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 bg-[#0B0B0B]/5 rounded-2xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
              tab === t.id
                ? "bg-white text-[#0B0B0B] shadow-sm"
                : "text-[#0B0B0B]/45 hover:text-[#0B0B0B]"
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── CACHE TAB ── */}
      {tab === "cache" && (
        <div>
          <p className="text-[12px] font-bold text-[#0B0B0B]/35 uppercase tracking-widest mb-4">Cache Controls</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <ActionCard
              icon={<RefreshCw size={15} />}
              title="Clear Frontend Cache"
              desc="Clears expired admin session tokens and API response cache from server memory."
              buttonLabel="Clear Frontend Cache"
              busy={!!busy["frontend"]}
              result={results["frontend"]}
              onAction={() => callAction("frontend", "cache-clear")}
            />
            <ActionCard
              icon={<ImageIcon size={15} />}
              title="Clear Image Cache"
              desc="Refreshes image cache headers so browsers re-fetch media on next page load."
              buttonLabel="Clear Image Cache"
              buttonVariant="amber"
              busy={!!busy["image"]}
              result={results["image"]}
              onAction={() => callAction("image", "image-cache-clear")}
            />
            <ActionCard
              icon={<ShieldCheck size={15} />}
              title="Full Cache Clear (Safe Mode)"
              desc="Clears all temporary cache - session tokens and DB query planner stats. No content deleted."
              buttonLabel="Full Clear (Safe)"
              busy={!!busy["full"]}
              result={results["full"]}
              onAction={() => callAction("full", "full-cache-clear")}
            />
          </div>

          {/* Run full optimizer */}
          <Card>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[#0B0B0B]/6 flex items-center justify-center text-[#0B0B0B]/50 shrink-0">
                <Database size={15} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#0B0B0B]">Deep Optimization (Advanced)</p>
                <p className="text-[11.5px] text-[#0B0B0B]/45 mt-0.5 leading-snug">
                  Runs VACUUM ANALYZE on PostgreSQL - reclaims dead row space and refreshes query planner stats. Slightly longer but deeper.
                  Tables remain accessible throughout.
                </p>
              </div>
            </div>
            {results["advanced"] && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11.5px] font-medium mb-3 ${
                results["advanced"].ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}>
                {results["advanced"].ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {results["advanced"].detail}
              </div>
            )}
            <button
              onClick={() => callAction("advanced", "db-analyze", "POST")}
              disabled={!!busy["advanced"]}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
                busy["advanced"]
                  ? "bg-[#0B0B0B]/8 text-[#0B0B0B]/30 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
              }`}
            >
              {busy["advanced"] ? <><Loader2 size={13} className="animate-spin" /> Running...</> : <><Zap size={13} /> Run Deep Optimization</>}
            </button>
          </Card>
        </div>
      )}

      {/* ── PERFORMANCE TAB ── */}
      {tab === "performance" && (
        <div>
          <p className="text-[12px] font-bold text-[#0B0B0B]/35 uppercase tracking-widest mb-4">Active Optimizations</p>
          <div className="space-y-2 mb-6">
            {PERF_TOGGLES.map((t) => (
              <div key={t.id} className="flex items-center gap-4 p-4 rounded-2xl border border-[#0B0B0B]/8 bg-white">
                <div className="w-8 h-8 rounded-xl bg-[#0B0B0B]/6 flex items-center justify-center text-[#0B0B0B]/50 shrink-0">
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[13px] font-bold text-[#0B0B0B]">{t.label}</p>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                      t.status === "enabled"  ? "bg-emerald-100 text-emerald-700" :
                      t.status === "dev-only" ? "bg-amber-100 text-amber-700" :
                                                "bg-[#0B0B0B]/8 text-[#0B0B0B]/40"
                    }`}>
                      {t.status === "enabled" ? "Active" : t.status === "dev-only" ? "Dev Only" : "Off"}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#0B0B0B]/45 leading-snug">{t.desc}</p>
                </div>
                <div className={`w-9 h-5 rounded-full flex items-center px-0.5 shrink-0 ${
                  t.status === "enabled" ? "bg-emerald-500 justify-end" : "bg-[#0B0B0B]/15 justify-start"
                }`}>
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </div>
              </div>
            ))}
          </div>

          <Card>
            <p className="text-[11px] font-bold tracking-widest uppercase text-[#0B0B0B]/35 mb-3">What can't be toggled at runtime</p>
            <p className="text-[12.5px] text-[#0B0B0B]/50 leading-relaxed">
              Options like image compression quality, bundle chunk sizes, and server-side caching
              are configured at build time. To change them, update the Vite config and redeploy.
              All current build-time optimizations are active.
            </p>
          </Card>
        </div>
      )}

      {/* ── INSIGHTS TAB ── */}
      {tab === "insights" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Speed check */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Activity size={15} className="text-[#0B0B0B]/50" />
              <p className="text-[13px] font-bold text-[#0B0B0B]">Speed Analysis</p>
            </div>

            {speedData && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "DB Response", value: `${speedData.dbResponseMs} ms`, color: speedData.dbResponseMs < 50 ? "text-emerald-600" : speedData.dbResponseMs < 200 ? "text-amber-600" : "text-red-500", bg: "bg-emerald-50" },
                  { label: "Server Uptime", value: fmtUptime(speedData.uptimeSeconds), color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Content Rows", value: String(speedData.contentRows), color: "text-[#0B0B0B]", bg: "bg-[#0B0B0B]/5" },
                  { label: "Lead Records", value: String(speedData.leadsRows), color: "text-[#0B0B0B]", bg: "bg-[#0B0B0B]/5" },
                ].map((stat) => (
                  <div key={stat.label} className={`${stat.bg} rounded-xl p-3`}>
                    <p className={`text-[20px] font-black tracking-tight leading-none ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] font-semibold text-[#0B0B0B]/50 mt-1.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            {speedData && speedData.dbResponseMs < 50 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-[11.5px] font-medium mb-4">
                <CheckCircle2 size={12} /> Excellent - DB responding under 50 ms
              </div>
            )}
            {speedData && speedData.dbResponseMs >= 50 && speedData.dbResponseMs < 200 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 text-[11.5px] font-medium mb-4">
                <AlertTriangle size={12} /> Acceptable - DB responding in {speedData.dbResponseMs} ms
              </div>
            )}
            {speedData && speedData.dbResponseMs >= 200 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-700 text-[11.5px] font-medium mb-4">
                <WifiOff size={12} /> Slow - DB response above 200 ms. Check server load.
              </div>
            )}

            <button
              onClick={() => callAction("speed", "speed-check", "POST", (d) => {
                setSpeedData(d as unknown as SpeedData);
              })}
              disabled={!!busy["speed"]}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all ${
                busy["speed"]
                  ? "bg-[#0B0B0B]/8 text-[#0B0B0B]/30 cursor-not-allowed"
                  : "bg-[#0B0B0B] hover:bg-[#222] text-white shadow-sm"
              }`}
            >
              {busy["speed"] ? <><Loader2 size={13} className="animate-spin" /> Analyzing...</> : <><Activity size={13} /> Analyze Performance</>}
            </button>
          </Card>

          {/* Issue detection */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Search size={15} className="text-[#0B0B0B]/50" />
              <p className="text-[13px] font-bold text-[#0B0B0B]">Issue Detection</p>
            </div>

            {issueData && (
              <div className="mb-4 space-y-2">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: "Total Images", value: issueData.imageCount, bg: "bg-[#0B0B0B]/5", color: "text-[#0B0B0B]" },
                    { label: "Large (>300 KB)", value: issueData.largeCount, bg: issueData.largeCount > 0 ? "bg-amber-50" : "bg-[#0B0B0B]/5", color: issueData.largeCount > 0 ? "text-amber-600" : "text-[#0B0B0B]" },
                    { label: "Total Size", value: `${issueData.totalKb} KB`, bg: "bg-[#0B0B0B]/5", color: "text-[#0B0B0B]" },
                  ].map((s) => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-2.5`}>
                      <p className={`text-[16px] font-black leading-tight ${s.color}`}>{s.value}</p>
                      <p className="text-[9px] font-semibold text-[#0B0B0B]/45 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
                {issueData.warnings.length === 0 ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-[11.5px] font-medium">
                    <CheckCircle2 size={12} /> No issues detected
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {issueData.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 text-[11.5px] font-medium">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {w}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => callAction("issues", "issue-scan", "POST", (d) => {
                setIssueData(d as unknown as IssueData);
              })}
              disabled={!!busy["issues"]}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all ${
                busy["issues"]
                  ? "bg-[#0B0B0B]/8 text-[#0B0B0B]/30 cursor-not-allowed"
                  : "bg-[#0B0B0B] hover:bg-[#222] text-white shadow-sm"
              }`}
            >
              {busy["issues"] ? <><Loader2 size={13} className="animate-spin" /> Scanning...</> : <><Search size={13} /> Detect Issues</>}
            </button>
          </Card>

          {/* What gets measured */}
          <div className="lg:col-span-2">
            <Card>
              <p className="text-[11px] font-bold tracking-widest uppercase text-[#0B0B0B]/35 mb-3">What gets measured</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: <Server size={12} />, label: "DB Response Time", desc: "How long PostgreSQL takes to respond" },
                  { icon: <HardDrive size={12} />, label: "Server Uptime", desc: "Time since last API server restart" },
                  { icon: <FolderOpen size={12} />, label: "Media Files", desc: "Count and size of uploaded images" },
                  { icon: <Clock size={12} />, label: "Large Images", desc: "Files exceeding 300 KB threshold" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0B0B0B]/6 flex items-center justify-center text-[#0B0B0B]/40 shrink-0 mt-0.5">{item.icon}</div>
                    <div>
                      <p className="text-[12px] font-semibold text-[#0B0B0B]">{item.label}</p>
                      <p className="text-[11px] text-[#0B0B0B]/40 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── LOGS TAB ── */}
      {tab === "logs" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[12px] font-bold text-[#0B0B0B]/35 uppercase tracking-widest">Activity Log</p>
            <button
              onClick={fetchLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0B0B0B]/12 text-[11px] font-bold text-[#0B0B0B]/50 hover:text-[#0B0B0B] hover:border-[#0B0B0B]/25 transition-colors"
            >
              <RotateCcw size={11} /> Refresh
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#0B0B0B]/5 flex items-center justify-center mb-3">
                <List size={20} className="text-[#0B0B0B]/20" />
              </div>
              <p className="text-[13px] font-semibold text-[#0B0B0B]/30">No actions logged yet</p>
              <p className="text-[11.5px] text-[#0B0B0B]/20 mt-1">Run any optimization action to see it here</p>
            </div>
          ) : (
            <Card>
              <div className="divide-y divide-[#0B0B0B]/6">
                {logs.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 py-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      entry.ok ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                    }`}>
                      {entry.ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[12.5px] font-bold text-[#0B0B0B]">{entry.action}</p>
                        <span className="text-[10px] text-[#0B0B0B]/30">{fmtTime(entry.ts)}</span>
                      </div>
                      <p className="text-[11.5px] text-[#0B0B0B]/50 mt-0.5 leading-snug">{entry.detail}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 ${
                      entry.ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                    }`}>
                      {entry.ok ? "OK" : "ERR"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
