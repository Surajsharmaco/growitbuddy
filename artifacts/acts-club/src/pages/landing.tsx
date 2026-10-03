import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { MembershipDialog } from '@/components/MembershipDialog';

const img = (n: string) => `${import.meta.env.BASE_URL}img/${n}.jpg`;
const legalHref = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`reveal ${className}`}>{children}</div>;
}

function Photo({ n, alt, className = '', label }: { n: string; alt: string; className?: string; label?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl group ${className}`}>
      <img src={img(n)} alt={alt} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      {label && <span className="absolute left-3 bottom-3 rounded-full bg-cream/95 px-3 py-1 text-xs font-bold text-ink">{label}</span>}
    </div>
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
    compact: { old: 'text-[10px]', badge: 'px-1.5 py-1 text-[7px]', current: 'text-lg', term: 'text-[7px]' },
    hero: { old: 'text-xs sm:text-sm', badge: 'px-2 py-1.5 text-[8px] sm:text-[9px]', current: 'text-xl sm:text-3xl', term: 'text-[8px] sm:text-[9px]' },
    standard: { old: 'text-sm', badge: 'px-2.5 py-1.5 text-[9px]', current: 'text-3xl', term: 'text-[9px]' },
    large: { old: 'text-xs sm:text-sm', badge: 'px-2 py-1.5 text-[8px] sm:text-[10px]', current: 'text-4xl sm:text-6xl', term: 'text-[8px] sm:text-xs' },
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
  const join = () => setOpen(true);

  const JoinBtn = ({ id, label = 'JOIN ACTS', className = '' }: { id: string; label?: string; className?: string }) => (
    <button data-testid={`button-join-${id}`} onClick={join}
      className={`btn-3d btn-3d--orange px-7 py-4 font-display font-bold tracking-tight ${className}`}>
      {label} <span aria-hidden>→</span>
    </button>
  );
  const Ghost = ({ id, label, target }: { id: string; label: string; target: string }) => (
    <button data-testid={`button-${id}`} onClick={() => go(target)}
      className="btn-3d btn-3d--ink px-6 py-3.5 font-display font-bold">
      {label} <span aria-hidden>→</span>
    </button>
  );

  const nav = [['community', 'Community', 'community'], ['opportunities', 'Opportunities', 'skills'], ['events', 'Events', 'inside'], ['about', 'About', 'why']];

  const cards = [
    ['01', 'Opportunities by your skills', 'Discover opportunities based on what you actually know and can do.', 'skills'],
    ['02', 'Work with GrowItBuddy', 'Get considered for relevant projects with GrowItBuddy.', 'creator'],
    ['03', 'Trips & Retreats', 'Travel, create, connect and build relationships outside the screen.', 'trips'],
    ['04', 'Meetups & Board Games', 'Casual meetups, games and real-world community experiences.', 'games'],
    ['05', 'Networking Events', 'Meet creators, freelancers, entrepreneurs and professionals.', 'network'],
    ['06', 'Learn & Grow', 'Workshops, challenges, sessions and practical learning.', 'learn'],
  ];
  const skills = ['Video Editing', 'Design', 'Content', 'Marketing', 'Development', 'Writing', 'Photography', 'Social Media'];

  return (
    <div className="grain min-h-[100dvh] bg-background text-ink pb-24 md:pb-0">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/90 backdrop-blur" data-testid="nav-main">
        <div className="flex w-full items-center justify-between px-4 py-3 md:px-6 lg:px-8">
          <button data-testid="link-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="font-display text-2xl font-extrabold leading-none">
            ACTS<span className="block text-[9px] tracking-[0.35em] text-acts">CLUB</span>
          </button>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            {nav.map(([k, l, t]) => (
              <button key={k} data-testid={`link-nav-${k}`} onClick={() => go(t)} className="relative hover:text-acts after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-acts after:transition-all hover:after:w-full">{l}</button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button data-testid="button-login" onClick={() => setLoginOpen(true)} className="btn-3d btn-3d--cream btn-3d--compact px-4 py-2 text-sm font-bold">Login</button>
            <button data-testid="button-join-nav" onClick={join} className="btn-3d btn-3d--orange btn-3d--compact px-4 py-2.5 text-xs font-bold sm:text-sm">JOIN ACTS →</button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="w-full">
        <div className="relative overflow-hidden bg-ink">
          <img src={img('hero')} alt="A group of creators and freelancers cheering together at an ACTS community event" className="h-[560px] w-full object-cover opacity-90 md:h-[680px]" data-testid="img-hero" />
          <div className="absolute inset-0 bg-ink/35 md:hidden" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/40 to-ink/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/65 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-12">
            <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="text-offer-badge">
              <PriceOffer size="hero" tone="dark" oneTime testId="price-offer-hero" />
            </div>
            <h1 className="max-w-6xl text-[1.75rem] font-extrabold uppercase leading-[0.98] text-cream sm:text-5xl md:text-6xl lg:text-7xl" data-testid="text-hero-title">
              The exclusive community for <Em>creators &amp; freelancers.</Em>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-cream/90 md:text-lg" data-testid="text-hero-sub">Meet talented people, find real opportunities, collaborate on projects, and build a network that moves your career forward.</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <JoinBtn id="hero" />
              <button data-testid="button-explore-hero" onClick={() => go('why')} className="btn-3d btn-3d--cream px-6 py-3.5 font-display font-bold">EXPLORE COMMUNITY →</button>
            </div>
          </div>
        </div>
      </section>

      {/* marquee */}
      <div className="mt-6 overflow-hidden border-y border-ink/15 py-4 md:mt-8" aria-hidden>
        <div className="marquee flex w-max gap-10 font-display text-2xl font-bold uppercase">
          {[...Array(2)].map((_, k) => <div key={k} className="flex gap-10">{['Artists', 'Creators', 'Talent', 'Skills', 'Meetups', 'Retreats', 'Projects'].map(w => <span key={w}>{w} <Em>✦</Em></span>)}</div>)}
        </div>
      </div>

      {/* WHY */}
      <section id="why" className="content-shell py-12 md:py-16" data-testid="section-why">
        <Reveal>
          <h2 className="max-w-3xl text-5xl font-extrabold uppercase leading-[0.95] md:text-7xl">More than just <Em>a community.</Em></h2>
          <p className="mt-5 max-w-lg text-lg text-ink/70">ACTS brings together people, skills, opportunities and experiences in one place.</p>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {['People', 'Connections', 'Collaboration', 'Opportunities'].map((w, i) => (
            <Reveal key={w} delay={i * 120}>
              <div data-testid={`flow-why-${i}`} className="relative flex h-44 flex-col justify-between rounded-3xl border-2 border-ink p-6 transition-colors hover:bg-acts hover:text-cream">
                <span className="font-display text-sm font-bold text-acts">0{i + 1}</span>
                <span className="font-display text-2xl font-extrabold uppercase">{w}</span>
                {i < 3 && <span aria-hidden className="absolute -right-4 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-cream md:flex">→</span>}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* INSIDE */}
      <section id="inside" className="bg-cream py-12 md:py-16" data-testid="section-inside">
        <div className="content-shell py-12 md:py-16">
          <Reveal><h2 className="text-5xl font-extrabold uppercase md:text-7xl">What's inside <Em>ACTS?</Em></h2></Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map(([n, t, d, p], i) => (
              <Reveal key={n} delay={(i % 3) * 100}>
                <article data-testid={`card-inside-${n}`} className="group overflow-hidden rounded-3xl bg-card ring-1 ring-ink/10 transition-all hover:-translate-y-1.5 hover:shadow-xl">
                  <div className="relative h-56 overflow-hidden">
                    <img src={img(p)} alt={t} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute left-4 top-4 rounded-full bg-ink px-3 py-1 font-display text-sm font-bold text-acts">{n}</span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold">{t}</h3>
                    <p className="mt-2 text-ink/70">{d}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center"><JoinBtn id="inside" /></div>
        </div>
      </section>

      {/* SKILLS */}
      <section id="skills" className="content-shell py-12 md:py-16" data-testid="section-skills">
        <Reveal><h2 className="max-w-4xl text-5xl font-extrabold uppercase leading-[0.95] md:text-7xl">Your skills can take <Em>you further.</Em></h2></Reveal>
        <div className="mt-8 flex flex-col items-stretch gap-3 md:flex-row md:items-center">
          {['Your skill', 'ACTS community', 'Connection', 'Project', 'Opportunity'].map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-3 md:flex-col md:gap-2" data-testid={`step-skill-${i}`}>
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-xl font-bold md:h-20 md:w-20 ${i === 4 ? 'bg-acts text-cream' : 'bg-ink text-cream'}`}>{i + 1}</div>
              <span className="font-display text-lg font-bold uppercase">{s}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          {skills.map(s => <span key={s} data-testid={`chip-skill-${s.toLowerCase().replace(/\s/g, '-')}`} className="rounded-full border-2 border-ink px-5 py-2.5 font-display font-bold transition-colors hover:border-acts hover:bg-acts hover:text-cream">{s}</span>)}
        </div>
        <p className="mt-7 max-w-2xl text-2xl font-medium">Your skills shouldn't just sit in a portfolio. ACTS helps put them in the <Em>right rooms.</Em></p>
        <div className="mt-6"><Ghost id="explore-opportunities" label="EXPLORE OPPORTUNITIES" target="growit" /></div>
      </section>

      {/* GROWITBUDDY */}
      <section id="growit" className="content-shell" data-testid="section-growitbuddy">
        <div className="grid overflow-hidden rounded-[2rem] bg-acts text-cream md:grid-cols-2">
          <div className="p-6 sm:p-8 lg:p-10">
            <h2 className="text-5xl font-extrabold uppercase leading-[0.95] md:text-6xl">Work with GrowItBuddy.</h2>
            <p className="mt-5 text-lg text-cream/90">ACTS members can be considered for relevant creative opportunities with GrowItBuddy, a content and distribution studio that has generated 700M+ views. Selection is based on skills and requirements.</p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['Skill', 'Match', 'Project', 'Experience'].map((s, i) => (
                <div key={s} data-testid={`step-growit-${i}`} className="rounded-2xl bg-ink/90 px-3 py-4 text-center font-display text-sm font-bold uppercase text-cream">{s}</div>
              ))}
            </div>
            <button data-testid="button-see-how" onClick={() => go('join')} className="btn-3d btn-3d--cream mt-8 px-6 py-3.5 font-display font-bold">SEE HOW IT WORKS →</button>
          </div>
          <img src={img('creator')} alt="A videographer filming in a studio" loading="lazy" className="h-72 w-full object-cover md:h-full" />
        </div>
      </section>

      {/* LIFE */}
      <section id="community" className="content-shell py-12 md:py-16" data-testid="section-life">
        <Reveal>
          <h2 className="text-5xl font-extrabold uppercase leading-[0.95] md:text-7xl">Real people.<br /><Em>Real connections.</Em></h2>
          <p className="mt-4 text-xl italic text-ink/70">Some connections are better made offline.</p>
        </Reveal>
        <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
          <Photo n="hero" alt="Community meetup" label="Community Meetups" className="col-span-2 row-span-2 h-72 md:h-[480px]" />
          <Photo n="games" alt="Board games" label="Board Games" className="h-36 md:h-auto" />
          <Photo n="network" alt="Networking" label="Networking" className="h-36 md:h-auto" />
          <Photo n="trips" alt="Trips" label="Trips & Retreats" className="h-36 md:h-auto" />
          <Photo n="learn" alt="Workshops" label="Workshops" className="h-36 md:h-auto" />
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="bg-cream" data-testid="section-audience">
        <div className="content-shell py-12 md:py-16">
          <Reveal><h2 className="text-5xl font-extrabold uppercase md:text-7xl">Built for people <Em>who create.</Em></h2></Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[['Creators', 'For people creating content, videos, designs, stories and ideas.', 'creator'], ['Freelancers', 'For people turning their skills into professional work.', 'skills']].map(([t, d, p]) => (
              <Reveal key={t}>
                <div data-testid={`card-audience-${t.toLowerCase()}`} className="group relative h-96 overflow-hidden rounded-3xl">
                  <img src={img(p)} alt={t} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 to-transparent" />
                  <div className="absolute bottom-0 p-8 text-cream"><h3 className="text-5xl font-extrabold uppercase">{t}</h3><p className="mt-2 max-w-sm text-cream/85">{d}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BUSINESS */}
      <section id="about" className="content-shell py-10 md:py-12" data-testid="section-business">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[2rem] border-2 border-dashed border-ink/40 p-6 md:flex-row md:items-center md:p-8">
          <div>
            <p className="text-xs font-bold tracking-widest text-acts">FOR BRANDS &amp; AGENCIES</p>
            <h2 className="mt-2 text-4xl font-extrabold uppercase md:text-5xl">Looking for talent?</h2>
            <p className="mt-3 max-w-md text-ink/70">Find skilled creators and freelancers for your next project through the ACTS network.</p>
          </div>
          <a data-testid="button-find-talent" href="mailto:hello@actsclub.in?subject=Looking%20for%20talent" className="btn-3d btn-3d--ink px-7 py-4 font-display font-bold">FIND TALENT →</a>
        </div>
      </section>

      {/* PROOF */}
      <section className="content-shell pb-12 md:pb-14" data-testid="section-proof">
        <h2 className="text-3xl font-extrabold uppercase md:text-4xl">Proof is in the <Em>rooms.</Em></h2>
        <p className="mt-2 max-w-xl text-ink/70">We'll share member stories once members say them. Until then, here's what the community actually does.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {['Meetups and board game nights', 'Skill workshops and challenges', 'Trips, retreats and project collaborations'].map((t, i) => (
            <div key={t} data-testid={`text-proof-${i}`} className="rounded-2xl bg-card p-5 font-display text-lg font-bold ring-1 ring-ink/10"><span className="text-acts">0{i + 1}</span> {t}</div>
          ))}
        </div>
      </section>

      {/* JOIN */}
      <section id="join" className="content-shell" data-testid="section-join">
        <div className="grid items-center gap-5 rounded-[2rem] bg-ink p-6 text-cream sm:p-8 md:grid-cols-2 md:gap-8">
          <div>
            <h2 className="text-5xl font-extrabold uppercase leading-[0.95] md:text-6xl">Join the founding <Em>community.</Em></h2>
            <p className="mt-5 text-cream/80">Join ACTS at its one-time founding offer and become part of the community from the beginning.</p>
          </div>
          <div className="rounded-3xl bg-cream p-6 text-ink sm:p-8">
            <p className="text-xs font-bold tracking-widest text-acts">FOUNDING ACCESS</p>
            <PriceOffer size="large" oneTime className="my-5" testId="text-price" />
            <JoinBtn id="offer" className="w-full" />
          </div>
        </div>
      </section>

      {/* FINAL */}
      <section className="content-shell py-12 text-center md:py-16" data-testid="section-final">
        <Reveal>
          <h2 className="mx-auto max-w-6xl text-4xl font-extrabold uppercase leading-[0.98] md:text-7xl">Your next opportunity could start with <Em>one connection.</Em></h2>
          <p className="mt-6 text-lg text-ink/70">Join the exclusive community for creators and freelancers.</p>
          <p className="mt-6 text-xs font-bold tracking-widest text-acts">FOUNDING ACCESS</p>
          <PriceOffer size="large" oneTime className="mx-auto my-5 justify-center" testId="text-price-final" />
          <p className="mb-8 text-ink/70">One-time launch access.</p>
          <JoinBtn id="final" />
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="bg-ink py-10 text-cream md:py-12" data-testid="footer-main">
        <div className="content-shell">
          <div className="flex w-full flex-col gap-6 md:flex-row md:justify-between">
            <div>
              <p className="font-display text-4xl font-extrabold">ACTS <Em>CLUB</Em></p>
              <p className="mt-2 text-cream/70">Artists. Creators. Talent. Skills.</p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 font-medium">
              {[['Community', 'community'], ['Opportunities', 'skills'], ['Events', 'inside'], ['About', 'about']].map(([l, t]) => <button key={l} data-testid={`link-footer-${l.toLowerCase()}`} onClick={() => go(t)} className="hover:text-acts">{l}</button>)}
              <a data-testid="link-footer-contact" href="mailto:hello@actsclub.in" className="hover:text-acts">Contact</a>
            </div>
            <div className="flex gap-5 text-sm">
              {['Instagram', 'LinkedIn', 'YouTube'].map(s => <button key={s} data-testid={`link-social-${s.toLowerCase()}`} onClick={() => setLoginOpen(true)} className="hover:text-acts">{s}</button>)}
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-cream/15 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-cream/50" data-testid="text-powered">Powered by GrowItBuddy</p>
            <nav aria-label="Legal information" className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-xs">
              <a data-testid="link-footer-privacy-policy" href={legalHref('privacy-policy')} className="text-cream/75 underline-offset-2 hover:text-cream hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream">Privacy Policy</a>
              <a data-testid="link-footer-terms-and-conditions" href={legalHref('terms-and-conditions')} className="text-cream/75 underline-offset-2 hover:text-cream hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream">Terms &amp; Conditions</a>
              <a data-testid="link-footer-community-guidelines" href={legalHref('community-guidelines')} className="text-cream/75 underline-offset-2 hover:text-cream hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream">Community Guidelines</a>
            </nav>
          </div>
          <p className="mt-2 text-right text-[11px] text-cream/50">ACTS Club is operated by GrowItBuddy.</p>
        </div>
      </footer>

      {/* sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-cream/95 p-3 backdrop-blur md:hidden" data-testid="bar-mobile-cta">
        <div className="flex w-full items-center justify-between gap-2">
          <PriceOffer size="compact" oneTime className="min-w-0 flex-1 flex-wrap gap-x-1 gap-y-0.5" testId="price-offer-mobile" />
          <button data-testid="button-join-mobile" onClick={join} className="btn-3d btn-3d--orange btn-3d--compact shrink-0 px-4 py-3.5 font-display text-sm font-bold">JOIN ACTS →</button>
        </div>
      </div>

      {/* dialogs */}
      <MembershipDialog open={open} onOpenChange={setOpen} />
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="rounded-3xl border-0 bg-cream" data-testid="dialog-login">
          <DialogTitle className="font-display text-3xl font-extrabold uppercase">Member login is coming soon</DialogTitle>
          <DialogDescription>Members' spaces open after launch. Join now as a founding member to be part of ACTS from the start.</DialogDescription>
          <button data-testid="button-login-join" onClick={() => { setLoginOpen(false); join(); }} className="btn-3d btn-3d--orange w-full py-4 font-display font-bold">JOIN ACTS →</button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
