import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Instagram, Linkedin } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { MembershipDialog } from '@/components/MembershipDialog';
import { SkillPills } from '@/components/SkillPills';
import { HeroTicker } from '@/components/HeroTicker';
import { ACTS_CONTACT } from '@/lib/contact';

const img = (n: string) => `${import.meta.env.BASE_URL}img/${n}.jpg`;
const brandAsset = (n: string) => `${import.meta.env.BASE_URL}brand/${n}`;
const legalHref = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const go = (id: string) => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
};

function Reveal({ children, className = '', delay = 0, from = 'up' }: { children: ReactNode; className?: string; delay?: number; from?: 'up' | 'left' | 'right' | 'scale' }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calm || !('IntersectionObserver' in window)) { el.classList.add('in'); return; }
    // Keep content visible by default; only animate when it actually enters.
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); } }, { threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} style={{ animationDelay: `${delay}ms` }} className={`reveal reveal-${from} ${className}`}>{children}</div>;
}

function SkillsFlow({ steps }: { steps: string[] }) {
  const ref = useRef<HTMLOListElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { el.classList.add('in'); return; }
    const io = new IntersectionObserver(([e]) => { el.classList.toggle('in', e.isIntersecting); }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <ol ref={ref} className="skills-flow mx-auto mt-5 grid w-full max-w-sm list-none grid-cols-1 rounded-2xl border border-ink/10 bg-white/40 p-4 md:mt-7 md:max-w-[1100px] md:grid-cols-5 md:rounded-none md:border-0 md:bg-transparent md:p-0">
      {steps.map((s, i) => (
        <li key={s} data-testid={`step-skill-${i}`} style={{ ['--i' as string]: i }} className="flow-step relative flex items-center gap-3 pb-3 last:pb-0 md:flex-col md:items-center md:gap-3 md:pb-0">
          <div className="flow-node relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-cream md:h-14 md:w-14 md:text-xl">{i + 1}</div>
          <span className="font-display text-sm font-bold uppercase leading-tight md:min-h-[2.5rem] md:px-2 md:text-center md:text-base">{s}</span>
          {i < steps.length - 1 && <span aria-hidden className="flow-line" />}
        </li>
      ))}
    </ol>
  );
}

function WhyFlow() {
  const ref = useRef<HTMLOListElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(([entry]) => el.classList.toggle('in', entry.isIntersecting), { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <ol ref={ref} className="why-flow mt-5 grid list-none grid-cols-1 gap-3 p-0 md:mt-8 md:grid-cols-4 md:gap-4">
      {['People', 'Connections', 'Collaboration', 'Opportunities'].map((word, i) => (
        <li key={word} className="why-step relative min-w-0" style={{ ['--i' as string]: i }}>
          <div data-testid={`flow-why-${i}`} className="why-card relative z-10 flex min-h-16 min-w-0 items-center gap-4 rounded-2xl border border-ink/20 bg-card px-4 py-3 md:min-h-28 md:flex-col md:items-start md:justify-between md:gap-3 md:rounded-3xl md:p-5">
            <span className="why-number inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink font-display text-xs font-bold text-cream md:h-9 md:w-9">0{i + 1}</span>
            <span className="font-display text-base font-extrabold uppercase leading-tight md:text-lg xl:text-xl">{word}</span>
          </div>
          {i < 3 && <span aria-hidden className="why-connector" />}
        </li>
      ))}
    </ol>
  );
}

function Photo({ n, alt, className = '', label, delay = 0 }: { n: string; alt: string; className?: string; label?: string; delay?: number }) {
  return (
    <Reveal className={className} delay={delay}>
    <div className="relative h-full w-full overflow-hidden rounded-3xl group">
      <img src={img(n)} alt={alt} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      {label && <span className="absolute left-3 bottom-3 rounded-full bg-cream/95 px-3 py-1 text-xs font-bold text-ink">{label}</span>}
    </div>
    </Reveal>
  );
}

const Em = ({ children }: { children: ReactNode }) => <span className="text-acts">{children}</span>;

function PriceOffer({
  size = 'standard',
  tone = 'light',
  oneTime = false,
  className = '',
  testId = 'price-offer',
}: {
  size?: 'compact' | 'hero' | 'standard' | 'large';
  tone?: 'light' | 'dark';
  oneTime?: boolean;
  className?: string;
  testId?: string;
}) {
  const sizes = {
    compact: { old: 'text-xs', badge: 'px-2 py-1 text-[10px]', current: 'text-2xl', term: 'text-[10px]' },
    hero: { old: 'text-xs sm:text-sm lg:text-base', badge: 'px-2 py-1.5 text-[10px] lg:px-3 lg:py-2 lg:text-xs', current: 'text-2xl sm:text-3xl lg:text-[2.75rem]', term: 'text-[10px] lg:text-xs' },
    standard: { old: 'text-sm', badge: 'px-2.5 py-1.5 text-[10px]', current: 'text-3xl', term: 'text-[10px]' },
    large: { old: 'text-xs sm:text-sm', badge: 'px-2 py-1.5 text-[10px]', current: 'text-4xl sm:text-6xl', term: 'text-[10px] sm:text-xs' },
  }[size];
  const onDark = tone === 'dark';

  return (
    <div
      role="group"
      aria-label="Regular price ₹799; limited-time offer ₹99"
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${className}`}
    >
      <s className={`font-display font-bold ${sizes.old} ${onDark ? 'text-cream/65' : 'text-ink/45'}`}>₹799</s>
      <span className={`rounded-full bg-acts font-bold tracking-wide text-cream ${sizes.badge}`}>FOR LIMITED TIME</span>
      <span className={`font-display font-extrabold leading-none ${sizes.current} ${onDark ? 'text-cream' : 'text-ink'}`}>₹99</span>
      {oneTime && <span className={`font-bold tracking-widest ${sizes.term} ${onDark ? 'text-cream/75' : 'text-ink/65'}`}>ONE-TIME</span>}
    </div>
  );
}

export default function Landing() {
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [heroPassed, setHeroPassed] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([entry]) => setHeroPassed(!entry.isIntersecting), { rootMargin: '-60px 0px 0px 0px' });
    io.observe(hero);
    return () => io.disconnect();
  }, []);
  const closeMenu = (restore = true) => { setMenu(false); if (restore) menuBtn.current?.focus(); };
  useEffect(() => {
    if (!menu) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [menu]);
  const join = () => { setMenu(false); setOpen(true); };

  const JoinBtn = ({ id, label = 'JOIN ACTS', className = '' }: { id: string; label?: string; className?: string }) => (
    <button data-testid={`button-join-${id}`} onClick={join}
      className={`btn-3d btn-3d--orange min-h-11 px-4 py-2.5 text-sm font-display font-bold tracking-tight sm:px-5 sm:py-3 ${className}`}>
      {label} <span aria-hidden>→</span>
    </button>
  );
  const Ghost = ({ id, label, target }: { id: string; label: string; target: string }) => (
    <button data-testid={`button-${id}`} onClick={() => go(target)}
      className="btn-3d btn-3d--ink min-h-11 px-5 py-3 text-sm font-display font-bold sm:px-6 sm:py-3.5 sm:text-base">
      {label} <span aria-hidden>→</span>
    </button>
  );

  const nav = [['community', 'Community', 'community'], ['opportunities', 'Opportunities', 'skills'], ['events', 'Events', 'inside'], ['how-it-works', 'How it works', 'why']];

  const cards = [
    ['01', 'Opportunities by your skills', 'Discover opportunities based on what you actually know and can do.', 'skills'],
    ['02', 'Work with GrowItBuddy', 'Get considered for relevant projects with GrowItBuddy.', 'creator'],
    ['03', 'Trips & Retreats', 'Travel, create, connect and build relationships outside the screen.', 'trips'],
    ['04', 'Meetups & Board Games', 'Casual meetups, games and real-world community experiences.', 'games'],
    ['05', 'Networking Events', 'Meet freelancers, creators, entrepreneurs and professionals.', 'network'],
    ['06', 'Learn & Grow', 'Workshops, challenges, sessions and practical learning.', 'learn'],
  ];

  return (
    <div className="grain min-h-[100dvh] bg-background text-ink pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/90 backdrop-blur" data-testid="nav-main">
        <div className="flex w-full items-center justify-between px-3 py-2 sm:px-4 md:px-6 md:py-3 lg:px-8">
          <button data-testid="link-logo" onClick={() => { closeMenu(false); go('top'); }} className="flex min-h-11 items-center justify-center" aria-label="ACTS Club home">
            <img src={brandAsset('acts-club-logo.png')} alt="ACTS Club" className="h-[30px] w-auto sm:h-9" />
          </button>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            {nav.map(([k, l, t]) => (
              <button key={k} data-testid={`link-nav-${k}`} onClick={() => go(t)} className="relative hover:text-acts after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-acts after:transition-all hover:after:w-full">{l}</button>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <button data-testid="button-login" onClick={() => { setMenu(false); setLoginOpen(true); }} className="btn-3d btn-3d--cream btn-3d--compact min-h-11 px-3.5 py-2 text-sm font-bold sm:px-4">Login</button>
            <button data-testid="button-join-nav" onClick={join} className="btn-3d btn-3d--orange btn-3d--compact hidden min-h-11 px-4 py-2.5 text-xs font-bold min-[400px]:inline-flex sm:text-sm">JOIN ACTS →</button>
            <button ref={menuBtn} data-testid="button-menu" type="button" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} aria-controls="mobile-menu" onClick={() => setMenu(m => !m)} className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 md:hidden">
              <span aria-hidden className="relative block h-3.5 w-5">
                <span className={`absolute left-0 h-0.5 w-5 bg-ink transition-transform ${menu ? 'top-1.5 rotate-45' : 'top-0'}`} />
                <span className={`absolute left-0 top-1.5 h-0.5 w-5 bg-ink transition-opacity ${menu ? 'opacity-0' : ''}`} />
                <span className={`absolute left-0 h-0.5 w-5 bg-ink transition-transform ${menu ? 'top-1.5 -rotate-45' : 'top-3'}`} />
              </span>
            </button>
          </div>
        </div>
        {menu && (
          <nav id="mobile-menu" aria-label="Mobile" data-testid="nav-mobile" className="border-t border-ink/10 bg-cream px-3 pb-3 pt-1 md:hidden">
            {nav.map(([k, l, t]) => (
              <button key={k} data-testid={`link-mobile-${k}`} onClick={() => { closeMenu(); setTimeout(() => go(t), 50); }} className="flex min-h-11 w-full items-center justify-between border-b border-ink/10 py-2 text-left font-display text-base font-bold">{l}<span aria-hidden className="text-acts">→</span></button>
            ))}
          </nav>
        )}
      </header>

      {/* HERO */}
      <section id="top" ref={heroRef} className="w-full">
        <div className="hero-stage relative isolate flex overflow-hidden bg-ink text-center">
          <img src={img('hero-original-younger')} alt="An illustrative crowded gathering of young Indian creators laughing together" className="hero-img absolute inset-0 h-full w-full object-cover" data-testid="img-hero" />
          <div aria-hidden="true" className="hero-shade absolute inset-0" />
          <div className="hero-content relative z-10">
            <h1 style={{ ["--d" as string]: "60ms" }} className="rise hero-title text-cream" data-testid="text-hero-title">
              <span className="hero-intro">The exclusive{' '}<br className="hero-line-break" />community for</span>{' '}
              <span className="hero-audiences">freelancers and{' '}<br className="hero-line-break" />creators</span>
            </h1>
            <div className="hero-people" data-testid="hero-people">
              <div className="hero-faces" aria-hidden="true">
                {[1, 2, 3, 4].map(n => <img key={n} src={img(`hero-original-younger-face-${n}`)} alt="" width={44} height={44} />)}
              </div>
              <p className="hero-people-label">Real people<br />Real opportunities</p>
            </div>
            <p style={{ ["--d" as string]: "140ms" }} className="rise hero-description" data-testid="text-hero-sub">Meet talented people, find real opportunities, collaborate on projects, and build a network that moves your career forward.</p>
            <div style={{ ["--d" as string]: "220ms" }} className="rise hero-offer" data-testid="text-offer-badge">
              <PriceOffer size="hero" tone="dark" oneTime className="max-w-full flex-wrap justify-center gap-y-1" testId="price-offer-hero" />
            </div>
            <div style={{ ["--d" as string]: "280ms" }} className="rise hero-actions flex items-center justify-center">
              <JoinBtn id="hero" />
              <button data-testid="button-explore-hero" onClick={() => go('why')} className="btn-3d hero-explore min-h-11 px-4 py-2.5 text-sm font-display font-bold sm:px-5 sm:py-3">EXPLORE COMMUNITY →</button>
            </div>
          </div>
        </div>
      </section>

      <HeroTicker />

      {/* WHY */}
      <section id="why" className="content-shell relative isolate py-6 md:py-9" data-testid="section-why">
        <span aria-hidden className="accent-blob" />
        <Reveal>
          <h2 className="h-sec max-w-3xl font-extrabold uppercase leading-[0.98]">More than just <Em>a community.</Em></h2>
          <p className="mt-3 max-w-lg text-base text-ink/70 md:mt-4 md:text-base">ACTS brings together people, skills, opportunities and experiences in one place.</p>
        </Reveal>
        <WhyFlow />
      </section>

      {/* INSIDE */}
      <section id="inside" className="bg-cream" data-testid="section-inside">
        <div className="content-shell pb-5 pt-7 md:pb-7 md:pt-9">
          <Reveal><h2 className="h-sec font-extrabold uppercase leading-[0.98]">What's inside <Em>ACTS?</Em></h2></Reveal>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 md:mt-8 md:gap-4 lg:grid-cols-3">
            {cards.map(([n, t, d, p], i) => (
              <Reveal key={n} delay={(i % 3) * 120 + Math.floor(i / 3) * 60}>
                <article data-testid={`card-inside-${n}`} className="group overflow-hidden rounded-3xl bg-card ring-1 ring-ink/10 transition-all hover:-translate-y-1.5 hover:shadow-xl">
                  <div className="relative h-36 overflow-hidden sm:h-40 md:h-44">
                    <img src={img(p)} alt={t} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute left-4 top-4 rounded-full bg-ink px-3 py-1 font-display text-sm font-bold text-acts">{n}</span>
                  </div>
                  <div className="p-4 md:p-5">
                    <h3 className="text-lg font-bold md:text-xl">{t}</h3>
                    <p className="mt-1 text-sm text-ink/70 md:text-[0.95rem]">{d}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="mt-6 text-center md:mt-8"><JoinBtn id="inside" /></div>
        </div>
      </section>

      {/* SKILLS */}
      <section id="skills" className="content-shell pb-6 pt-1 text-center md:pb-9 md:pt-2" data-testid="section-skills">
        <Reveal><h2 className="h-sec skills-heading mx-auto max-w-4xl font-extrabold uppercase leading-[0.98]">Your skills can take <span className="skills-title-accent text-acts">you further.</span></h2></Reveal>
        <SkillsFlow steps={['Your skill', 'ACTS community', 'Connection', 'Project', 'Opportunity']} />
        <SkillPills />
        <p className="mx-auto mt-5 max-w-2xl text-base font-medium md:mt-6 md:text-xl">Your skills shouldn't just sit in a portfolio. ACTS helps put them in the <Em>right rooms.</Em></p>
        <div className="mt-4 md:mt-6"><Ghost id="explore-opportunities" label="EXPLORE OPPORTUNITIES" target="growit" /></div>
      </section>

      {/* GROWITBUDDY */}
      <section id="growit" className="content-shell" data-testid="section-growitbuddy">
        <Reveal><div className="grid overflow-hidden rounded-3xl bg-acts text-cream md:grid-cols-2 md:rounded-[2rem]">
          <div className="min-w-0 p-5 sm:p-8 lg:p-10">
            <h2 className="h-card font-extrabold uppercase">Work with GrowItBuddy.</h2>
            <p className="mt-3 text-base text-cream/90 md:mt-4 md:text-base">ACTS members can be considered for relevant creative opportunities with GrowItBuddy, a content and distribution studio that has generated 700M+ views. Selection is based on skills and requirements.</p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 md:mt-8 md:grid-cols-2 md:gap-3 xl:grid-cols-4">
              {['Skill', 'Match', 'Project', 'Experience'].map((s, i) => (
                <div key={s} data-testid={`step-growit-${i}`} className="rounded-2xl bg-ink/90 px-3 py-3 text-center font-display text-sm font-bold uppercase text-cream">{s}</div>
              ))}
            </div>
            <button data-testid="button-see-how" onClick={() => go('join')} className="btn-3d btn-3d--cream mt-5 min-h-11 px-5 py-3 text-sm font-display font-bold sm:px-6 md:mt-8 md:text-base">SEE HOW IT WORKS →</button>
          </div>
          <div className="relative h-48 min-h-0 sm:h-64 md:h-auto">
            <img src={img('creator')} alt="A videographer filming in a studio" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </div></Reveal>
      </section>

      {/* LIFE */}
      <section id="community" className="content-shell py-6 md:py-9" data-testid="section-life">
        <Reveal>
          <h2 className="h-sec font-extrabold uppercase leading-[0.98]">Real people.<br /><Em>Real connections.</Em></h2>
          <p className="mt-3 text-lg italic md:mt-4 md:text-xl text-ink/70">Some connections are better made offline.</p>
        </Reveal>
        <div className="mt-5 grid grid-cols-2 gap-2 md:mt-7 md:grid-cols-4 md:gap-3 md:grid-rows-2">
          <Photo n="hero" alt="Community meetup" label="Community Meetups" className="col-span-2 row-span-2 h-48 sm:h-64 md:h-[400px]" />
          <Photo n="games" alt="Board games" label="Board Games" className="h-28 sm:h-32 md:h-auto" delay={70} />
          <Photo n="network" alt="Networking" label="Networking" className="h-28 sm:h-32 md:h-auto" delay={140} />
          <Photo n="trips" alt="Trips" label="Trips & Retreats" className="h-28 sm:h-32 md:h-auto" delay={210} />
          <Photo n="learn" alt="Workshops" label="Workshops" className="h-28 sm:h-32 md:h-auto" delay={280} />
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="bg-cream" data-testid="section-audience">
        <div className="content-shell py-6 md:py-9">
          <Reveal><h2 className="h-sec font-extrabold uppercase leading-[0.98]">Built for people <Em>who create.</Em></h2></Reveal>
          <div className="mt-5 grid gap-3 md:mt-8 md:grid-cols-2 md:gap-4">
            {[['Freelancers', 'For people turning their skills into professional work.', 'skills'], ['Creators', 'For people creating content, videos, designs, stories and ideas.', 'creator']].map(([t, d, p]) => (
              <Reveal key={t}>
                <div data-testid={`card-audience-${t.toLowerCase()}`} className="group relative h-56 overflow-hidden sm:h-72 md:h-72 rounded-3xl">
                  <img src={img(p)} alt={t} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 to-transparent" />
                  <div className="absolute bottom-0 p-5 text-cream md:p-8"><h3 className="text-2xl font-extrabold uppercase md:text-3xl">{t}</h3><p className="mt-2 max-w-sm text-cream/85">{d}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BUSINESS */}
      <section id="about" className="content-shell py-6 md:py-9" data-testid="section-business">
        <Reveal>
        <div className="flex flex-col items-start justify-between gap-5 rounded-3xl border-2 border-dashed border-ink/40 p-5 md:flex-row md:rounded-[2rem] md:items-center md:p-8">
          <div>
            <p className="text-xs font-bold tracking-widest text-acts">FOR BRANDS &amp; AGENCIES</p>
            <h2 className="h-sec mt-2 font-extrabold uppercase">Looking for talent?</h2>
             <p className="mt-3 max-w-md text-ink/70">Find skilled freelancers and creators for your next project through the ACTS network.</p>
          </div>
          <a data-testid="button-find-talent" href={`mailto:${ACTS_CONTACT.email}?subject=Looking%20for%20talent`} className="btn-3d btn-3d--ink min-h-11 px-5 py-3 text-sm font-display font-bold sm:px-7 sm:py-4 sm:text-base">FIND TALENT →</a>
        </div>
        </Reveal>
      </section>

      {/* PROOF */}
      <section className="content-shell pb-6 md:pb-9" data-testid="section-proof">
        <Reveal>
        <h2 className="h-sec font-extrabold uppercase">Proof is in the <Em>rooms.</Em></h2>
        <p className="mt-2 max-w-xl text-ink/70">We'll share member stories once members say them. Until then, here's what the community actually does.</p>
        </Reveal>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {['Meetups and board game nights', 'Skill workshops and challenges', 'Trips, retreats and project collaborations'].map((t, i) => (
            <Reveal key={t} delay={i * 100}><div data-testid={`text-proof-${i}`} className="rounded-2xl bg-card p-4 font-display text-base md:p-5 md:text-lg font-bold ring-1 ring-ink/10"><span className="text-acts">0{i + 1}</span> {t}</div></Reveal>
          ))}
        </div>
      </section>

      {/* JOIN */}
      <section id="join" className="content-shell" data-testid="section-join">
        <Reveal>
        <div className="grid items-center gap-4 rounded-3xl bg-ink p-5 text-cream md:rounded-[2rem] sm:p-8 md:grid-cols-2 md:gap-8">
          <div>
            <h2 className="h-card font-extrabold uppercase leading-[0.98]">Join the founding <Em>community.</Em></h2>
            <p className="mt-3 text-cream/80 md:mt-5">Join ACTS at its one-time founding offer and become part of the community from the beginning.</p>
          </div>
          <div className="rounded-2xl bg-cream p-4 text-ink sm:p-8 md:rounded-3xl">
            <p className="text-xs font-bold tracking-widest text-acts">FOUNDING ACCESS</p>
            <PriceOffer size="large" oneTime className="my-4 max-w-full flex-wrap gap-y-1 md:my-5" testId="text-price" />
            <JoinBtn id="offer" className="w-full" />
          </div>
        </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="footer-texture mt-6 bg-ink py-5 text-cream md:mt-9 md:py-6" data-testid="footer-main">
        <div className="content-shell">
          <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
            <div>
              <img src={brandAsset('acts-club-logo.png')} alt="ACTS Club" className="h-8 w-auto brightness-0 invert md:h-9" />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0 text-xs font-medium sm:text-sm md:gap-x-5">
              {[['Community', 'community'], ['Opportunities', 'skills'], ['Events', 'inside'], ['About', 'about']].map(([l, t]) => <button key={l} data-testid={`link-footer-${l.toLowerCase()}`} onClick={() => go(t)} className="inline-flex min-h-9 items-center hover:text-acts">{l}</button>)}
              <a data-testid="link-footer-contact" href={`mailto:${ACTS_CONTACT.email}`} className="inline-flex min-h-9 items-center hover:text-acts">{ACTS_CONTACT.email}</a>
              <a data-testid="link-footer-phone" href={ACTS_CONTACT.phoneHref} className="inline-flex min-h-9 items-center hover:text-acts">{ACTS_CONTACT.phone}</a>
            </div>
            <div className="flex items-center gap-3" aria-label="Social platforms">
              <span data-testid="link-social-instagram" role="img" aria-label="Instagram" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cream/25 text-cream/80"><Instagram size={17} aria-hidden="true" /></span>
              <span data-testid="link-social-linkedin" role="img" aria-label="LinkedIn" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cream/25 text-cream/80"><Linkedin size={17} aria-hidden="true" /></span>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1.5 border-t border-cream/15 pt-2.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-cream/50" data-testid="text-powered">Powered by GrowItBuddy</p>
            <nav aria-label="Legal information" className="acts-legal-links flex flex-wrap gap-x-3 text-[11px] sm:justify-end">
              <a data-testid="link-footer-privacy-policy" href={legalHref('privacy-policy')} className="text-cream/75 underline-offset-2 hover:text-cream hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream">Privacy Policy</a>
              <a data-testid="link-footer-terms-and-conditions" href={legalHref('terms-and-conditions')} className="text-cream/75 underline-offset-2 hover:text-cream hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream">Terms &amp; Conditions</a>
              <a data-testid="link-footer-community-guidelines" href={legalHref('community-guidelines')} className="text-cream/75 underline-offset-2 hover:text-cream hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream">Community Guidelines</a>
            </nav>
          </div>
          <p className="mt-1 text-[11px] sm:text-right text-cream/50">ACTS Club is operated by GrowItBuddy.</p>
        </div>
      </footer>

      {/* sticky mobile CTA */}
      {heroPassed && <div className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-cream/95 px-3 pt-2 backdrop-blur md:hidden" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }} data-testid="bar-mobile-cta">
        <div className="flex w-full items-center justify-between gap-2">
          <PriceOffer size="compact" oneTime className="min-w-0 flex-1 flex-wrap gap-x-1 gap-y-0.5" testId="price-offer-mobile" />
          <button data-testid="button-join-mobile" onClick={join} className="btn-3d btn-3d--orange btn-3d--compact min-h-11 shrink-0 px-4 py-2.5 font-display text-sm font-bold">JOIN ACTS →</button>
        </div>
      </div>}

      {/* dialogs */}
      <MembershipDialog open={open} onOpenChange={setOpen} />
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] overflow-y-auto rounded-3xl border-0 bg-cream p-5" data-testid="dialog-login">
          <DialogTitle className="font-display text-2xl font-extrabold uppercase sm:text-3xl">Member login is coming soon</DialogTitle>
          <DialogDescription>Members' spaces open after launch. Join now as a founding member to be part of ACTS from the start.</DialogDescription>
          <button data-testid="button-login-join" onClick={() => { setLoginOpen(false); join(); }} className="btn-3d btn-3d--orange w-full py-4 font-display font-bold">JOIN ACTS →</button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
