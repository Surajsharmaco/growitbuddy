import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// ── Shared "watercolor wash" card system ──────────────────────────────────
// Single source of truth for the premium muted multi-hue card surfaces used
// on the Home "Who we work with" audience cards and (for site-wide cohesion)
// on other plain feature/value/step card rows. Muted-but-visible washes +
// hue-matched borders + var(--gb-grain) multiply grain + frosted icon chip.

export const WASH_CARD_BACKGROUNDS: string[] = [
  // dusty sky blue
  "radial-gradient(60% 55% at 18% 22%, rgba(150,180,212,0.46) 0%, rgba(150,180,212,0) 60%), radial-gradient(55% 50% at 80% 30%, rgba(176,198,222,0.40) 0%, rgba(176,198,222,0) 62%), radial-gradient(50% 45% at 30% 80%, rgba(222,218,200,0.26) 0%, rgba(222,218,200,0) 60%), radial-gradient(60% 60% at 75% 85%, rgba(162,188,214,0.38) 0%, rgba(162,188,214,0) 65%), linear-gradient(160deg, #EEF3FB 0%, #E2EAF4 100%)",
  // terracotta / clay
  "radial-gradient(65% 60% at 20% 20%, rgba(212,158,134,0.50) 0%, rgba(212,158,134,0) 60%), radial-gradient(60% 55% at 85% 25%, rgba(204,140,120,0.44) 0%, rgba(204,140,120,0) 60%), radial-gradient(60% 60% at 75% 85%, rgba(214,176,154,0.40) 0%, rgba(214,176,154,0) 62%), radial-gradient(55% 50% at 25% 80%, rgba(216,186,158,0.34) 0%, rgba(216,186,158,0) 60%), linear-gradient(160deg, #F8ECE3 0%, #F0DCCD 100%)",
  // teal / sage-lavender
  "radial-gradient(60% 55% at 22% 25%, rgba(150,192,184,0.44) 0%, rgba(150,192,184,0) 60%), radial-gradient(55% 50% at 82% 28%, rgba(176,184,210,0.40) 0%, rgba(176,184,210,0) 62%), radial-gradient(60% 60% at 78% 82%, rgba(188,202,216,0.38) 0%, rgba(188,202,216,0) 64%), radial-gradient(50% 50% at 28% 82%, rgba(190,206,190,0.28) 0%, rgba(190,206,190,0) 60%), linear-gradient(160deg, #EDF4F1 0%, #E3EBF1 100%)",
  // sage / olive-gold
  "radial-gradient(60% 55% at 20% 24%, rgba(176,192,148,0.44) 0%, rgba(176,192,148,0) 60%), radial-gradient(60% 55% at 85% 30%, rgba(206,196,140,0.42) 0%, rgba(206,196,140,0) 62%), radial-gradient(60% 60% at 78% 85%, rgba(162,188,158,0.38) 0%, rgba(162,188,158,0) 64%), radial-gradient(50% 50% at 25% 82%, rgba(198,202,150,0.32) 0%, rgba(198,202,150,0) 60%), linear-gradient(160deg, #F1F4E5 0%, #E8EDD5 100%)",
  // dusty violet
  "radial-gradient(60% 55% at 20% 22%, rgba(178,166,206,0.46) 0%, rgba(178,166,206,0) 60%), radial-gradient(55% 50% at 84% 26%, rgba(198,178,208,0.42) 0%, rgba(198,178,208,0) 62%), radial-gradient(60% 60% at 76% 84%, rgba(176,182,212,0.38) 0%, rgba(176,182,212,0) 64%), radial-gradient(50% 50% at 26% 82%, rgba(208,186,202,0.30) 0%, rgba(208,186,202,0) 60%), linear-gradient(160deg, #F1ECF8 0%, #E7DEF2 100%)",
  // warm sand / amber
  "radial-gradient(60% 55% at 20% 24%, rgba(216,188,146,0.50) 0%, rgba(216,188,146,0) 60%), radial-gradient(58% 52% at 84% 28%, rgba(214,176,156,0.42) 0%, rgba(214,176,156,0) 62%), radial-gradient(60% 60% at 78% 84%, rgba(216,192,158,0.40) 0%, rgba(216,192,158,0) 64%), radial-gradient(50% 50% at 26% 80%, rgba(218,200,172,0.32) 0%, rgba(218,200,172,0) 60%), linear-gradient(160deg, #F8EFE0 0%, #F1E2CD 100%)",
];

export const WASH_CARD_BORDERS: string[] = [
  "rgba(120,150,190,0.55)",
  "rgba(196,138,112,0.55)",
  "rgba(130,176,168,0.52)",
  "rgba(168,182,120,0.55)",
  "rgba(160,144,196,0.55)",
  "rgba(202,170,120,0.58)",
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
    border: `1.5px solid ${getWashBorder(i)}`,
    borderRadius: 20,
    boxShadow: "0 18px 50px -26px rgba(30,41,59,0.30)",
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
        opacity: 0.6,
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
