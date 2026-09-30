import { useState } from "react";
import { ArrowRight, Instagram, Linkedin, Youtube, Twitter } from "lucide-react";
import { COLLAGE, IMG, NAV, SKILLS, STORIES } from "./content";
import { Logo, Reveal } from "./Top";

export function Life() {
  return (
    <section id="life" className="a-sec" aria-labelledby="life-h">
      <div className="a-wrap">
        <Reveal>
          <div className="a-eyebrow">Life at ACTS</div>
          <h2 id="life-h" className="a-h2">Real People. Real Events. <em>Real Connections.</em></h2>
        </Reveal>
        <Reveal>
          <div className="a-collage">
            {COLLAGE.map((c, i) => (
              <figure className="a-tile" key={c.l} style={{ margin: 0 }} data-testid={`tile-life-${i}`}>
                <img src={c.img} alt={`${c.l} at ACTS Club`} loading="lazy" />
                <span>{c.l}</span>
              </figure>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Opportunities() {
  const keys = Object.keys(SKILLS);
  const [sel, setSel] = useState(keys[0]);
  return (
    <section id="opportunities" className="a-sec" aria-labelledby="opp-h">
      <div className="a-wrap a-opp">
        <Reveal>
          <div className="a-eyebrow">Opportunities</div>
          <h2 id="opp-h" className="a-h2">Your skills can <em>take you places.</em></h2>
          <p className="a-lede" style={{ marginTop: 16 }}>ACTS members discover opportunities based on what they actually know and can do.</p>
          <div className="a-chips" role="group" aria-label="Choose a skill">
            {keys.map((k) => (
              <button key={k} className="a-chip" aria-pressed={sel === k} onClick={() => setSel(k)} data-testid={`chip-skill-${k.toLowerCase().replace(/\s+/g, "-")}`}>{k}</button>
            ))}
          </div>
          <div className="a-opp-panel" aria-live="polite" data-testid="panel-opportunities">
            <b className="a-display" style={{ fontSize: 22 }}>{sel}</b>
            <ul>
              {SKILLS[sel].map((o) => <li key={o}>{o}<span>Example</span></li>)}
            </ul>
            <p className="a-sample" style={{ marginTop: 16 }}>Illustrative examples, not live listings</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="a-opp-photo"><img src={IMG.collab} alt="Four creatives collaborating around a wooden table with laptops and notebooks" loading="lazy" /></div>
        </Reveal>
      </div>
    </section>
  );
}

export function GrowItBuddy() {
  return (
    <section id="growitbuddy" className="a-sec" aria-labelledby="gib-h">
      <div className="a-wrap">
        <Reveal>
          <div className="a-gib">
            <div>
              <div className="a-eyebrow">The GrowItBuddy path</div>
              <h2 id="gib-h">Work with <em>GrowItBuddy.</em></h2>
              <p>Get access to real opportunities from GrowItBuddy, a content &amp; distribution studio that has generated 700M+ views.</p>
              <a href="#opportunities" className="a-btn a-btn-primary" data-testid="button-explore-opportunities">Explore Opportunities <ArrowRight size={18} /></a>
            </div>
            <div>
              <div className="a-big" data-testid="text-views">700M+ views</div>
              <ol className="a-path" style={{ marginTop: 24 }}>
                <li><b>Join ACTS</b><span>Be part of the community</span></li>
                <li><b>Show your skill</b><span>Get noticed by people doing the work</span></li>
                <li><b>Work with the studio</b><span>Step into real projects</span></li>
              </ol>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Story() {
  return (
    <section id="story" className="a-sec" aria-labelledby="story-h">
      <div className="a-wrap">
        <Reveal>
          <div className="a-story">
            <img src={IMG.network} alt="Members talking at an ACTS networking evening" loading="lazy" />
            <div className="a-story-in">
              <div className="a-eyebrow" style={{ color: "#fff" }}>About ACTS</div>
              <h2 id="story-h" style={{ marginTop: 12 }}>Meet people. Find work. Grow together.</h2>
              <p>ACTS is a members-first community for Indian creators and freelancers: meetups, retreats, workshops and real opportunities, all in one circle.</p>
              <span className="a-video-note" data-testid="text-video-note">Community film coming soon</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Stories() {
  return (
    <section id="stories" className="a-sec" aria-labelledby="st-h">
      <div className="a-wrap">
        <Reveal>
          <div className="a-eyebrow">Hear from our members</div>
          <h2 id="st-h" className="a-h2" style={{ fontSize: "clamp(30px,4vw,48px)" }}>A community that creates <em>real opportunities.</em></h2>
          <p style={{ marginTop: 14 }}><span className="a-sample" data-testid="label-illustrative">Illustrative member stories — placeholder copy, not real testimonials</span></p>
        </Reveal>
        <div className="a-quotes">
          {STORIES.map((s, i) => (
            <Reveal key={s.i} delay={i * 90}>
              <figure className="a-quote" data-testid={`card-story-${i}`} style={{ height: "100%" }}>
                <blockquote>{s.q}</blockquote>
                <figcaption className="a-who"><span className="a-av" aria-hidden="true">{s.i}</span><div><b>{s.n}</b><small>{s.r}</small></div></figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Join() {
  return (
    <section id="join" className="a-sec" aria-labelledby="join-h">
      <div className="a-wrap">
        <Reveal>
          <div className="a-join">
            <h2 id="join-h">The right people.<br /><em>The right opportunities.</em></h2>
            <div className="a-join-r">
              <p>Join the exclusive community for creators and freelancers.</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="#join" className="a-btn a-btn-primary" data-testid="button-join-final">Join ACTS Club <ArrowRight size={18} /></a>
                <a href="#life" className="a-btn a-btn-ghost" data-testid="button-explore-community">Explore Community</a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  const soc = [[Instagram, "Instagram"], [Linkedin, "LinkedIn"], [Youtube, "YouTube"], [Twitter, "X"]] as const;
  return (
    <footer className="a-foot">
      <div className="a-wrap">
        <div className="a-foot-in">
          <Logo />
          <nav className="a-links" aria-label="Footer">
            {NAV.slice(1).map((n) => <a key={n.label} href={n.href} data-testid={`link-footer-${n.label.toLowerCase().replace(/\s+/g, "-")}`}>{n.label}</a>)}
          </nav>
          <div className="a-soc">
            {soc.map(([Icon, l]) => <a key={l} href="#home" aria-label={l} data-testid={`link-social-${l.toLowerCase()}`}><Icon size={18} /></a>)}
          </div>
        </div>
        <div className="a-foot-meta"><span>Artists. Creators. Talent. Skills.</span><span>ACTS Club, a GrowItBuddy community.</span></div>
      </div>
    </footer>
  );
}
