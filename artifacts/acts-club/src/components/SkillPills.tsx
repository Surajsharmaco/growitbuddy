import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Pause, Play } from 'lucide-react';
import './SkillPills.css';

const SKILL_ROWS = [
  ['Video Editing', 'Design', 'Motion Design', 'UI/UX', 'Branding', 'Illustration'],
  ['Marketing', 'Development', 'Web Design', 'SEO', 'Social Media', 'Analytics'],
  ['Writing', 'Photography', 'Content', 'Copywriting', 'Strategy', 'Community Management'],
];

export function SkillPills() {
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
      className={`skills-ribbons mt-6 md:mt-8 ${visible && !paused ? 'is-running' : ''}`}
      data-testid="skills-ribbons"
    >
      <div className="skills-ribbons-window">
        {SKILL_ROWS.map((skills, row) => (
          <div
            className="skills-ribbon-row"
            key={row}
            style={{ '--row': row } as CSSProperties}
            data-testid={`skills-ribbon-row-${row + 1}`}
          >
            <div className="skills-ribbon-track">
              {[0, 1].map(copy => (
                <ul className="skills-ribbon-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
                  {[0, 1].map(repeat => skills.map((skill, index) => (
                    <li
                      key={`${repeat}-${skill}`}
                      aria-hidden={repeat === 1 ? true : undefined}
                      className="skills-ribbon-item"
                      style={{ '--pill': index + row * 6 } as CSSProperties}
                    >
                      <span className="skills-pill-orbit">
                        <span
                          className={`skills-pill-face ${skill === 'Writing' ? 'skills-pill-accent' : ''}`}
                          data-testid={copy === 0 && repeat === 0 ? `chip-skill-${skill.toLowerCase().replace(/\s/g, '-')}` : undefined}
                        >
                          {skill}
                        </span>
                        <span
                          aria-hidden="true"
                          className={`skills-pill-face skills-pill-back ${skill === 'Writing' ? 'skills-pill-accent' : ''}`}
                        >
                          {skill}
                        </span>
                      </span>
                    </li>
                  )))}
                </ul>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="skills-ribbons-controls">
        <button
          type="button"
          onClick={() => setPaused(value => !value)}
          aria-pressed={paused}
          aria-label={paused ? 'Resume skill animations' : 'Pause skill animations'}
          className="skills-motion-toggle"
          data-testid="skills-motion-toggle"
        >
          {paused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}
          {paused ? 'Play' : 'Pause'}
        </button>
      </div>
    </div>
  );
}