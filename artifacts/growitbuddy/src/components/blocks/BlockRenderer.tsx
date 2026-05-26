import React from "react";
import { getEmbedUrl as buildEmbedUrl } from "@/lib/videoEmbed";

// ─────────────────────────────────────────────────────────────────────────────
// BlockRenderer — Phase 1 of the Wix/Elementor-style Case Study inline editor.
//
// Public, read-only renderer. Takes a Block[] (typed in @workspace/db) and
// renders it using the site's existing visual language (cream bg, Inter, etc).
// Phase 2 will wrap each block with an edit overlay; this file should remain
// the canonical visual output (the editor reuses it via the same component).
// ─────────────────────────────────────────────────────────────────────────────

export type BlockStyle = {
  padding?: string;
  margin?: string;
  bg?: string;
  color?: string;
  align?: "left" | "center" | "right";
  maxWidth?: number;
};

export type BlockType =
  | "heading" | "paragraph" | "image" | "video" | "metricsGrid"
  | "bulletList" | "testimonial" | "tagList" | "gallery" | "divider"
  | "spacer" | "button" | "columns";

export type Block = {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
  style?: BlockStyle;
};

// Site theme constants (mirrors CaseStudy.tsx / Home.tsx).
const BG = "#F8F8F6";
const TEXT = "#0A0A0A";
const SLATE = "#1E293B";
const MUTED = "#5F5F5F";
const RULE = "#E5E5E0";
const GOLD = "#C2A878";
const CARD = "#FFFFFF";

function p<T = string>(props: Record<string, unknown>, key: string, fallback?: T): T {
  const v = props[key];
  return (v === undefined || v === null ? fallback : v) as T;
}

function applyStyle(style?: BlockStyle): React.CSSProperties {
  if (!style) return {};
  const css: React.CSSProperties = {};
  if (style.padding) css.padding = style.padding;
  if (style.margin) css.margin = style.margin;
  if (style.bg) css.background = style.bg;
  if (style.color) css.color = style.color;
  if (style.align) css.textAlign = style.align;
  return css;
}

function Container({ block, children }: { block: Block; children: React.ReactNode }) {
  const max = block.style?.maxWidth ?? 960;
  return (
    <div style={{ ...applyStyle(block.style), width: "100%" }}>
      <div style={{ maxWidth: max, margin: "0 auto", padding: "0 24px" }}>{children}</div>
    </div>
  );
}

// ── Individual block components ─────────────────────────────────────────────

function HeadingBlock({ block }: { block: Block }) {
  const level = p<number>(block.props, "level", 2);
  const text = p<string>(block.props, "text", "");
  const eyebrow = p<string | undefined>(block.props, "eyebrow", undefined);
  const sizes: Record<number, number> = { 1: 48, 2: 34, 3: 22 };
  const fontSize = sizes[level] ?? 28;
  const headingStyle: React.CSSProperties = { fontSize, lineHeight: 1.15, color: SLATE, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" };
  return (
    <Container block={block}>
      {eyebrow && (
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, margin: "0 0 12px 0" }}>
          {eyebrow}
        </p>
      )}
      {level === 1 ? <h1 style={headingStyle}>{text}</h1>
        : level === 2 ? <h2 style={headingStyle}>{text}</h2>
        : <h3 style={headingStyle}>{text}</h3>}
    </Container>
  );
}

function ParagraphBlock({ block }: { block: Block }) {
  const html = p<string>(block.props, "html", "");
  return (
    <Container block={block}>
      <div
        style={{ fontSize: 17, lineHeight: 1.7, color: MUTED }}
        // Trusted source: admin-authored content. Phase 2 will use TipTap-sanitized HTML.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Container>
  );
}

function ImageBlock({ block }: { block: Block }) {
  const src = p<string>(block.props, "src", "");
  const alt = p<string>(block.props, "alt", "");
  const caption = p<string | undefined>(block.props, "caption", undefined);
  const width = p<"full" | "wide" | "normal">(block.props, "width", "normal");
  const widths = { full: 1400, wide: 1100, normal: 880 };
  const max = widths[width] ?? 880;
  if (!src) return null;
  return (
    <div style={{ ...applyStyle(block.style), width: "100%" }}>
      <figure style={{ maxWidth: max, margin: "0 auto", padding: "0 24px" }}>
        <img src={src} alt={alt} style={{ width: "100%", borderRadius: 12, display: "block" }} />
        {caption && (
          <figcaption style={{ fontSize: 13, color: MUTED, marginTop: 10, textAlign: "center" }}>{caption}</figcaption>
        )}
      </figure>
    </div>
  );
}

function VideoBlock({ block }: { block: Block }) {
  const url = p<string>(block.props, "url", "");
  if (!url) return null;
  const embed = buildEmbedUrl(url, { autoplay: false });
  return (
    <Container block={block}>
      <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 12, overflow: "hidden", background: "#000" }}>
        <iframe
          src={embed}
          title="Embedded video"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </Container>
  );
}

function MetricsGridBlock({ block }: { block: Block }) {
  const items = p<Array<{ value: string; label: string }>>(block.props, "items", []);
  if (!items.length) return null;
  return (
    <Container block={block}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`, gap: 16 }}>
        {items.map((m, i) => (
          <div key={i} style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 12, padding: "22px 18px" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: SLATE, letterSpacing: "-0.01em" }}>{m.value}</div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </Container>
  );
}

function BulletListBlock({ block }: { block: Block }) {
  const items = p<string[]>(block.props, "items", []);
  const variant = p<"check" | "dot">(block.props, "style", "check");
  if (!items.length) return null;
  return (
    <Container block={block}>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 0", fontSize: 16, color: TEXT }}>
            <span style={{ color: GOLD, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>{variant === "check" ? "✓" : "•"}</span>
            <span style={{ lineHeight: 1.6 }}>{it}</span>
          </li>
        ))}
      </ul>
    </Container>
  );
}

function TestimonialBlock({ block }: { block: Block }) {
  const quote = p<string>(block.props, "quote", "");
  const author = p<string>(block.props, "author", "");
  const role = p<string | undefined>(block.props, "role", undefined);
  if (!quote) return null;
  return (
    <Container block={block}>
      <blockquote style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 14, padding: "30px 28px", margin: 0 }}>
        <p style={{ fontSize: 20, lineHeight: 1.55, color: SLATE, margin: 0, fontStyle: "italic" }}>"{quote}"</p>
        <footer style={{ marginTop: 18, fontSize: 14, color: MUTED }}>
          <strong style={{ color: TEXT }}>{author}</strong>
          {role && <span> · {role}</span>}
        </footer>
      </blockquote>
    </Container>
  );
}

function TagListBlock({ block }: { block: Block }) {
  const items = p<string[]>(block.props, "items", []);
  const label = p<string | undefined>(block.props, "label", undefined);
  if (!items.length) return null;
  return (
    <Container block={block}>
      {label && (
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, margin: "0 0 10px 0" }}>
          {label}
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((t, i) => (
          <span key={i} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 999, background: CARD, border: `1px solid ${RULE}`, color: SLATE }}>{t}</span>
        ))}
      </div>
    </Container>
  );
}

function GalleryBlock({ block }: { block: Block }) {
  const images = p<string[]>(block.props, "images", []);
  const cols = p<number>(block.props, "columns", 2);
  if (!images.length) return null;
  return (
    <Container block={block}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }}>
        {images.map((src, i) => (
          <img key={i} src={src} alt="" style={{ width: "100%", borderRadius: 10, display: "block" }} />
        ))}
      </div>
    </Container>
  );
}

function DividerBlock({ block }: { block: Block }) {
  return (
    <Container block={block}>
      <hr style={{ border: 0, borderTop: `1px solid ${RULE}`, margin: 0 }} />
    </Container>
  );
}

function SpacerBlock({ block }: { block: Block }) {
  const size = p<"sm" | "md" | "lg" | "xl">(block.props, "size", "md");
  const heights = { sm: 16, md: 32, lg: 64, xl: 96 };
  return <div style={{ height: heights[size] ?? 32 }} aria-hidden />;
}

function ButtonBlock({ block }: { block: Block }) {
  const label = p<string>(block.props, "label", "");
  const href = p<string>(block.props, "href", "#");
  const variant = p<"primary" | "secondary">(block.props, "variant", "primary");
  const primary = variant === "primary";
  return (
    <Container block={block}>
      <a
        href={href}
        style={{
          display: "inline-block",
          padding: "12px 22px",
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 700,
          textDecoration: "none",
          background: primary ? SLATE : "transparent",
          color: primary ? BG : SLATE,
          border: `1px solid ${SLATE}`,
        }}
      >
        {label}
      </a>
    </Container>
  );
}

function ColumnsBlock({ block }: { block: Block }) {
  // Phase 4 will fully implement editing for columns. For Phase 1 we just
  // render whatever is provided so existing payloads don't break.
  const cols = p<Block[][]>(block.props, "columns", []);
  const gap = p<number>(block.props, "gap", 24);
  if (!cols.length) return null;
  return (
    <Container block={block}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, 1fr)`, gap }}>
        {cols.map((col, i) => (
          <div key={i}>
            {col.map((b) => <RenderOne key={b.id} block={b} />)}
          </div>
        ))}
      </div>
    </Container>
  );
}

function RenderOne({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":      return <HeadingBlock block={block} />;
    case "paragraph":    return <ParagraphBlock block={block} />;
    case "image":        return <ImageBlock block={block} />;
    case "video":        return <VideoBlock block={block} />;
    case "metricsGrid":  return <MetricsGridBlock block={block} />;
    case "bulletList":   return <BulletListBlock block={block} />;
    case "testimonial":  return <TestimonialBlock block={block} />;
    case "tagList":      return <TagListBlock block={block} />;
    case "gallery":      return <GalleryBlock block={block} />;
    case "divider":      return <DividerBlock block={block} />;
    case "spacer":       return <SpacerBlock block={block} />;
    case "button":       return <ButtonBlock block={block} />;
    case "columns":      return <ColumnsBlock block={block} />;
    default:
      // Unknown block type: render nothing rather than breaking the page.
      return null;
  }
}

export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {blocks.map((b, i) => (
        <div key={b.id ?? i} style={{ padding: "20px 0" }}>
          <RenderOne block={b} />
        </div>
      ))}
    </div>
  );
}
