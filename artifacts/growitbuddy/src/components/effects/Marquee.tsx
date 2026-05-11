import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface MarqueeProps {
  items: string[];
  speed?: number;
  dark?: boolean;
  reverse?: boolean;
  separator?: string;
}

/**
 * omc.com-style infinite horizontal marquee ticker.
 * Items scroll continuously left (or right if reverse=true).
 * Uses CSS animation for butter-smooth GPU-composited performance.
 */
export default function Marquee({ items, speed = 30, dark = false, reverse = false, separator = "·" }: MarqueeProps) {
  const text = items.join(` ${separator} `) + ` ${separator} `;
  const doubled = `${text}${text}`;

  return (
    <div
      style={{
        overflow: "hidden",
        background: dark ? "#F4F4F8" : "#FAFAFB",
        borderTop: dark ? "1px solid rgba(15,15,20,0.04)" : "1px solid rgba(0,0,0,0.07)",
        borderBottom: dark ? "1px solid rgba(15,15,20,0.04)" : "1px solid rgba(0,0,0,0.07)",
        padding: "14px 0",
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "max-content",
          animation: `marquee-${reverse ? "reverse" : "forward"} ${speed}s linear infinite`,
          willChange: "transform",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
        onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
      >
        {[1, 2, 3, 4].map((_, idx) => (
          <span key={idx} style={{ whiteSpace: "nowrap", paddingRight: "2.5rem" }}>
            {items.map((item, i) => (
              <span key={i}>
                <span
                  style={{
                    fontSize: "12px",
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: dark ? "#9CA3AF" : "rgba(0,0,0,0.06)",
                  }}
                >
                  {item}
                </span>
                {i < items.length - 1 && (
                  <span style={{ margin: "0 1.2rem", color: dark ? "rgba(15,15,20,0.1)" : "rgba(0,0,0,0.2)", fontSize: "10px" }}>
                    {separator}
                  </span>
                )}
              </span>
            ))}
            <span style={{ marginLeft: "1.2rem", marginRight: "1.2rem", color: dark ? "rgba(15,15,20,0.1)" : "rgba(0,0,0,0.2)", fontSize: "10px" }}>{separator}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Scroll-velocity marquee - speeds up / slows / reverses based on scroll direction.
 */
export function ScrollMarquee({ items, dark = false }: { items: string[]; dark?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const x = useTransform(scrollYProgress, [0, 1], [0, -300]);

  return (
    <div style={{ overflow: "hidden", background: dark ? "#F4F4F8" : "#F6F6F6", padding: "20px 0" }} ref={containerRef}>
      <motion.div style={{ x, display: "flex", gap: "3rem", width: "max-content" }}>
        {[...items, ...items, ...items].map((item, i) => (
          <span
            key={i}
            style={{
              fontSize: "clamp(28px, 4vw, 52px)",
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: i % 2 === 0 ? "italic" : "normal",
              fontWeight: 500,
              color: dark ? (i % 2 === 0 ? "rgba(255,255,255,0.9)" : "rgba(15,15,20,0.1)") : (i % 2 === 0 ? "#000" : "rgba(0,0,0,0.12)"),
              whiteSpace: "nowrap",
              letterSpacing: "-0.02em",
            }}
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
