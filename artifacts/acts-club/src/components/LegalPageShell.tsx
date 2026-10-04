import { useEffect, type ReactNode } from 'react';

type LegalPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function LegalPageShell({ title, description, children }: LegalPageShellProps) {
  useEffect(() => {
    const originalTitle = document.title;
    let descriptionMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    let ogDescriptionMeta = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    const createdDescription = !descriptionMeta;
    const createdOgDescription = !ogDescriptionMeta;
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta');
      descriptionMeta.name = 'description';
      document.head.appendChild(descriptionMeta);
    }
    if (!ogDescriptionMeta) {
      ogDescriptionMeta = document.createElement('meta');
      ogDescriptionMeta.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescriptionMeta);
    }
    const originalDescription = descriptionMeta.content;
    const originalOgDescription = ogDescriptionMeta.content;

    document.title = title;
    if (descriptionMeta) descriptionMeta.content = description;
    if (ogDescriptionMeta) ogDescriptionMeta.content = description;

    return () => {
      document.title = originalTitle;
      if (createdDescription) descriptionMeta.remove();
      else descriptionMeta.content = originalDescription;
      if (createdOgDescription) ogDescriptionMeta.remove();
      else ogDescriptionMeta.content = originalOgDescription;
    };
  }, [title, description]);

  const homeHref = import.meta.env.BASE_URL || '/';
  const logoSrc = `${import.meta.env.BASE_URL}brand/acts-club-logo.png`;

  return (
    <main className="grain min-h-[100dvh] bg-cream text-ink">
      <header className="border-b border-ink/10">
        <div className="content-shell flex min-h-14 items-center justify-between gap-3 py-2 sm:min-h-20 sm:py-4">
          <a href={homeHref} className="inline-flex min-h-11 items-center" aria-label="ACTS Club home">
            <img src={logoSrc} alt="ACTS Club" className="h-[30px] w-auto sm:h-9" />
          </a>
          <a href={homeHref} className="inline-flex min-h-11 items-center rounded-full border border-ink/20 px-4 py-2 text-sm font-bold transition-colors hover:border-acts hover:text-acts focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acts">
            Back to ACTS
          </a>
        </div>
      </header>

      <div className="content-shell py-6 sm:py-9 lg:py-10">
        <article className="mx-auto max-w-3xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <div className="mb-5 border-b border-ink/15 pb-4 sm:mb-6 sm:pb-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-acts">ACTS Club · Information</p>
            <h1 className="font-display text-[1.75rem] font-extrabold leading-[1.12] tracking-tight sm:text-4xl">{title.replace(' | ACTS Club', '')}</h1>
            <p className="mt-3 text-sm font-medium text-ink/65">Last updated: October 2026</p>
          </div>
          <div className="legal-copy">{children}</div>
        </article>
      </div>

      <footer className="footer-texture bg-ink py-4 sm:py-5 text-cream">
        <div className="content-shell flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <img src={logoSrc} alt="ACTS Club" className="h-8 w-auto brightness-0 invert" />
            <p className="mt-1 text-xs text-cream/70">Artists. Creators. Talent. Skills.</p>
          </div>
          <p className="text-xs text-cream/65">ACTS Club is operated by GrowItBuddy.</p>
        </div>
      </footer>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5 scroll-mt-8 sm:mb-6">
      <h2 className="mb-2.5 font-display text-lg font-extrabold leading-snug sm:text-[1.375rem]">{title}</h2>
      <div className="space-y-3 break-words text-[0.975rem] leading-relaxed sm:space-y-4 sm:leading-7 text-ink/85">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-6 marker:text-acts">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

export function LegalPlaceholder({ children }: { children: string }) {
  return <span className="break-words font-semibold text-acts">{children}</span>;
}

export default LegalPageShell;