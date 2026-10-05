import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Redirect, Route, Switch, useLocation } from 'wouter';
import { CalendarClock, CreditCard, DatabaseBackup, FileText, LayoutDashboard, LogOut, Users } from 'lucide-react';
import { AdminProvider, errMsg, useAdmin } from './admin-api';
import { btnDark, field, Skeleton } from './admin-ui';
import Dashboard from './Dashboard';
import RecordsView from './RecordsView';
import Settings from './Settings';

function Login() {
  const { login, token } = useAdmin();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (token) return <Redirect to="/admin" />;
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try { await login(pw); } catch (x) { setErr((x as { status?: number }).status === 401 ? 'Wrong password.' : errMsg(x)); setBusy(false); }
  }
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-cream p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-ink/10 bg-card p-7 shadow-xl">
        <p className="font-display text-sm font-extrabold uppercase tracking-[0.2em] text-acts">ACTS Club</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-ink/55">Use your GrowitBuddy admin password.</p>
        <input type="password" autoFocus autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" className={`${field} mt-6`} data-testid="input-password" />
        {err && <p role="alert" className="mt-2 text-[13px] text-red-700" data-testid="text-login-error">{err}</p>}
        <button className={`${btnDark} mt-4 w-full`} disabled={!pw || busy} data-testid="button-login">{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </div>
  );
}

const NAV = [
  ['/admin', 'Dashboard', LayoutDashboard], ['/admin/crm', 'CRM', Users], ['/admin/forms', 'Forms', FileText],
  ['/admin/follow-ups', 'Follow-ups', CalendarClock],
  ['/admin/payments', 'Payments', CreditCard], ['/admin/settings', 'Backup', DatabaseBackup],
] as const;

function Shell({ children }: { children: ReactNode }) {
  const { token, checking, logout } = useAdmin();
  const [loc] = useLocation();
  if (checking) return <div className="min-h-[100dvh] bg-cream p-8"><Skeleton className="h-24" /></div>;
  if (!token) return <Redirect to="/admin/login" />;
  return (
    <div className="min-h-[100dvh] bg-cream text-ink md:flex">
      <aside className="sticky top-0 z-30 border-b border-ink/10 bg-cream md:h-[100dvh] md:w-56 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-3 md:block md:py-6">
          <p className="font-display text-lg font-extrabold">ACTS <span className="text-acts">Admin</span></p>
          <button onClick={() => void logout()} className="flex items-center gap-1.5 text-[12px] font-semibold text-ink/55 hover:text-ink md:mt-8" data-testid="button-logout"><LogOut size={14} /> Log out</button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:flex-col md:pb-0">
          {NAV.map(([to, label, Icon]) => {
            const on = to === '/admin' ? loc === '/admin' : loc.startsWith(to);
            return <Link key={to} href={to} data-testid={`link-nav-${label.toLowerCase()}`} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition ${on ? 'bg-ink text-cream' : 'text-ink/60 hover:bg-ink/8'}`}><Icon size={15} />{label}</Link>;
          })}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}

export default function AdminApp() {
  return (
    <AdminProvider>
      <Switch>
        <Route path="/admin/login" component={Login} />
        <Route>
          <Shell>
            <Switch>
              <Route path="/admin" component={Dashboard} />
              <Route path="/admin/crm"><RecordsView mode="crm" /></Route>
              <Route path="/admin/follow-ups"><RecordsView mode="followups" /></Route>
              <Route path="/admin/forms"><RecordsView mode="forms" /></Route>
              <Route path="/admin/payments"><RecordsView mode="payments" /></Route>
              <Route path="/admin/settings" component={Settings} />
              <Route><Redirect to="/admin" /></Route>
            </Switch>
          </Shell>
        </Route>
      </Switch>
    </AdminProvider>
  );
}
