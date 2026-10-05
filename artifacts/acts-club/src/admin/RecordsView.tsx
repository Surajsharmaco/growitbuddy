import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  bulkUpdateActsCrm, listActsCrm, updateActsCrm, useListActsCrm,
  type ActsCrmRecord, type ActsCrmUpdateInput, type ListActsCrmParams,
} from '@workspace/api-client-react';
import { ChevronLeft, ChevronRight, Download, RefreshCw, Search, X, Archive, ArchiveRestore } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DATE_PRESETS, indiaToday, isCalendarDate, presetDates, type DatePreset } from './date-filter';
import {
  POLL_MS, csvCell, errMsg, fmtDate, fromDateInput, rupees, toDateInput, useAdmin,
} from './admin-api';
import {
  Confirm, ErrorBox, PageHead, PayPill, Skeleton, StagePill, STAGES, applicationRows, btn, btnDark, field,
} from './admin-ui';

export type Mode = 'crm' | 'forms' | 'payments' | 'followups';
const LIMIT = 25;

function Drawer({ rec, mode, onClose }: { rec: ActsCrmRecord; mode: Mode; onClose: () => void }) {
  const { headers } = useAdmin();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [notes, setNotes] = useState(rec.notes);
  const [follow, setFollow] = useState(toDateInput(rec.followUpAt));
  const [busy, setBusy] = useState(false);
  const [askArchive, setAskArchive] = useState(false);
  const editable = mode === 'crm' || mode === 'followups';

  useEffect(() => { setNotes(rec.notes); setFollow(toDateInput(rec.followUpAt)); }, [rec.id, rec.notes, rec.followUpAt]);

  async function save(changes: ActsCrmUpdateInput, msg: string) {
    setBusy(true);
    try {
      await updateActsCrm(rec.id, changes, { headers });
      await qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith('/api/acts/admin') });
      toast({ title: msg });
    } catch (e) { toast({ title: 'Could not save', description: errMsg(e), variant: 'destructive' }); }
    finally { setBusy(false); }
  }
  const dirty = notes !== rec.notes || follow !== toDateInput(rec.followUpAt);

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-ink/30" />
      <aside className="flex h-full w-full max-w-[480px] flex-col overflow-y-auto bg-cream shadow-2xl" onClick={(e) => e.stopPropagation()} data-testid="drawer-record">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-ink/10 bg-cream px-5 py-4">
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-ink/8" data-testid="button-close-drawer"><X size={16} /></button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold">{rec.application.fullName}</p>
            <div className="mt-1 flex flex-wrap gap-1.5"><StagePill s={rec.stage} /><PayPill s={rec.paymentStatus} />
              {rec.archived && <span className="rounded-full bg-ink/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">Archived</span>}</div>
          </div>
        </header>
        <div className="space-y-6 px-5 py-5">
          <section>
            <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-ink/45">Submitted application</h4>
            <dl className="divide-y divide-ink/8 overflow-hidden rounded-xl border border-ink/10 bg-card">
              {applicationRows(rec).map(([k, v]) => (
                <div key={k} className="flex gap-3 px-4 py-2.5"><dt className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-ink/45">{k}</dt><dd className="min-w-0 flex-1 break-words text-[13px]">{v}</dd></div>
              ))}
            </dl>
          </section>
          <section>
            <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-ink/45">Payment (read only)</h4>
            <dl className="divide-y divide-ink/8 overflow-hidden rounded-xl border border-ink/10 bg-card">
              {([
                ['Status', rec.paymentStatus.replace('_', ' ')], ['Amount', rupees(rec.amount)], ['Order ID', rec.orderId ?? '—'],
                ['Payment ID', rec.paymentId ?? '—'], ['Paid at', fmtDate(rec.paidAt, true)], ['Review', rec.reviewStatus.replace('_', ' ')],
                ['Submitted', fmtDate(rec.createdAt, true)], ['Updated', fmtDate(rec.updatedAt, true)],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex gap-3 px-4 py-2.5"><dt className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-ink/45">{k}</dt><dd className="min-w-0 flex-1 break-all text-[13px]">{v}</dd></div>
              ))}
            </dl>
          </section>
          {editable ? (
            <>
              <section>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-ink/45">Stage</h4>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map((s) => (
                    <button key={s} disabled={busy} onClick={() => save({ stage: s }, `Moved to ${s}`)} data-testid={`button-stage-${s}`}
                      className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold capitalize transition ${rec.stage === s ? 'border-acts bg-acts/12 text-[#b53a0e]' : 'border-ink/15 text-ink/55 hover:border-ink/35'}`}>{s}</button>
                  ))}
                </div>
              </section>
              <section className="space-y-3">
                <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-ink/45">Follow-up date</span>
                  <input type="date" value={follow} onChange={(e) => setFollow(e.target.value)} className={field} data-testid="input-followup" /></label>
                <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-ink/45">Internal notes</span>
                  <textarea rows={5} maxLength={10000} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${field} resize-none`} placeholder="Notes about this member" data-testid="input-notes" /></label>
                <div className="flex justify-end gap-2">
                  {follow && <button className={btn} disabled={busy} onClick={() => setFollow('')}>Clear date</button>}
                  <button className={btnDark} disabled={busy || !dirty || (!!follow && !isCalendarDate(follow))} data-testid="button-save-record"
                    onClick={() => save({ notes, followUpAt: fromDateInput(follow) }, 'Saved')}>{busy ? 'Saving...' : 'Save changes'}</button>
                </div>
                {mode === 'followups' && rec.followUpAt && <button className={btn} disabled={busy || dirty}
                  data-testid="button-complete-followup" onClick={() => save({ followUpAt: null }, 'Follow-up completed')}>
                  Mark follow-up done
                </button>}
              </section>
              <section className="border-t border-ink/10 pt-4">
                {rec.archived
                  ? <button className={btn} disabled={busy} onClick={() => save({ archived: false }, 'Restored')} data-testid="button-restore"><ArchiveRestore size={14} /> Restore record</button>
                  : <button className={btn} disabled={busy} onClick={() => setAskArchive(true)} data-testid="button-archive"><Archive size={14} /> Archive record</button>}
              </section>
            </>
          ) : (
            <>
              <p className="rounded-xl bg-ink/6 px-4 py-3 text-[12px] text-ink/60">Read only view. Stage, notes and archiving are managed in the CRM tab.</p>
              {rec.notes && <p className="whitespace-pre-wrap text-[13px]">{rec.notes}</p>}
            </>
          )}
        </div>
      </aside>
      {askArchive && <Confirm title="Archive this record?" body="It is hidden from default lists but never deleted. You can restore it any time." confirmLabel="Archive"
        onCancel={() => setAskArchive(false)} onConfirm={() => { setAskArchive(false); void save({ archived: true }, 'Archived'); }} />}
    </div>
  );
}

export default function RecordsView({ mode }: { mode: Mode }) {
  const { headers } = useAdmin();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [stage, setStage] = useState('');
  const [pay, setPay] = useState(mode === 'payments' ? 'successful' : '');
  const [archived, setArchived] = useState(false);
  const [followFilter, setFollowFilter] = useState<'all' | 'due' | 'overdue' | 'upcoming'>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [today, setToday] = useState(indiaToday);
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);
  const dates = datePreset === 'custom' ? { fromDate: customFrom, toDate: customTo } : presetDates(datePreset, today);
  const dateError = datePreset === 'custom' && (!isCalendarDate(customFrom) || !isCalendarDate(customTo) || customFrom > customTo)
    ? 'Choose two valid dates. From must not be after To.' : '';
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { const t = setTimeout(() => setQ(search.trim()), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { const timer = setInterval(() => setToday(indiaToday()), 60_000); return () => clearInterval(timer); }, []);
  useEffect(() => { setPage(1); setSelected(new Set()); setOpenId(null); }, [q, stage, pay, archived, followFilter, dates.fromDate, dates.toDate]);

  const params: ListActsCrmParams = {
    page, limit: LIMIT, includeArchived: archived,
    ...(q ? { search: q } : {}), ...(stage ? { stage } : {}), ...(pay ? { paymentStatus: pay } : {}),
    ...(dates.fromDate && dates.toDate ? dates : {}),
    ...(mode === 'followups' ? { followUps: followFilter } : {}),
  };
  const { data, isLoading, error, refetch, isFetching } = useListActsCrm(params, {
    query: { queryKey: ['/api/acts/admin/crm', params], enabled: !dateError, refetchInterval: POLL_MS },
    request: { headers },
  });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const open = items.find((r) => r.id === openId) ?? null;
  const allSel = items.length > 0 && items.every((r) => selected.has(r.id));

  const refresh = () => qc.invalidateQueries({ predicate: (x) => String(x.queryKey[0]).startsWith('/api/acts/admin') });
  async function bulk(changes: ActsCrmUpdateInput, msg: string) {
    try {
      const res = await bulkUpdateActsCrm({ ids: Array.from(selected), changes }, { headers });
      toast({ title: `${msg}: ${res.updated} record${res.updated === 1 ? '' : 's'}` });
      setSelected(new Set()); await refresh();
    } catch (e) { toast({ title: 'Bulk update failed', description: errMsg(e), variant: 'destructive' }); }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const all: ActsCrmRecord[] = [];
      const seen = new Set<string>();
      let expected: number | null = null;
      for (let p = 1; p <= 500; p++) {
        const r = await listActsCrm({ ...params, page: p, limit: 100 }, { headers });
        if (expected === null) expected = r.total;
        if (r.total !== expected || r.items.some(item => seen.has(item.id))) {
          throw new Error('Records changed during export. Please retry for a complete export.');
        }
        r.items.forEach(item => seen.add(item.id));
        all.push(...r.items);
        if (all.length === expected) break;
        if (r.items.length === 0) throw new Error('Export was incomplete. Please retry.');
      }
      if (all.length !== expected) throw new Error('Export exceeds 50,000 records. Use a full database backup rather than a partial CSV.');
      const head = ['ID', 'Full name', 'Contact', 'WhatsApp', 'City', 'Instagram', 'You are', 'Creator type', 'Other type', 'Primary skill', 'Other skill', 'Looking for', 'Agrees to guidelines', 'Stage', 'Archived', 'Follow-up', 'Notes', 'Payment status', 'Amount INR', 'Order ID', 'Payment ID', 'Paid at', 'Review status', 'Created', 'Updated'];
      const rows = all.map((r) => { const a = r.application; return [r.id, a.fullName, a.contactNumber, a.whatsappNumber, a.city, a.instagramId, a.youAre, a.creatorType, a.otherType, a.primarySkill, a.otherSkill, a.lookingFor, a.agreesToGuidelines, r.stage, r.archived, r.followUpAt, r.notes, r.paymentStatus, (r.amount / 100).toFixed(2), r.orderId, r.paymentId, r.paidAt, r.reviewStatus, r.createdAt, r.updatedAt].map(csvCell).join(','); });
      const blob = new Blob(['\ufeff' + [head.map(csvCell).join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `acts-${mode}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast({ title: `Exported ${all.length} records` });
    } catch (e) { toast({ title: 'Export failed', description: errMsg(e), variant: 'destructive' }); }
    finally { setExporting(false); }
  }

  const titles = {
    crm: ['CRM', 'Every applicant, their stage and your follow-ups.'],
    forms: ['Form submissions', 'Real membership applications exactly as submitted.'],
    payments: ['Payments', 'Razorpay-captured and pending membership payments. Read only.'],
    followups: ['Follow-ups', 'Scheduled open follow-ups, earliest date first. Closed records are excluded.'],
  }[mode];
  const chip = (on: boolean) => `rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${on ? 'border-ink bg-ink text-cream' : 'border-ink/15 text-ink/60 hover:border-ink/35'}`;

  return (
    <div>
      <PageHead title={titles[0]} sub={`${titles[1]} ${data && !dateError ? `${total} match${total === 1 ? '' : 'es'}.` : ''}`}>
        <button className={btn} disabled={!!dateError} onClick={() => void refetch()} aria-label="Refresh" data-testid="button-refresh"><RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /></button>
        <button className={btnDark} onClick={exportCsv} disabled={exporting || total === 0 || !!dateError || isFetching || !!error} data-testid="button-export-csv"><Download size={14} />{exporting ? 'Exporting...' : 'Export CSV'}</button>
      </PageHead>

      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, city, number, Instagram..." className={`${field} pl-9`} data-testid="input-search" />
        </div>
      </div>
      {mode === 'followups' && <div className="mb-3 flex flex-wrap gap-2">
        {(['all', 'due', 'overdue', 'upcoming'] as const).map((value) => <button key={value}
          className={chip(followFilter === value)} data-testid={`filter-followup-${value}`}
          onClick={() => { setFollowFilter(value); setDatePreset('all'); }}>
          {{ all: 'All scheduled', due: 'Today & overdue', overdue: 'Overdue', upcoming: 'Upcoming' }[value]}
        </button>)}
      </div>}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {mode !== 'payments' && <>
          <button className={chip(stage === '')} onClick={() => setStage('')}>All stages</button>
          {STAGES.filter(s => mode !== 'followups' || s !== 'closed').map((s) => <button key={s} className={`${chip(stage === s)} capitalize`} onClick={() => setStage(s)} data-testid={`filter-stage-${s}`}>{s}</button>)}
          <span className="mx-1 h-5 w-px bg-ink/15" />
        </>}
        {mode === 'payments'
          ? (['successful', 'pending'] as const).map((p) => <button key={p} className={chip(pay === p)} onClick={() => setPay(p)} data-testid={`filter-pay-${p}`}>{p === 'successful' ? 'Paid' : 'Pending'}</button>)
          : <select value={pay} onChange={(e) => setPay(e.target.value)} className={`${field} !w-auto`} data-testid="select-payment">
            <option value="">Any payment</option><option value="successful">Paid</option><option value="pending">Payment pending</option><option value="form_submitted">Form only</option></select>}
        <label className="ml-auto flex items-center gap-2 text-[12px] font-semibold text-ink/65">
          <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} data-testid="checkbox-archived" /> Include archived</label>
      </div>

      <div className="mb-5 rounded-xl border border-ink/10 bg-card p-4">
        <div className="grid grid-cols-1 items-end gap-3 sm:flex sm:flex-wrap">
          <label className="min-w-0 flex-1 sm:max-w-52">
            <span className="mb-1.5 block text-[12px] font-semibold">{mode === 'followups' ? 'Follow-up date filter' : 'Date filter'}</span>
            <select className={field} value={datePreset} onChange={(e) => setDatePreset(e.target.value as DatePreset)} data-testid="select-date-filter">
              {DATE_PRESETS.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
            </select>
          </label>
          {datePreset === 'custom' && <>
            <label className="min-w-0 flex-1 sm:max-w-48"><span className="mb-1.5 block text-[12px] font-semibold">From</span>
              <input type="date" className={field} value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} data-testid="input-date-from" /></label>
            <label className="min-w-0 flex-1 sm:max-w-48"><span className="mb-1.5 block text-[12px] font-semibold">To</span>
              <input type="date" className={field} value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} data-testid="input-date-to" /></label>
          </>}
          {datePreset !== 'all' && <button className={btn} onClick={() => setDatePreset('all')} data-testid="button-clear-date">Clear dates</button>}
        </div>
        <p className="mt-2 text-[11px] text-ink/55">By {mode === 'followups' ? 'follow-up' : 'submission'} date · India Standard Time (IST) · Both dates included.{dates.fromDate && dates.toDate ? ` ${dates.fromDate} to ${dates.toDate}.` : ''}</p>
        {dateError && <p role="alert" className="mt-2 text-sm text-red-700">{dateError}</p>}
      </div>
      {mode === 'crm' && selected.size > 0 && (
        <div className="sticky top-[60px] z-20 mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-ink px-4 py-3 text-cream" data-testid="bar-bulk">
          <span className="text-[13px] font-semibold">{selected.size} selected</span>
          <select defaultValue="" onChange={(e) => { if (e.target.value) { void bulk({ stage: e.target.value as ActsCrmUpdateInput['stage'] }, `Stage set to ${e.target.value}`); e.target.value = ''; } }}
            className="rounded-lg bg-cream/15 px-2 py-1.5 text-[12px] text-cream" data-testid="select-bulk-stage">
            <option value="" className="text-ink">Set stage...</option>{STAGES.map((s) => <option key={s} value={s} className="text-ink">{s}</option>)}</select>
          <button className="rounded-lg bg-cream/15 px-3 py-1.5 text-[12px] font-semibold" onClick={() => setConfirmBulk(true)} data-testid="button-bulk-archive">Archive</button>
          <button className="rounded-lg bg-cream/15 px-3 py-1.5 text-[12px] font-semibold" onClick={() => void bulk({ archived: false }, 'Restored')} data-testid="button-bulk-restore">Restore</button>
          <button className="ml-auto text-[12px] underline" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {error ? <ErrorBox message={errMsg(error)} onRetry={() => void refetch()} />
        : dateError ? <p className="text-sm text-ink/60">Choose a valid date range to view records.</p>
        : isLoading ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/20 px-6 py-14 text-center" data-testid="empty-records">
            <p className="font-display text-xl font-bold">{mode === 'followups' ? 'No scheduled follow-ups here' : 'Nothing here yet'}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink/55">{q || stage || pay || datePreset !== 'all' || followFilter !== 'all' ? 'No records match these filters. Try clearing them.' : mode === 'followups' ? 'Set a follow-up date in CRM and save it. It will appear here automatically.' : 'New membership submissions appear here the moment they arrive.'}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-card">
            {mode === 'crm' && (
              <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-ink/45">
                <input type="checkbox" checked={allSel} aria-label="Select page" data-testid="checkbox-select-all"
                  onChange={() => setSelected(allSel ? new Set() : new Set(items.map((r) => r.id)))} /> Select page
              </div>
            )}
            <ul className="divide-y divide-ink/8">
              {items.map((r) => (
                <li key={r.id} className={`flex items-center gap-3 px-4 py-3 transition hover:bg-acts/5 ${r.archived ? 'opacity-60' : ''}`} data-testid={`row-record-${r.id}`}>
                  {mode === 'crm' && <input type="checkbox" checked={selected.has(r.id)} aria-label={`Select ${r.application.fullName}`}
                    onChange={() => setSelected((s) => { const n = new Set(s); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n; })} />}
                  <button className="min-w-0 flex-1 text-left" onClick={() => setOpenId(r.id)}>
                    <p className="truncate text-[14px] font-bold">{r.application.fullName}</p>
                    <p className="truncate text-[12px] text-ink/55">{r.application.city} · {r.application.primarySkill} · {r.application.contactNumber}</p>
                    {mode === 'payments'
                      ? <p className="mt-0.5 truncate font-mono text-[11px] text-ink/45">{r.paymentId ?? r.orderId ?? '—'}</p>
                      : <p className="mt-0.5 text-[11px] text-ink/40">{mode === 'followups' ? `Follow up ${fmtDate(r.followUpAt)} · ${toDateInput(r.followUpAt) < today ? 'Overdue' : toDateInput(r.followUpAt) === today ? 'Today' : 'Upcoming'}` : `Submitted ${fmtDate(r.createdAt)}${r.followUpAt ? ` · follow up ${fmtDate(r.followUpAt)}` : ''}`}</p>}
                  </button>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {mode === 'payments' ? <span className="text-[13px] font-bold">{rupees(r.amount)}</span> : <StagePill s={r.stage} />}
                    <PayPill s={r.paymentStatus} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

      {total > 0 && !dateError && (
        <div className="mt-4 flex items-center justify-between text-[13px] text-ink/60">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button className={btn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page" data-testid="button-prev"><ChevronLeft size={14} /></button>
            <button className={btn} disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page" data-testid="button-next"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}

      {open && <Drawer rec={open} mode={mode} onClose={() => setOpenId(null)} />}
      {confirmBulk && <Confirm title={`Archive ${selected.size} record(s)?`} body="Archived records are hidden by default, never deleted, and can be restored." confirmLabel="Archive"
        onCancel={() => setConfirmBulk(false)} onConfirm={() => { setConfirmBulk(false); void bulk({ archived: true }, 'Archived'); }} />}
    </div>
  );
}
