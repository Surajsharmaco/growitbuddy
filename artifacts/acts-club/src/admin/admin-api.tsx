import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getActsAdminSession, loginActsAdmin, logoutActsAdmin, setBaseUrl,
} from '@workspace/api-client-react';

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '');
const ORIGIN = apiUrl ? apiUrl.replace(/\/api$/, '') : '';
// Admin must set the base itself; the membership hook may never mount.
setBaseUrl(ORIGIN || null);
export const API_BASE = ORIGIN + '/api';

const KEY = 'acts.admin.session';
type Stored = { token: string; expiresAt: string };

function readStored(): Stored | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Stored | null;
    if (v?.token && new Date(v.expiresAt).getTime() > Date.now()) return v;
  } catch { /* ignore */ }
  sessionStorage.removeItem(KEY);
  return null;
}

type Ctx = {
  token: string | null;
  checking: boolean;
  headers: { Authorization: string } | undefined;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
};
const AdminCtx = createContext<Ctx | null>(null);

export function useAdmin() {
  const c = useContext(AdminCtx);
  if (!c) throw new Error('AdminProvider missing');
  return c;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Stored | null>(readStored);
  const [checking, setChecking] = useState(!!session);
  const qc = useQueryClient();

  const clear = useCallback(() => {
    sessionStorage.removeItem(KEY);
    setSession(null);
    qc.removeQueries({ predicate: (q) => String(q.queryKey[0]).startsWith('/api/acts/admin') });
  }, [qc]);

  useEffect(() => {
    if (!session) { setChecking(false); return; }
    let live = true;
    getActsAdminSession({ headers: { Authorization: `Bearer ${session.token}` } })
      .catch(() => { if (live) clear(); })
      .finally(() => { if (live) setChecking(false); });
    return () => { live = false; };
    // verify once per mount/token
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  const login = useCallback(async (password: string) => {
    const s = await loginActsAdmin({ password });
    const stored = { token: s.token, expiresAt: s.expiresAt };
    sessionStorage.setItem(KEY, JSON.stringify(stored));
    setSession(stored);
  }, []);

  const logout = useCallback(async () => {
    const t = session?.token;
    clear();
    if (t) { try { await logoutActsAdmin({ headers: { Authorization: `Bearer ${t}` } }); } catch { /* token dropped anyway */ } }
  }, [session, clear]);

  const token = session?.token ?? null;
  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  // Live updates: authenticated SSE stream, reconnect on drop.
  const qcRef = useRef(qc);
  qcRef.current = qc;
  useEffect(() => {
    if (!token) return;
    const ctl = new AbortController();
    const invalidate = () =>
      qcRef.current.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith('/api/acts/admin') });
    (async () => {
      while (!ctl.signal.aborted) {
        try {
          const res = await fetch(`${API_BASE}/acts/admin/events`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
            signal: ctl.signal,
          });
          if (res.status === 401) { clear(); return; }
          if (!res.ok || !res.body) throw new Error('stream');
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          let buf = '';
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            let i;
            while ((i = buf.indexOf('\n\n')) >= 0) {
              const block = buf.slice(0, i); buf = buf.slice(i + 2);
              for (const line of block.split('\n')) {
                if (!line.startsWith('data:')) continue;
                try { if (JSON.parse(line.slice(5)).type === 'changed') invalidate(); } catch { /* keepalive */ }
              }
            }
          }
        } catch { if (ctl.signal.aborted) return; }
        if (ctl.signal.aborted) return;
        await new Promise((r) => setTimeout(r, 2500));
        invalidate();
      }
    })();
    return () => ctl.abort();
  }, [token, clear]);

  return (
    <AdminCtx.Provider value={{ token, checking, headers, login, logout }}>{children}</AdminCtx.Provider>
  );
}

export const POLL_MS = 5000;

export const rupees = (paise: number) =>
  (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
export const fmtDate = (iso: string | null | undefined, time = false) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', time
      ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }
      : { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
    : '—';
export const toDateInput = (iso: string | null) => {
  if (!iso) return '';
  return new Date(new Date(iso).getTime() + 330 * 60000).toISOString().slice(0, 10);
};
export const fromDateInput = (v: string) => (v ? new Date(`${v}T09:00:00+05:30`).toISOString() : null);
export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
export const isAuthError = (e: unknown) => (e as { status?: number })?.status === 401;

export function csvCell(v: unknown): string {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
