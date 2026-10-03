import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Pause, Play } from 'lucide-react';
import './HeroTicker.css';

const COMMUNITY_WORDS = [
  'Freelancers', 'Creators', 'New Friends', 'Talent', 'New Skills',
  'Meetups', 'Learn Together', 'Work Together', 'Trips Together',
  'Fun & Games', 'New Ideas', 'Projects', 'Artists', 'Grow Together',
];

export function HeroTicker() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`hero-ticker mt-3 md:mt-5 ${visible && !paused ? 'is-running' : ''}`}
      role="region"
      aria-label="Inside the ACTS community"
      data-testid="hero-community-ticker"
    >
      <div className="hero-ticker-window">
        <div className="hero-ticker-track">
          {[0, 1].map(copy => (
            <ul className="hero-ticker-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
              {COMMUNITY_WORDS.map((word, index) => (
                <li key={word} className="hero-ticker-item" style={{ '--word': index } as CSSProperties}>
                  <span className="hero-ticker-turn">
                    <span className="hero-ticker-face">{word}</span>
                    <span className="hero-ticker-face hero-ticker-back" aria-hidden="true">{word}</span>
                  </span>
                  <span className="hero-ticker-star" aria-hidden="true">✦</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="hero-ticker-toggle"
        onClick={() => setPaused(value => !value)}
        aria-pressed={paused}
        aria-label={paused ? 'Resume community strip animation' : 'Pause community strip animation'}
        data-testid="hero-ticker-toggle"
      >
        {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
      </button>
    </div>
  );
}