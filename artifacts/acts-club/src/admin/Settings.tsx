import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncActsBackup, updateActsBackupSettings, useGetActsBackupSettings } from '@workspace/api-client-react';
import { AlertTriangle, CheckCircle2, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { POLL_MS, errMsg, fmtDate, useAdmin } from './admin-api';
import { ErrorBox, PageHead, Panel, Skeleton, btn, btnDark, field } from './admin-ui';

const root = import.meta.env.BASE_URL;

export default function Settings() {
  const { headers } = useAdmin();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useGetActsBackupSettings({ query: { queryKey: ['/api/acts/admin/backup'], refetchInterval: POLL_MS }, request: { headers } });
  const [wb, setWb] = useState('');
  const [busy, setBusy] = useState<'' | 'save' | 'sync'>('');
  useEffect(() => { if (data) setWb((cur) => cur || data.workbookId); }, [data]);
  const refresh = () => qc.invalidateQueries({ queryKey: ['/api/acts/admin/backup'] });

  async function save() {
    setBusy('save');
    try { await updateActsBackupSettings({ workbookId: wb.trim() }, { headers }); await refresh(); toast({ title: 'Workbook saved' }); }
    catch (e) { toast({ title: 'Could not save', description: errMsg(e), variant: 'destructive' }); }
    finally { setBusy(''); }
  }
  async function sync() {
    setBusy('sync');
    try { const r = await syncActsBackup({ headers }); toast({ title: `Synced ${r.synced} record${r.synced === 1 ? '' : 's'}` }); }
    catch (e) { toast({ title: 'Sync failed', description: errMsg(e), variant: 'destructive' }); }
    finally { await refresh(); setBusy(''); }
  }
  const validId = /^[A-Za-z0-9_-]{20,100}$/.test(wb.trim());

  return (
    <div>
      <PageHead title="Backup and settings" sub="Mirror every record to a Google Sheet you own." />
      {error ? <ErrorBox message={errMsg(error)} onRetry={() => void refetch()} /> : isLoading ? <Skeleton className="h-64" /> : data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            {data.configured ? (
              <p className="flex items-center gap-2 text-sm font-bold text-[#1f5c4d]" data-testid="status-backup"><CheckCircle2 size={16} /> Backup configured</p>
            ) : (
              <p className="flex items-start gap-2 rounded-xl bg-[#e8b73a]/25 p-3 text-sm font-semibold text-[#7a5a05]" data-testid="status-backup"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> Setup needed. Backup is not configured, so nothing is being copied to Google Sheets yet.</p>
            )}
            <dl className="mt-4 space-y-2 text-[13px]">
              <div className="flex justify-between gap-3"><dt className="text-ink/55">Last sync</dt><dd data-testid="text-last-sync">{data.lastSyncAt ? fmtDate(data.lastSyncAt, true) : 'Never'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink/55">Credentials</dt><dd>{data.credentialSource === 'dedicated' ? 'Dedicated ACTS' : 'Shared owner'}</dd></div>
            </dl>
            {data.lastSyncError && <p role="alert" className="mt-3 break-words rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-900" data-testid="text-sync-error">Last sync error: {data.lastSyncError}</p>}
            {data.workbookUrl && data.workbookId && <a href={data.workbookUrl} target="_blank" rel="noopener noreferrer" className={`${btn} mt-4`} data-testid="link-workbook"><ExternalLink size={14} /> Open workbook</a>}
            <label className="mt-5 block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-ink/45">Workbook ID</span>
              <input value={wb} onChange={(e) => setWb(e.target.value)} className={`${field} font-mono`} placeholder="From the sheet URL between /d/ and /edit" data-testid="input-workbook" /></label>
            {wb && !validId && <p className="mt-1 text-[12px] text-red-700">Use the ID only (20 to 100 letters, digits, - or _), not the full link.</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button className={btnDark} disabled={!validId || busy !== '' || wb.trim() === data.workbookId} onClick={save} data-testid="button-save-workbook">{busy === 'save' ? 'Saving...' : 'Save workbook'}</button>
              <button className={btn} disabled={!data.configured || busy !== ''} onClick={sync} data-testid="button-sync"><RefreshCw size={14} className={busy === 'sync' ? 'animate-spin' : ''} />{busy === 'sync' ? 'Syncing...' : 'Sync now'}</button>
            </div>
          </Panel>
          <Panel>
            <h3 className="font-display text-xl font-bold">Migration guide</h3>
            <p className="mt-2 text-sm text-ink/60">Move the ACTS backend and sheet to your own accounts. Download the guide and the Apps Script, then follow the steps in order.</p>
            <div className="mt-4 flex flex-col gap-2">
              <a className={btn} href={`${root}admin-assets/ACTS-DEPLOYMENT.md`} target="_blank" rel="noopener noreferrer" data-testid="link-guide">Read ACTS-DEPLOYMENT.md</a>
              <a className={btn} href={`${root}admin-assets/ACTS-DEPLOYMENT.md`} download data-testid="download-guide"><Download size={14} /> Download guide</a>
              <a className={btn} href={`${root}admin-assets/ActsClubCrmBackup.gs`} download data-testid="download-script"><Download size={14} /> Download Apps Script (.gs)</a>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
