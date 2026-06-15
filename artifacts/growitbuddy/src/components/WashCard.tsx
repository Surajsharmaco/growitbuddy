import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// ── Shared "watercolor wash" card system ──────────────────────────────────
// Single source of truth for the premium card surfaces used on the Home
// "Who we work with" audience cards and (for site-wide cohesion) on other
// plain feature/value/step card rows. Deliberately RESTRAINED: an ivory/cream
// base carrying only a whisper of per-index tint (low-alpha radial blobs) so
// cards read premium, not colorful. Faint hue-matched borders + var(--gb-grain)
// multiply grain + frosted icon chip.

export const WASH_CARD_BACKGROUNDS: string[] = [
  // faint sky blue on ivory
  "radial-gradient(72% 62% at 20% 20%, rgba(150,178,210,0.15) 0%, rgba(150,178,210,0) 64%), radial-gradient(62% 56% at 82% 82%, rgba(168,190,214,0.10) 0%, rgba(168,190,214,0) 66%), linear-gradient(160deg, #FBFCFE 0%, #F3F6FA 100%)",
  // faint terracotta on cream
  "radial-gradient(72% 62% at 20% 20%, rgba(208,156,132,0.14) 0%, rgba(208,156,132,0) 64%), radial-gradient(62% 56% at 82% 82%, rgba(212,176,154,0.10) 0%, rgba(212,176,154,0) 66%), linear-gradient(160deg, #FCF8F4 0%, #F6EEE6 100%)",
  // faint teal/sage on ivory
  "radial-gradient(72% 62% at 22% 22%, rgba(150,188,180,0.13) 0%, rgba(150,188,180,0) 64%), radial-gradient(62% 56% at 80% 82%, rgba(180,196,206,0.10) 0%, rgba(180,196,206,0) 66%), linear-gradient(160deg, #F9FCFA 0%, #EFF5F2 100%)",
  // faint sage/olive on ivory
  "radial-gradient(72% 62% at 20% 22%, rgba(178,190,150,0.13) 0%, rgba(178,190,150,0) 64%), radial-gradient(62% 56% at 80% 82%, rgba(196,194,150,0.10) 0%, rgba(196,194,150,0) 66%), linear-gradient(160deg, #FBFCF4 0%, #F2F5E9 100%)",
  // faint violet on ivory
  "radial-gradient(72% 62% at 20% 20%, rgba(178,168,204,0.14) 0%, rgba(178,168,204,0) 64%), radial-gradient(62% 56% at 82% 82%, rgba(196,180,206,0.10) 0%, rgba(196,180,206,0) 66%), linear-gradient(160deg, #FBF9FD 0%, #F3EEF7 100%)",
  // faint warm sand on cream
  "radial-gradient(72% 62% at 20% 22%, rgba(212,186,148,0.15) 0%, rgba(212,186,148,0) 64%), radial-gradient(62% 56% at 82% 82%, rgba(214,190,160,0.10) 0%, rgba(214,190,160,0) 66%), linear-gradient(160deg, #FCF9F2 0%, #F4EEE1 100%)",
];

export const WASH_CARD_BORDERS: string[] = [
  "rgba(120,150,190,0.28)",
  "rgba(196,150,124,0.28)",
  "rgba(140,176,168,0.26)",
  "rgba(168,176,128,0.28)",
  "rgba(166,150,196,0.28)",
  "rgba(196,170,128,0.30)",
];

export function getWash(i: number): string {
  return WASH_CARD_BACKGROUNDS[((i % WASH_CARD_BACKGROUNDS.length) + WASH_CARD_BACKGROUNDS.length) % WASH_CARD_BACKGROUNDS.length];
}

export function getWashBorder(i: number): string {
  return WASH_CARD_BORDERS[((i % WASH_CARD_BORDERS.length) + WASH_CARD_BORDERS.length) % WASH_CARD_BORDERS.length];
}

// Full card container style. Pass overrides for padding/minHeight/display etc.
export function getWashCardStyle(i: number, overrides: CSSProperties = {}): CSSProperties {
  return {
    background: getWash(i),
    border: `1px solid ${getWashBorder(i)}`,
    borderRadius: 20,
    boxShadow: "0 14px 40px -30px rgba(30,41,59,0.20)",
    position: "relative",
    overflow: "hidden",
    // Establish a stacking context so <CardGrain/> (zIndex:-1) paints above the
    // wash background but below ALL card content — callers don't need to mark
    // children position:relative for them to stay legible.
    isolation: "isolate",
    ...overrides,
  };
}

// Rough film-grain overlay. Render anywhere inside a wash card built with
// getWashCardStyle: its negative z-index keeps it above the wash background yet
// behind every content node.
export function CardGrain() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: -1,
        backgroundImage: "var(--gb-grain)",
        backgroundSize: "150px 150px",
        backgroundRepeat: "repeat",
        opacity: 0.45,
        mixBlendMode: "multiply",
        pointerEvents: "none",
      }}
    />
  );
}

// Frosted white rounded chip holding a lucide icon OR a short label (e.g. a step
// number). The chip border is hue-matched to the card at the same index.
export function WashIconChip({
  index,
  icon: Icon,
  label,
  size = 48,
  iconSize = 23,
  style,
}: {
  index: number;
  icon?: LucideIcon;
  label?: ReactNode;
  size?: number;
  iconSize?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: "rgba(255,255,255,0.62)",
        border: `1px solid ${getWashBorder(index)}`,
        boxShadow: "0 6px 16px -8px rgba(30,41,59,0.28)",
        backdropFilter: "blur(2px)",
        ...style,
      }}
    >
      {Icon ? (
        <Icon size={iconSize} strokeWidth={1.75} color="#14202E" />
      ) : (
        <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", color: "#14202E" }}>{label}</span>
      )}
    </div>
  );
}
