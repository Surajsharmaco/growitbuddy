import React from "react";

interface BlueprintLinesProps {
  /** Width the guide-lines frame is centered to (aligns just outside content). */
  maxWidth?: number;
  lineColor?: string;
  crossColor?: string;
  hatchColor?: string;
  /** Render crosshair marks at the bottom corners too. */
  bottomCrosses?: boolean;
  /** Add crosshair marks at the vertical mid-point of each guide-line. */
  midCrosses?: boolean;
  /** Fill the outer margins (left/right of the content frame) with subtle
   *  diagonal "blueprint" hatching, fading outward toward the viewport edge. */
  hatch?: boolean;
  /** Where the hatch begins, as a % from the top of the section. */
  hatchFrom?: number;
}

function Cross({ color, style }: { color: string; style: React.CSSProperties }) {
  return (
    <span aria-hidden style={{ position: "absolute", width: 13, height: 13, ...style }}>
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: 1,
          transform: "translateY(-50%)",
          background: color,
        }}
      />
      <span
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 0,
          width: 1,
          transform: "translateX(-50%)",
          background: color,
        }}
      />
    </span>
  );
}

/**
 * "Blueprint" guide-lines (technical-drawing style, à la SendRoq): two thin
 * vertical hairlines framing the content column, with + crosshair marks at the
 * corners and (optionally) along the lines, plus optional diagonal hatching in
 * the outer margins. Premium, restrained, on-brand (navy hairlines). Render as
 * the first child of a `position: relative; overflow: hidden` section. Lives in
 * the gutters, so it never overlaps body text (pointer-events: none).
 */
export default function BlueprintLines({
  maxWidth = 1180,
  lineColor = "rgba(30,41,59,0.12)",
  crossColor = "rgba(30,41,59,0.36)",
  hatchColor = "rgba(30,41,59,0.055)",
  bottomCrosses = true,
  midCrosses = false,
  hatch = false,
  hatchFrom = 52,
}: BlueprintLinesProps) {
  const hatchMask =
    "linear-gradient(to bottom, transparent 0%, #000 34%)";
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {/* diagonal hatch in the outer margins, fading outward + in from its top */}
      {hatch && (
        <>
          <span
            style={{
              position: "absolute",
              right: "100%",
              top: `${hatchFrom}%`,
              bottom: 0,
              width: "100vw",
              backgroundImage: `repeating-linear-gradient(45deg, ${hatchColor} 0, ${hatchColor} 1px, transparent 1px, transparent 9px)`,
              maskImage: `linear-gradient(to left, #000 0%, transparent 86%), ${hatchMask}`,
              WebkitMaskImage: `linear-gradient(to left, #000 0%, transparent 86%), ${hatchMask}`,
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: "100%",
              top: `${hatchFrom}%`,
              bottom: 0,
              width: "100vw",
              backgroundImage: `repeating-linear-gradient(-45deg, ${hatchColor} 0, ${hatchColor} 1px, transparent 1px, transparent 9px)`,
              maskImage: `linear-gradient(to right, #000 0%, transparent 86%), ${hatchMask}`,
              WebkitMaskImage: `linear-gradient(to right, #000 0%, transparent 86%), ${hatchMask}`,
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          />
        </>
      )}

      {/* vertical guide lines */}
      <span style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 1, background: lineColor }} />
      <span style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 1, background: lineColor }} />

      {/* corner + (optional) mid crosshair marks */}
      <Cross color={crossColor} style={{ left: 0, top: 0, transform: "translateX(-50%)" }} />
      <Cross color={crossColor} style={{ right: 0, top: 0, transform: "translateX(50%)" }} />
      {midCrosses && (
        <>
          <Cross color={crossColor} style={{ left: 0, top: "50%", transform: "translate(-50%, -50%)" }} />
          <Cross color={crossColor} style={{ right: 0, top: "50%", transform: "translate(50%, -50%)" }} />
        </>
      )}
      {bottomCrosses && (
        <>
          <Cross color={crossColor} style={{ left: 0, bottom: 0, transform: "translateX(-50%)" }} />
          <Cross color={crossColor} style={{ right: 0, bottom: 0, transform: "translateX(50%)" }} />
        </>
      )}
    </div>
  );
}
