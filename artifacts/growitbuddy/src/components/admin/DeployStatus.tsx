import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { API_BASE } from "@/lib/api";
import { GitCommit, ExternalLink, RefreshCw, Clock, Loader2, CheckCircle2, XCircle, Rocket } from "lucide-react";

interface Deployment {
  id: number;
  environment: string;
  state: string;
  url: string;
  created_at: string;
}

interface CommitInfo {
  sha: string;
  message: string;
  date: string;
}

interface CheckRun {
  name: string;
  status: string;
  conclusion: string | null;
  details_url: string;
  completed_at: string | null;
}

interface DeployData {
  commit?: CommitInfo;
  deployments?: Deployment[];
  checkRuns?: CheckRun[];
  error?: string;
}

type RedeployTarget = "vercel" | "render" | "all";
type RedeployState = "idle" | "loading" | "done" | "error";

function StateIcon({ state, conclusion }: { state: string; conclusion?: string | null }) {
  if (state === "in_progress" || state === "pending" || state === "queued") {
    return <Loader2 size={13} className="text-amber-500 animate-spin" />;
  }
  const isSuccess = state === "success" || conclusion === "success";
  const isFailure = state === "failure" || state === "error" || conclusion === "failure";
  if (isSuccess) return <CheckCircle2 size={13} className="text-emerald-500" />;
  if (isFailure) return <XCircle size={13} className="text-red-500" />;
  return <Clock size={13} className="text-[#0B0B0B]/30" />;
}

function stateBadge(state: string, conclusion?: string | null) {
  const s = conclusion ?? state;
  if (s === "success") return "bg-emerald-50 text-emerald-600";
  if (s === "failure" || s === "error") return "bg-red-50 text-red-600";
  if (s === "in_progress" || s === "pending" || s === "queued") return "bg-amber-50 text-amber-600";
  return "bg-[#0B0B0B]/5 text-[#0B0B0B]/40";
}

function stateLabel(state: string, conclusion?: string | null) {
  const s = conclusion ?? state;
  if (s === "success") return "Live";
  if (s === "failure" || s === "error") return "Failed";
  if (s === "in_progress") return "Deploying";
  if (s === "pending" || s === "queued") return "Queued";
  return s;
}

function envLabel(env: string) {
  const e = env.toLowerCase();
  if (e.includes("production") || e === "production") return "Vercel";
  if (e.includes("preview")) return "Preview";
  if (e.includes("render") || e.includes("api")) return "Render";
  return env;
}

export function DeployStatus() {
  const { authFetch, isSuperAdmin } = useAdmin();
  const [data, setData] = useState<DeployData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [redeployState, setRedeployState] = useState<Record<RedeployTarget, RedeployState>>({
    vercel: "idle",
    render: "idle",
    all: "idle",
  });
  const [redeployMsg, setRedeployMsg] = useState<Record<RedeployTarget, string>>({
    vercel: "",
    render: "",
    all: "",
  });

  async function load(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/deploy-status`);
      const json = await res.json();
      setData(json);
    } catch {
      setData({ error: "Could not reach deploy status API" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function triggerRedeploy(target: RedeployTarget) {
    setRedeployState((s) => ({ ...s, [target]: "loading" }));
    setRedeployMsg((s) => ({ ...s, [target]: "" }));
    try {
      const res = await authFetch(`${API_BASE}/admin/redeploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setRedeployState((s) => ({ ...s, [target]: "error" }));
        setRedeployMsg((s) => ({ ...s, [target]: json.error ?? "Failed" }));
      } else {
        setRedeployState((s) => ({ ...s, [target]: "done" }));
        const msgs = Object.entries(json.results as Record<string, string>)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        setRedeployMsg((s) => ({ ...s, [target]: msgs }));
        setTimeout(() => {
          setRedeployState((prev) => ({ ...prev, [target]: "idle" }));
          load(true);
        }, 4000);
      }
    } catch (err) {
      setRedeployState((s) => ({ ...s, [target]: "error" }));
      setRedeployMsg((s) => ({ ...s, [target]: (err as Error).message }));
    }
  }

  useEffect(() => { load(); }, []);

  const deploys = data?.deployments ?? [];
  const checks = (data?.checkRuns ?? []).filter((c) =>
    c.name.toLowerCase().includes("vercel") ||
    c.name.toLowerCase().includes("render") ||
    c.name.toLowerCase().includes("deploy")
  );
  const shown = deploys.length > 0 ? deploys : [];

  function RedeployBtn({ target, label }: { target: RedeployTarget; label: string }) {
    const state = redeployState[target];
    const msg = redeployMsg[target];
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => triggerRedeploy(target)}
          disabled={state === "loading"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            state === "done"
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : state === "error"
              ? "bg-red-50 text-red-600 border border-red-200"
              : state === "loading"
              ? "bg-[#0B0B0B]/5 text-[#0B0B0B]/40 cursor-not-allowed border border-[#0B0B0B]/8"
              : "bg-[#0B0B0B] text-white hover:bg-[#0B0B0B]/80 border border-transparent"
          }`}
        >
          {state === "loading" ? (
            <Loader2 size={11} className="animate-spin" />
          ) : state === "done" ? (
            <CheckCircle2 size={11} />
          ) : state === "error" ? (
            <XCircle size={11} />
          ) : (
            <Rocket size={11} />
          )}
          {state === "loading" ? "Triggering..." : state === "done" ? "Triggered!" : state === "error" ? "Failed" : label}
        </button>
        {msg && (
          <span className="text-[10px] text-[#0B0B0B]/35 truncate max-w-[180px]" title={msg}>{msg}</span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#0B0B0B]/8 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitCommit size={15} className="text-[#0B0B0B]/50" />
          <h2 className="text-[13px] font-bold text-[#0B0B0B]">Deploy Status</h2>
        </div>
        <div className="flex items-center gap-3">
          {data?.commit && (
            <a
              href={`https://github.com/Surajsharmaco/growitbuddy/commit/${data.commit.sha}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-[#0B0B0B]/40 hover:text-[#0B0B0B] transition-colors font-mono"
            >
              {data.commit.sha}
              <ExternalLink size={10} />
            </a>
          )}
          <button
            onClick={() => load(true)}
            className="p-1 rounded hover:bg-[#0B0B0B]/5 transition-colors text-[#0B0B0B]/30 hover:text-[#0B0B0B]"
            title="Refresh"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 justify-center">
          <Loader2 size={14} className="animate-spin text-[#0B0B0B]/30" />
          <span className="text-[12px] text-[#0B0B0B]/30">Loading deploy status...</span>
        </div>
      ) : data?.error ? (
        <p className="text-[12px] text-red-500 py-2">{data.error}</p>
      ) : (
        <>
          {data?.commit?.message && (
            <p className="text-[11px] text-[#0B0B0B]/40 mb-4 truncate" title={data.commit.message}>
              Last commit: {data.commit.message}
            </p>
          )}

          {checks.length > 0 && (
            <div className="space-y-2 mb-4">
              {checks.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StateIcon state={c.status} conclusion={c.conclusion} />
                    <span className="text-[12px] font-semibold text-[#0B0B0B]">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stateBadge(c.status, c.conclusion)}`}>
                      {stateLabel(c.status, c.conclusion)}
                    </span>
                    {c.details_url && (
                      <a href={c.details_url} target="_blank" rel="noreferrer" className="text-[#0B0B0B]/25 hover:text-[#0B0B0B] transition-colors">
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {shown.length > 0 ? (
            <div className="space-y-2 mb-5">
              {shown.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StateIcon state={d.state} />
                    <span className="text-[12px] font-semibold text-[#0B0B0B]">{envLabel(d.environment)}</span>
                    <span className="text-[10px] text-[#0B0B0B]/30">{d.environment}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stateBadge(d.state)}`}>
                      {stateLabel(d.state)}
                    </span>
                    {d.url && (
                      <a href={d.url} target="_blank" rel="noreferrer" className="text-[#0B0B0B]/25 hover:text-[#0B0B0B] transition-colors">
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : checks.length === 0 ? (
            <p className="text-[12px] text-[#0B0B0B]/30 py-2 mb-3 text-center">
              No deployments found. Push to GitHub to trigger Vercel and Render.
            </p>
          ) : null}

          {isSuperAdmin && (
            <div className="border-t border-[#0B0B0B]/6 pt-4 space-y-2.5">
              <p className="text-[11px] font-bold text-[#0B0B0B]/40 uppercase tracking-wide mb-3">Trigger Redeploy</p>
              <RedeployBtn target="vercel" label="Redeploy Vercel" />
              <RedeployBtn target="render" label="Redeploy Render API" />
              <RedeployBtn target="all" label="Redeploy Both" />
            </div>
          )}

          <a
            href="https://github.com/Surajsharmaco/growitbuddy/deployments"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 mt-4 text-[11px] text-[#0B0B0B]/30 hover:text-[#0B0B0B] transition-colors"
          >
            View all deployments on GitHub
            <ExternalLink size={10} />
          </a>
        </>
      )}
    </div>
  );
}
