import { Link } from 'wouter';
import { useGetActsCrmStats } from '@workspace/api-client-react';
import { POLL_MS, errMsg, rupees, useAdmin } from './admin-api';
import { ErrorBox, PageHead, Panel, Skeleton } from './admin-ui';

export default function Dashboard() {
  const { headers } = useAdmin();
  const { data, isLoading, error, refetch } = useGetActsCrmStats({ query: { queryKey: ['/api/acts/admin/crm/stats'], refetchInterval: POLL_MS }, request: { headers } });
  const cards = data ? [
    ['Total applicants', String(data.total), '/admin/crm'],
    ['Paid members', String(data.paid), '/admin/payments'],
    ['Payment pending', String(data.pending), '/admin/payments'],
    ['Form only', String(data.submitted), '/admin/forms'],
    ['Follow-ups due', String(data.followUpsDue), '/admin/crm'],
    ['Archived', String(data.archived), '/admin/crm'],
  ] : [];
  return (
    <div>
      <PageHead title="Dashboard" sub="Live from membership submissions and Razorpay captures." />
      {error ? <ErrorBox message={errMsg(error)} onRetry={() => void refetch()} /> : isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : data && (
        <>
          <div className="mb-3 rounded-2xl bg-ink p-6 text-cream sm:p-8" data-testid="stat-captured">
            <p className="text-[11px] font-bold uppercase tracking-widest text-cream/55">Captured revenue</p>
            <p className="mt-2 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">{rupees(data.capturedAmount)}</p>
            <p className="mt-2 text-sm text-cream/55">{data.paid} captured payment{data.paid === 1 ? '' : 's'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {cards.map(([l, v, to]) => (
              <Link key={l} href={to} className="block" data-testid={`stat-${l.toLowerCase().replace(/\W+/g, '-')}`}>
                <Panel className="h-full transition hover:border-acts"><p className="font-display text-4xl font-extrabold">{v}</p><p className="mt-1 text-[12px] font-semibold text-ink/55">{l}</p></Panel>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
