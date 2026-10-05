import { type ReactNode } from 'react';
import type { ActsCrmRecord } from '@workspace/api-client-react';

export const STAGES = ['new', 'contacted', 'qualified', 'closed'] as const;
const stageTone: Record<string, string> = {
  new: 'bg-[#f2561d]/12 text-[#b53a0e]',
  contacted: 'bg-[#e8b73a]/25 text-[#7a5a05]',
  qualified: 'bg-[#2f7d6b]/15 text-[#1f5c4d]',
  closed: 'bg-[#231f1c]/10 text-[#231f1c]/60',
};
const payTone: Record<string, string> = {
  successful: 'bg-[#2f7d6b]/15 text-[#1f5c4d]',
  pending: 'bg-[#e8b73a]/25 text-[#7a5a05]',
  form_submitted: 'bg-[#231f1c]/8 text-[#231f1c]/60',
};
export const payLabel: Record<string, string> = {
  successful: 'Paid', pending: 'Payment pending', form_submitted: 'Form only',
};

export function Pill({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tone}`}>
      {children}
    </span>
  );
}
export const StagePill = ({ s }: { s: string }) => <Pill tone={stageTone[s] ?? ''}>{s}</Pill>;
export const PayPill = ({ s }: { s: string }) => <Pill tone={payTone[s] ?? ''}>{payLabel[s] ?? s}</Pill>;

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ink/55">{sub}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export const Panel = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-ink/10 bg-card p-4 sm:p-5 ${className}`}>{children}</div>
);

export const btn =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-ink/15 bg-card px-3.5 py-2.5 text-[13px] font-semibold text-ink transition hover:border-ink/35 disabled:cursor-not-allowed disabled:opacity-45';
export const btnDark =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-3.5 py-2.5 text-[13px] font-semibold text-cream transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-45';
export const field =
  'w-full rounded-xl border border-ink/15 bg-white/60 px-3.5 py-2.5 text-[13px] text-ink outline-none placeholder:text-ink/35 focus:border-acts';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-ink/8 ${className}`} />;
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
      <span>{message}</span>
      {onRetry && <button className={btn} onClick={onRetry}>Retry</button>}
    </div>
  );
}

export function Confirm({
  title, body, confirmLabel, onConfirm, onCancel,
}: { title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4" onClick={onCancel}>
      <div role="alertdialog" className="w-full max-w-sm rounded-2xl bg-cream p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-ink/65">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className={btn} onClick={onCancel} data-testid="button-cancel-confirm">Cancel</button>
          <button className={btnDark} onClick={onConfirm} data-testid="button-confirm">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function applicationRows(r: ActsCrmRecord): [string, string][] {
  const a = r.application;
  const v = (x?: string | boolean) => (x === undefined || x === '' ? '—' : String(x));
  return [
    ['Full name', a.fullName], ['Contact number', a.contactNumber], ['WhatsApp number', a.whatsappNumber],
    ['City', a.city], ['Instagram', v(a.instagramId)], ['You are', v(a.youAre)],
    ['Creator type', v(a.creatorType)], ['Other type', v(a.otherType)],
    ['Primary skill', v(a.primarySkill)], ['Other skill', v(a.otherSkill)],
    ['Looking for', v(a.lookingFor)], ['Agrees to guidelines', a.agreesToGuidelines ? 'Yes' : 'No'],
  ];
}
