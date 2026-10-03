import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { ActsMemberInput } from '@workspace/api-client-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useActsMembership } from '@/hooks/use-acts-membership';

const YOU_ARE = ['Freelancer', 'Creator', 'Entrepreneur', 'Other'];
const CREATOR = ['Content Creator', 'Video Creator', 'UGC Creator', 'Influencer', 'Educator', 'Podcaster', 'Photographer', 'Other'];
const SKILLS = ['Video Editing', 'Content Creation', 'Graphic Design', 'Photography', 'Copywriting', 'Social Media', 'Web Development', 'Marketing', 'Other'];
const LOOKING = ['Projects & Opportunities', 'Collaborations', 'Networking', 'Learning', 'All of the above'];
const legalHref = (path: string) => `${import.meta.env.BASE_URL}${path}`;

type V = {
  fullName: string; contactNumber: string; whatsappNumber: string; city: string; instagramId: string;
  youAre: string; creatorType: string; otherType: string; primarySkill: string; otherSkill: string;
  lookingFor: string; agrees: boolean;
};
const empty: V = { fullName: '', contactNumber: '', whatsappNumber: '', city: '', instagramId: '', youAre: '', creatorType: '', otherType: '', primarySkill: '', otherSkill: '', lookingFor: '', agrees: false };

const fromApp = (a: ActsMemberInput): V => ({
  fullName: a.fullName, contactNumber: a.contactNumber, whatsappNumber: a.whatsappNumber, city: a.city,
  instagramId: a.instagramId ?? '', youAre: a.youAre ?? '', creatorType: a.creatorType ?? '', otherType: a.otherType ?? '',
  primarySkill: a.primarySkill, otherSkill: a.otherSkill ?? '', lookingFor: a.lookingFor ?? '', agrees: true,
});

const digits = (s: string) => s.replace(/\D/g, '').length;
const phoneOk = (s: string) => /^\+?[\d\s\-()]+$/.test(s) && digits(s) >= 8 && digits(s) <= 15;

function validate(v: V) {
  const e: Partial<Record<keyof V, string>> = {};
  const name = v.fullName.trim();
  if (name.length < 2) e.fullName = 'Enter your full name.';
  else if (name.length > 100) e.fullName = 'Keep this under 100 characters.';
  if (!phoneOk(v.contactNumber.trim())) e.contactNumber = 'Enter a number with 8 to 15 digits.';
  if (!phoneOk(v.whatsappNumber.trim())) e.whatsappNumber = 'Enter a number with 8 to 15 digits.';
  const city = v.city.trim();
  if (city.length < 2) e.city = 'Enter your city.';
  else if (city.length > 100) e.city = 'Keep this under 100 characters.';
  const ig = v.instagramId.trim().replace(/^@/, '');
  if (ig && (!/^[A-Za-z0-9._]+$/.test(ig) || ig.length > 30)) e.instagramId = 'Use letters, numbers, periods or underscores (max 30).';
  const needType = v.youAre === 'Other' || (v.youAre === 'Creator' && v.creatorType === 'Other');
  if (v.youAre === 'Creator' && !v.creatorType) e.creatorType = 'Choose your creator type.';
  if (needType && !v.otherType.trim()) e.otherType = 'Tell us your type.';
  if (needType && v.otherType.trim().length > 100) e.otherType = 'Keep this under 100 characters.';
  if (!v.primarySkill) e.primarySkill = 'Choose your primary skill.';
  if (v.primarySkill === 'Other' && !v.otherSkill.trim()) e.otherSkill = 'Tell us your skill.';
  if (v.primarySkill === 'Other' && v.otherSkill.trim().length > 100) e.otherSkill = 'Keep this under 100 characters.';
  if (!v.agrees) e.agrees = 'Please agree to continue.';
  return e;
}

function build(v: V): ActsMemberInput {
  const out: ActsMemberInput = {
    fullName: v.fullName.trim(), contactNumber: v.contactNumber.trim(), whatsappNumber: v.whatsappNumber.trim(),
    city: v.city.trim(), primarySkill: v.primarySkill as ActsMemberInput['primarySkill'], agreesToGuidelines: true,
  };
  const ig = v.instagramId.trim().replace(/^@/, '');
  if (ig) out.instagramId = ig;
  if (v.youAre) out.youAre = v.youAre as ActsMemberInput['youAre'];
  if (v.youAre === 'Creator' && v.creatorType) out.creatorType = v.creatorType as ActsMemberInput['creatorType'];
  const needType = v.youAre === 'Other' || (v.youAre === 'Creator' && v.creatorType === 'Other');
  if (needType) out.otherType = v.otherType.trim();
  if (v.primarySkill === 'Other') out.otherSkill = v.otherSkill.trim();
  if (v.lookingFor) out.lookingFor = v.lookingFor as ActsMemberInput['lookingFor'];
  return out;
}

const field = 'w-full rounded-xl border-2 border-ink/20 bg-card min-h-11 px-3.5 py-2.5 text-base text-ink focus:border-acts focus:outline-none disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-ink/70 aria-[invalid=true]:border-red-700';

function Field({ id, label, optional, error, children }: { id: string; label: string; optional?: boolean; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-bold">{label}{optional ? <span className="font-medium text-ink/50"> (optional)</span> : <span className="text-acts" aria-hidden> *</span>}</label>
      {children}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}

function Sel({ id, value, onChange, options, placeholder, disabled, error }: { id: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string; disabled: boolean; error?: string }) {
  return (
    <select id={id} data-testid={`select-${id}`} value={value} disabled={disabled} onChange={e => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={field}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function MembershipDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const m = useActsMembership(open);
  const [v, setV] = useState<V>(empty);
  const [errs, setErrs] = useState<Partial<Record<keyof V, string>>>({});
  const restored = useRef<string | null>(null);
  const set = <K extends keyof V>(k: K, val: V[K]) => { setV(p => ({ ...p, [k]: val })); if (errs[k]) setErrs(p => ({ ...p, [k]: undefined })); };

  useEffect(() => {
    if (m.initialApplication && m.snapshot && restored.current !== m.snapshot.orderId) {
      restored.current = m.snapshot.orderId;
      setV(fromApp(m.initialApplication));
    }
  }, [m.initialApplication, m.snapshot]);

  const locked = m.hasCheckout && !!m.snapshot;
  const disabled = m.busy || locked;
  const needType = v.youAre === 'Other' || (v.youAre === 'Creator' && v.creatorType === 'Other');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (m.busy) return;
    m.clearError();
    if (locked && m.snapshot) { void m.beginCheckout(m.snapshot.application); return; }
    const found = validate(v);
    setErrs(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      document.getElementById(first === 'agrees' ? 'agrees' : first)?.focus();
      return;
    }
    void m.beginCheckout(build(v));
  };

  const app = m.snapshot?.application;
  const showForm = m.phase === 'form' || m.phase === 'restoring' || m.phase === 'preparing' || m.phase === 'checkout';

  return (
    <Dialog open={open && m.phase !== 'checkout'} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100%-1rem)] max-w-xl gap-3 overflow-y-auto overscroll-contain rounded-3xl border-0 bg-cream p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-7" data-testid="dialog-join">
        {m.phase === 'success' && m.snapshot ? (
          <div className="space-y-4 py-2" data-testid="text-join-success">
            <p className="text-xs font-bold tracking-widest text-acts">PAYMENT SUCCESSFUL</p>
            <DialogTitle className="font-display text-3xl font-extrabold uppercase">Payment received</DialogTitle>
            <DialogDescription className="text-ink/75">
              Thank you for joining ACTS. Your membership information has been received. Our team may review your profile before granting full community access. ₹99 one-time payment for ACTS Membership was successful. Approval is not automatic.
            </DialogDescription>
            <dl className="rounded-2xl bg-card p-4 text-sm ring-1 ring-ink/10">
              <div className="flex justify-between gap-4"><dt className="text-ink/60">Name</dt><dd className="font-bold" data-testid="text-success-name">{m.snapshot.application.fullName}</dd></div>
              <div className="mt-2 flex justify-between gap-4"><dt className="text-ink/60">Reference</dt><dd className="break-all text-right font-bold" data-testid="text-success-ref">{m.snapshot.memberId}</dd></div>
            </dl>
            <button type="button" onClick={() => onOpenChange(false)} data-testid="button-success-close" className="btn-3d btn-3d--ink w-full min-h-11 py-3 font-display font-bold">DONE</button>
          </div>
        ) : m.phase === 'verifying' || m.phase === 'pending' ? (
          <div className="space-y-4 py-2" data-testid="status-confirmation">
            <p className="text-xs font-bold tracking-widest text-acts">{m.phase === 'verifying' ? 'CONFIRMING PAYMENT' : 'PAYMENT PENDING'}</p>
            <DialogTitle className="font-display text-3xl font-extrabold uppercase">{m.phase === 'verifying' ? 'Confirming your payment' : 'Still confirming'}</DialogTitle>
            <DialogDescription className="text-ink/75">
              {m.phase === 'verifying' ? 'Please keep this window open while we confirm with our payment partner.' : 'We have not yet received confirmation. Check the status again in a moment.'}
            </DialogDescription>
            {m.error && <p role="alert" className="rounded-xl bg-acts/10 p-3 text-sm font-medium" data-testid="text-error">{m.error}</p>}
            {m.phase === 'verifying' ? (
              <div className="h-2 overflow-hidden rounded-full bg-ink/10" aria-hidden><div className="h-full w-1/3 animate-pulse rounded-full bg-acts" /></div>
            ) : (
              <button type="button" disabled={m.busy} onClick={() => void m.retryConfirmation()} data-testid="button-check-status" className="btn-3d btn-3d--orange w-full min-h-11 py-3 font-display font-bold">CHECK PAYMENT STATUS</button>
            )}
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs font-bold tracking-widest text-acts">FOUNDING MEMBER ACCESS</p>
              <DialogTitle className="font-display text-2xl font-extrabold uppercase sm:text-3xl">ACTS Membership</DialogTitle>
              <DialogDescription className="mt-1 flex flex-wrap items-baseline gap-x-2 text-ink/75">
                <span className="font-display text-2xl font-extrabold text-ink">₹99</span><span>One-time payment</span>
              </DialogDescription>
            </div>
            {m.phase === 'restoring' && <p className="rounded-xl bg-ink/5 p-3 text-sm" role="status" data-testid="status-restoring">Checking your earlier checkout...</p>}
            {locked && app && (
              <p className="rounded-xl bg-ink/5 p-3 text-sm" data-testid="text-locked-note">
                These details are linked to your existing checkout and cannot be changed. Continue to retry the same payment.
              </p>
            )}
            {m.error && (
              <div role="alert" className="flex items-start justify-between gap-3 rounded-xl bg-acts/10 p-3 text-sm font-medium" data-testid="text-error">
                <span>{m.error}</span>
                <button type="button" onClick={m.clearError} className="shrink-0 font-bold underline" data-testid="button-dismiss-error">Dismiss</button>
              </div>
            )}
            {showForm && (
              <form noValidate onSubmit={submit} className="space-y-3" data-testid="form-join">
                <Field id="fullName" label="Full Name" error={errs.fullName}>
                  <input id="fullName" data-testid="input-name" autoComplete="name" value={v.fullName} disabled={disabled} onChange={e => set('fullName', e.target.value)} aria-invalid={!!errs.fullName} aria-describedby={errs.fullName ? 'fullName-err' : undefined} className={field} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id="contactNumber" label="Contact Number" error={errs.contactNumber}>
                    <input id="contactNumber" data-testid="input-contact" type="tel" inputMode="tel" autoComplete="tel" value={v.contactNumber} disabled={disabled} onChange={e => set('contactNumber', e.target.value)} aria-invalid={!!errs.contactNumber} aria-describedby={errs.contactNumber ? 'contactNumber-err' : undefined} className={field} />
                  </Field>
                  <Field id="whatsappNumber" label="WhatsApp Number" error={errs.whatsappNumber}>
                    <input id="whatsappNumber" data-testid="input-whatsapp" type="tel" inputMode="tel" value={v.whatsappNumber} disabled={disabled} onChange={e => set('whatsappNumber', e.target.value)} aria-invalid={!!errs.whatsappNumber} aria-describedby={errs.whatsappNumber ? 'whatsappNumber-err' : undefined} className={field} />
                  </Field>
                  <Field id="city" label="City" error={errs.city}>
                    <input id="city" data-testid="input-city" autoComplete="address-level2" value={v.city} disabled={disabled} onChange={e => set('city', e.target.value)} aria-invalid={!!errs.city} aria-describedby={errs.city ? 'city-err' : undefined} className={field} />
                  </Field>
                  <Field id="instagramId" label="Instagram ID" optional error={errs.instagramId}>
                    <input id="instagramId" data-testid="input-instagram" autoCapitalize="none" autoCorrect="off" value={v.instagramId} disabled={disabled} onChange={e => set('instagramId', e.target.value)} aria-invalid={!!errs.instagramId} aria-describedby={errs.instagramId ? 'instagramId-err' : undefined} className={field} />
                  </Field>
                  <Field id="youAre" label="You are" optional>
                    <Sel id="youAre" value={v.youAre} disabled={disabled} placeholder="Select" options={YOU_ARE} onChange={x => setV(p => ({ ...p, youAre: x, creatorType: x === 'Creator' ? p.creatorType : '', otherType: x === 'Other' || (x === 'Creator' && p.creatorType === 'Other') ? p.otherType : '' }))} />
                  </Field>
                  {v.youAre === 'Creator' && (
                    <Field id="creatorType" label="What type of creator are you?" error={errs.creatorType}>
                      <Sel id="creatorType" value={v.creatorType} disabled={disabled} placeholder="Select" options={CREATOR} error={errs.creatorType} onChange={x => { set('creatorType', x); setV(p => ({ ...p, creatorType: x, otherType: x === 'Other' ? p.otherType : '' })); }} />
                    </Field>
                  )}
                </div>
                {needType && (
                  <Field id="otherType" label="Enter your type" error={errs.otherType}>
                    <input id="otherType" data-testid="input-other-type" value={v.otherType} disabled={disabled} onChange={e => set('otherType', e.target.value)} aria-invalid={!!errs.otherType} aria-describedby={errs.otherType ? 'otherType-err' : undefined} className={field} />
                  </Field>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id="primarySkill" label="Primary Skill" error={errs.primarySkill}>
                    <Sel id="primarySkill" value={v.primarySkill} disabled={disabled} placeholder="Select" options={SKILLS} error={errs.primarySkill} onChange={x => { set('primarySkill', x); if (x !== 'Other') setV(p => ({ ...p, primarySkill: x, otherSkill: '' })); }} />
                  </Field>
                  <Field id="lookingFor" label="What are you looking for through ACTS?" optional>
                    <Sel id="lookingFor" value={v.lookingFor} disabled={disabled} placeholder="Select" options={LOOKING} onChange={x => set('lookingFor', x)} />
                  </Field>
                </div>
                {v.primarySkill === 'Other' && (
                  <Field id="otherSkill" label="Enter your skill" error={errs.otherSkill}>
                    <input id="otherSkill" data-testid="input-other-skill" value={v.otherSkill} disabled={disabled} onChange={e => set('otherSkill', e.target.value)} aria-invalid={!!errs.otherSkill} aria-describedby={errs.otherSkill ? 'otherSkill-err' : undefined} className={field} />
                  </Field>
                )}
                <div>
                  <label htmlFor="agrees" className="flex cursor-pointer items-start gap-2.5 text-sm font-medium">
                    <input id="agrees" data-testid="checkbox-guidelines" type="checkbox" required aria-required="true" checked={v.agrees} disabled={disabled} onChange={e => set('agrees', e.target.checked)} aria-invalid={!!errs.agrees} aria-describedby={errs.agrees ? 'agrees-err' : undefined} className="mt-0.5 h-5 w-5 shrink-0 accent-[#f2561d]" />
                    <span>
                      I agree to the ACTS{' '}
                      <a href={legalHref('terms-and-conditions')} target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-acts decoration-2 underline-offset-2 hover:text-acts focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acts">Terms &amp; Conditions</a>,{' '}
                      <a href={legalHref('privacy-policy')} target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-acts decoration-2 underline-offset-2 hover:text-acts focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acts">Privacy Policy</a>{' '}and{' '}
                      <a href={legalHref('community-guidelines')} target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-acts decoration-2 underline-offset-2 hover:text-acts focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acts">Community Guidelines</a>.{' '}
                      <span className="text-acts" aria-hidden>*</span>
                    </span>
                  </label>
                  {errs.agrees && <p id="agrees-err" role="alert" className="mt-1 text-xs font-medium text-red-700">{errs.agrees}</p>}
                </div>
                <button type="submit" disabled={m.busy} aria-busy={m.busy} data-testid="button-submit-join" className="btn-3d btn-3d--orange w-full min-h-11 py-3 font-display font-bold">
                  {m.busy ? 'Please wait...' : 'Join ACTS for ₹99 →'}
                </button>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
