import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface TextRevealProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  stagger?: boolean;
}

/**
 * omc.com-style clip reveal: text slides up from behind an overflow:hidden mask.
 * Works on any text node - wrap the heading in this component.
 */
export function TextReveal({ children, as: Tag = "h2", className = "", style = {}, delay = 0 }: TextRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <div ref={ref} style={{ overflow: "hidden", display: "block" }}>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={inView ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
      >
        <Tag className={className} style={style}>{children}</Tag>
      </motion.div>
    </div>
  );
}

/**
 * Word-by-word staggered reveal - each word slides up independently.
 * Pass plain string children for best results.
 */
export function WordReveal({ children, as: Tag = "h2", className = "", style = {}, delay = 0 }: TextRevealProps & { children: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });

  const words = typeof children === "string" ? children.split(" ") : [children];

  return (
    <Tag ref={ref as React.Ref<any>} className={className} style={{ ...style, display: "flex", flexWrap: "wrap", gap: "0.25em 0", columnGap: "0.28em" }}>
      {words.map((word, i) => (
        <span key={i} style={{ overflow: "hidden", display: "inline-block", lineHeight: "1.1" }}>
          <motion.span
            style={{ display: "inline-block" }}
            initial={{ y: "105%", opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : { y: "105%", opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.04 }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/**
 * Line-by-line reveal - each line of text (separated by <br> or newlines) slides up.
 */
export function LineReveal({ lines, className = "", style = {}, delay = 0, dark = false }: {
  lines: string[];
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  dark?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });

  return (
    <div ref={ref}>
      {lines.map((line, i) => (
        <div key={i} style={{ overflow: "hidden", lineHeight: "1.1" }}>
          <motion.div
            initial={{ y: "105%" }}
            animate={inView ? { y: 0 } : { y: "105%" }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.08 }}
            className={className}
            style={style}
          >
            {line}
          </motion.div>
        </div>
      ))}
    </div>
  );
}

/**
 * Fade-up reveal for paragraphs and subtler elements.
 */
export function FadeUp({ children, delay = 0, className = "", style = {} }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
