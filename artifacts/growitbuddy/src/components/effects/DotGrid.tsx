import React from "react";

interface DotGridProps {
  /** Height of the dotted block from the top of the section. */
  height?: number;
  /** Dot colour (navy, on-brand). */
  dotColor?: string;
  /** Spacing between dots in px. */
  gap?: number;
  /** Width the block is centred to. */
  maxWidth?: number;
}

/**
 * Faint dotted-grid pattern (SendRoq-style) for the top of a hero. Soft
 * rectangular fade on every edge so it melts into the page. Navy dots,
 * decorative only (pointer-events: none, aria-hidden).
 */
export default function DotGrid({
  height = 360,
  dotColor = "rgba(30,41,59,0.16)",
  gap = 22,
  maxWidth = 1100,
}: DotGridProps) {
  const fade =
    "linear-gradient(to bottom, #000 0%, #000 26%, transparent 80%), linear-gradient(to right, transparent 0%, #000 16%, #000 84%, transparent 100%)";
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth,
        height,
        pointerEvents: "none",
        zIndex: 0,
        backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1.5px)`,
        backgroundSize: `${gap}px ${gap}px`,
        backgroundPosition: "center top",
        maskImage: fade,
        WebkitMaskImage: fade,
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
      }}
    />
  );
}
