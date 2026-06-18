import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// ── Shared "watercolor wash" card system ──────────────────────────────────
// Single source of truth for the premium card surfaces used across Home,
// Services, About, Resources and the talent pools. COHESIVE by design: every
// wash is drawn from the brand's OWN two colors — a warm champagne GOLD
// (--gb-gold) as the dominant highlight, with a soft slate/navy (--gb-authority)
// accent on every third card for gentle rhythm. No off-brand rainbow hues. An
// ivory/cream base carries only low-alpha radial blobs so cards read warm and
// premium, never busy. Faint hue-matched borders + var(--gb-grain) multiply
// grain + frosted icon chip.

export const WASH_CARD_BACKGROUNDS: string[] = [
  // champagne gold on ivory (highlight)
  "radial-gradient(72% 62% at 20% 20%, rgba(194,168,120,0.17) 0%, rgba(194,168,120,0) 64%), radial-gradient(62% 56% at 82% 82%, rgba(206,182,140,0.11) 0%, rgba(206,182,140,0) 66%), linear-gradient(160deg, #FCFAF5 0%, #F5EFE1 100%)",
  // warm sand on cream
  "radial-gradient(72% 62% at 20% 20%, rgba(208,180,130,0.17) 0%, rgba(208,180,130,0) 64%), radial-gradient(62% 56% at 82% 82%, rgba(196,168,116,0.11) 0%, rgba(196,168,116,0) 66%), linear-gradient(160deg, #FCF9F1 0%, #F4ECD9 100%)",
  // soft slate / navy accent on ivory
  "radial-gradient(72% 62% at 22% 22%, rgba(96,114,146,0.12) 0%, rgba(96,114,146,0) 64%), radial-gradient(62% 56% at 80% 82%, rgba(120,138,168,0.08) 0%, rgba(120,138,168,0) 66%), linear-gradient(160deg, #FAFBFC 0%, #EDF0F4 100%)",
  // champagne gold (lighter variation)
  "radial-gradient(72% 62% at 20% 22%, rgba(198,174,128,0.15) 0%, rgba(198,174,128,0) 64%), radial-gradient(62% 56% at 80% 82%, rgba(212,190,150,0.10) 0%, rgba(212,190,150,0) 66%), linear-gradient(160deg, #FCFBF6 0%, #F6F0E4 100%)",
  // warm sand (variation)
  "radial-gradient(72% 62% at 20% 20%, rgba(204,176,128,0.16) 0%, rgba(204,176,128,0) 64%), radial-gradient(62% 56% at 82% 82%, rgba(214,188,146,0.10) 0%, rgba(214,188,146,0) 66%), linear-gradient(160deg, #FCFAF3 0%, #F5EEDE 100%)",
  // soft slate / navy accent (variation)
  "radial-gradient(72% 62% at 20% 20%, rgba(102,120,150,0.11) 0%, rgba(102,120,150,0) 64%), radial-gradient(62% 56% at 82% 82%, rgba(124,142,170,0.07) 0%, rgba(124,142,170,0) 66%), linear-gradient(160deg, #FAFBFD 0%, #EEF1F5 100%)",
];

export const WASH_CARD_BORDERS: string[] = [
  "rgba(196,170,124,0.34)",
  "rgba(200,172,120,0.34)",
  "rgba(116,136,168,0.28)",
  "rgba(198,174,128,0.30)",
  "rgba(204,176,128,0.32)",
  "rgba(120,140,170,0.26)",
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
