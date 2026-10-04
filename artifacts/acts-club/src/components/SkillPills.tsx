import type { CSSProperties } from 'react';
import './SkillPills.css';

const SKILL_ROWS = [
  ['Video Editing', 'Design', 'Motion Design', 'UI/UX', 'Branding', 'Illustration'],
  ['Marketing', 'Development', 'Web Design', 'SEO', 'Social Media', 'Analytics'],
  ['Writing', 'Photography', 'Content', 'Copywriting', 'Strategy', 'Community Management'],
];

export function SkillPills() {
  return (
    <div
      className="skills-ribbons mt-6 md:mt-8"
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
    </div>
  );
}