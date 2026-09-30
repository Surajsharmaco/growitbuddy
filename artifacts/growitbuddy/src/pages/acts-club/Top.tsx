import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Menu, X, Play, Sparkles, Plane, Dices, Users, BookOpen } from "lucide-react";
import { AUDIENCES, ECOSYSTEM, IMG, NAV, STATS } from "./content";

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`a-rv ${on ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

export function Logo() {
  return (
    <a href="#home" className="a-logo" data-testid="link-acts-logo" aria-label="ACTS Club home">
      ACTS<small>CLUB</small>
    </a>
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="a-nav">
      <div className="a-wrap">
        <div className="a-nav-in">
          <Logo />
          <nav className="a-links" aria-label="ACTS Club">
            {NAV.map((n, i) => (
              <a key={n.label} href={n.href} className={i === 0 ? "on" : ""} data-testid={`link-nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}>{n.label}</a>
            ))}
          </nav>
          <div className="a-nav-r">
            <a href="#join" className="a-login" data-testid="link-login">Log in</a>
            <a href="#join" className="a-btn a-btn-primary a-btn-sm" data-testid="button-join-nav">Join ACTS Club <ArrowRight size={16} /></a>
            <button className="a-burger" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)} data-testid="button-menu">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>
      <nav className={`a-mobile ${open ? "open" : ""}`} aria-label="ACTS Club mobile">
        {NAV.map((n) => (
          <a key={n.label} href={n.href} onClick={() => setOpen(false)} data-testid={`link-mobile-${n.label.toLowerCase().replace(/\s+/g, "-")}`}>{n.label}</a>
        ))}
        <a href="#join" onClick={() => setOpen(false)} data-testid="link-mobile-join">Join ACTS Club</a>
      </nav>
    </header>
  );
}

export function Hero() {
  return (
    <section id="home" className="a-hero" aria-labelledby="acts-h1">
      <div className="a-hero-card">
        <img src={IMG.hero} alt="A large group of Indian creators and freelancers smiling together at a community event" fetchPriority="high" />
        <div className="a-hero-tags" aria-hidden="true"><span>People</span><span>Ideas</span><span>Projects</span><span>Opportunities</span><i /></div>
        <div className="a-wrap a-hero-in">
          <h1 id="acts-h1" data-testid="text-hero-title">The Exclusive Community for <em>Creators &amp; Freelancers.</em></h1>
          <p className="a-hero-sub" data-testid="text-hero-sub">Meet talented people, find real opportunities, collaborate on projects, and build a network that moves your career forward.</p>
          <div className="a-hero-cta">
            <a href="#join" className="a-btn a-btn-primary" data-testid="button-join-hero">Join ACTS Club <ArrowRight size={18} /></a>
            <a href="#story" className="a-btn a-btn-ghost" data-testid="button-watch-video">Watch Video <Play size={16} /></a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Proof() {
  return (
    <section className="a-proof" id="community" aria-label="Community snapshot">
      <div className="a-wrap">
        <Reveal>
          <div className="a-proof-row">
            {STATS.map((s) => (
              <div className="a-stat" key={s.l} data-testid={`stat-${s.l.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                <b>{s.v}</b><span>{s.l}</span>
              </div>
            ))}
          </div>
          <p className="a-proof-note"><span className="a-sample" data-testid="label-sample-snapshot">Sample community snapshot — placeholder figures, not verified</span></p>
        </Reveal>
      </div>
    </section>
  );
}

export function Platform() {
  return (
    <section id="platform" className="a-sec" aria-labelledby="plat-h">
      <div className="a-wrap">
        <Reveal>
          <div className="a-eyebrow">A platform for</div>
          <h2 id="plat-h" className="a-h2">Creators. Freelancers. <em>Entrepreneurs.</em></h2>
        </Reveal>
        <div className="a-plat">
          {AUDIENCES.map((a, i) => (
            <Reveal key={a.t} delay={i * 90}>
              <a href="#join" className="a-plat-card" data-testid={`card-audience-${i}`}>
                <img src={a.img} alt={a.alt} loading="lazy" />
                <h3>{a.t}</h3>
                <p>{a.d}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const ICONS = { spark: Sparkles, play: Play, plane: Plane, dice: Dices, users: Users, book: BookOpen };

export function Ecosystem() {
  return (
    <section id="ecosystem" className="a-sec" aria-labelledby="eco-h">
      <div className="a-wrap">
        <Reveal className="a-head">
          <div>
            <div className="a-eyebrow">Our ecosystem</div>
            <h2 id="eco-h" className="a-h2">More than just <em>a community.</em></h2>
          </div>
          <p className="a-lede">ACTS connects you with people, opportunities and experiences that actually move your career forward.</p>
        </Reveal>
        <div className="a-eco">
          {ECOSYSTEM.map((e, i) => {
            const Icon = ICONS[e.icon];
            return (
              <Reveal key={e.n} delay={(i % 3) * 80}>
                <article className={`a-eco-card ${"feature" in e && e.feature ? "feature" : ""}`} data-testid={`card-ecosystem-${e.n}`} style={{ height: "100%" }}>
                  <div className="a-eco-img">
                    <img src={e.img} alt={e.t} loading="lazy" />
                    <span className="a-eco-n">{e.n}</span>
                  </div>
                  <div className="a-eco-body">
                    <span className="a-eco-ico"><Icon size={20} /></span>
                    <h3>{e.t}</h3>
                    <p>{e.d}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
