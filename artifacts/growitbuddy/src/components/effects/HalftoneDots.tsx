import { useMemo } from "react";

interface HalftoneDotsProps {
  width?: number;
  height?: number;
  color?: string;
  maxRadius?: number;
  spacing?: number;
  origin?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  style?: React.CSSProperties;
}

export default function HalftoneDots({
  width = 300,
  height = 240,
  color = "#1E293B",
  maxRadius = 3,
  spacing = 18,
  origin = "bottom-left",
  style,
}: HalftoneDotsProps) {
  const dots = useMemo(() => {
    const cols = Math.ceil(width / spacing);
    const rows = Math.ceil(height / spacing);
    const out: { cx: number; cy: number; r: number; opacity: number }[] = [];

    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= cols; col++) {
        const cx = col * spacing;
        const cy = row * spacing;
        const nx = cx / width;
        const ny = cy / height;

        let dx: number, dy: number;
        switch (origin) {
          case "top-left":     dx = nx;     dy = ny;     break;
          case "top-right":    dx = 1 - nx; dy = ny;     break;
          case "bottom-right": dx = 1 - nx; dy = 1 - ny; break;
          default:             dx = nx;     dy = 1 - ny; break;
        }

        const dist = Math.sqrt(dx * dx + dy * dy);
        const t = Math.min(dist / Math.SQRT2, 1);

        // Cubic falloff - concentrates mass near origin for a crisper premium look
        const scale = Math.pow(1 - t, 2.4);
        const r = maxRadius * scale;

        // Per-dot opacity tied to size - small dots fade to near-invisible
        const opacity = Math.pow(scale, 0.55);

        if (r > 0.35) out.push({ cx, cy, r, opacity });
      }
    }
    return out;
  }, [width, height, maxRadius, spacing, origin]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ display: "block", ...style }}
    >
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.cx}
          cy={d.cy}
          r={d.r}
          fill={color}
          fillOpacity={d.opacity}
        />
      ))}
    </svg>
  );
}
