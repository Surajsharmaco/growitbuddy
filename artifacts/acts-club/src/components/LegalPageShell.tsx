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

  return (
    <main className="min-h-[100dvh] bg-cream text-ink">
      <header className="border-b border-ink/10">
        <div className="content-shell flex min-h-20 items-center justify-between gap-4 py-4">
          <a href={homeHref} className="font-display text-xl font-extrabold tracking-tight sm:text-2xl" aria-label="ACTS Club home">
            ACTS <span className="text-acts">CLUB</span>
          </a>
          <a href={homeHref} className="rounded-full border border-ink/20 px-4 py-2 text-sm font-bold transition-colors hover:border-acts hover:text-acts focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acts">
            Back to ACTS
          </a>
        </div>
      </header>

      <div className="content-shell py-10 sm:py-14 lg:py-20">
        <article className="mx-auto max-w-3xl">
          <div className="mb-8 border-b border-ink/15 pb-7 sm:mb-10 sm:pb-9">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-acts">ACTS Club · Information</p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">{title.replace(' | ACTS Club', '')}</h1>
            <p className="mt-5 text-sm font-medium text-ink/65">Last updated: October 2026</p>
          </div>
          <div className="legal-copy">{children}</div>
        </article>
      </div>

      <footer className="bg-ink py-8 text-cream">
        <div className="content-shell flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-xl font-extrabold">ACTS <span className="text-acts">CLUB</span></p>
            <p className="mt-1 text-sm text-cream/70">Artists. Creators. Talent. Skills.</p>
          </div>
          <p className="text-sm text-cream/65">ACTS Club is operated by GrowItBuddy.</p>
        </div>
      </footer>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8 scroll-mt-8 sm:mb-9">
      <h2 className="mb-3 font-display text-2xl font-extrabold leading-tight sm:text-[1.7rem]">{title}</h2>
      <div className="space-y-4 text-[0.975rem] leading-7 text-ink/85">{children}</div>
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