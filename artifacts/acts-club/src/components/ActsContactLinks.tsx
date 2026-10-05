import { ACTS_CONTACT } from '@/lib/contact';

export function ActsContactLinks() {
  return <>
    Email: <a className="break-all underline" href={`mailto:${ACTS_CONTACT.email}`}>{ACTS_CONTACT.email}</a>
    <br />Phone: <a className="underline" href={ACTS_CONTACT.phoneHref}>{ACTS_CONTACT.phone}</a>
  </>;
}
