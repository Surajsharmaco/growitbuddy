import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface CountUpProps {
  value: string;
  className?: string;
  style?: React.CSSProperties;
  duration?: number;
}

/**
 * Animates a numeric string (like "14M", "$2.4M", "4.2×") from 0 to its value
 * when it enters the viewport - just like omc.com's stat counters.
 */
export default function CountUp({ value, className = "", style = {}, duration = 1400 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [display, setDisplay] = useState<string>("0");
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;

    const prefix = value.match(/^[^0-9]*/)?.[0] ?? "";
    const suffix = value.match(/[^0-9.]+$/)?.[0] ?? "";
    const num = parseFloat(value.replace(/[^0-9.]/g, ""));
    const isDecimal = value.includes(".");

    if (isNaN(num)) {
      setDisplay(value);
      return;
    }

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = num * eased;
      const formatted = isDecimal ? current.toFixed(1) : Math.floor(current).toString();
      setDisplay(`${prefix}${formatted}${suffix}`);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [inView]);

  return (
    <span ref={ref} className={className} style={style}>
      {display}
    </span>
  );
}
