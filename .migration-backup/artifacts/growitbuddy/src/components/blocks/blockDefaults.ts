import type { Block, BlockType } from "./BlockRenderer";

function uid(): string {
  return `b_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function makeBlock(type: BlockType): Block {
  switch (type) {
    case "heading":
      return { id: uid(), type, props: { level: 2, text: "New heading", eyebrow: "" } };
    case "paragraph":
      return { id: uid(), type, props: { html: "Write your paragraph here. Click to edit." } };
    case "image":
      return { id: uid(), type, props: { src: "", alt: "", caption: "", width: "normal" } };
    case "video":
      return { id: uid(), type, props: { url: "" } };
    case "metricsGrid":
      return { id: uid(), type, props: { items: [
        { value: "+200%", label: "Growth" },
        { value: "10x", label: "Output" },
        { value: "−60%", label: "Time" },
      ] } };
    case "bulletList":
      return { id: uid(), type, props: { style: "check", items: ["First point", "Second point", "Third point"] } };
    case "testimonial":
      return { id: uid(), type, props: { quote: "They delivered far beyond expectations.", author: "Client Name", role: "Founder" } };
    case "tagList":
      return { id: uid(), type, props: { label: "Tools / Stack", items: ["Figma", "Notion", "Adobe"] } };
    case "gallery":
      return { id: uid(), type, props: { columns: 2, images: [] } };
    case "divider":
      return { id: uid(), type, props: {} };
    case "spacer":
      return { id: uid(), type, props: { size: "md" } };
    case "button":
      return { id: uid(), type, props: { label: "Click me", href: "#", variant: "primary" } };
    case "columns":
      return { id: uid(), type, props: { gap: 24, columns: [[], []] } };
  }
}

// Convert legacy CaseStudyData → Block[] so an admin can click "Convert to
// inline editor" on any existing case study and immediately start editing
// in the Wix-style surface without losing content.
export function legacyToBlocks(cs: Record<string, unknown> | null | undefined, title: string): Block[] {
  const blocks: Block[] = [];
  const out = (b: Block) => blocks.push(b);

  out({ id: uid(), type: "heading", props: { level: 1, text: title || "Case Study", eyebrow: (cs?.clientName as string) || "" } });

  if (cs?.heroImageUrl || cs?.coverImageUrl) {
    out({ id: uid(), type: "image", props: { src: (cs?.heroImageUrl ?? cs?.coverImageUrl) as string, alt: title, width: "wide" } });
  }
  if (cs?.videoUrl) out({ id: uid(), type: "video", props: { url: cs.videoUrl as string } });

  if (cs?.overview) {
    out({ id: uid(), type: "heading", props: { level: 2, text: "Overview", eyebrow: "01" } });
    out({ id: uid(), type: "paragraph", props: { html: String(cs.overview).replace(/\n/g, "<br/>") } });
  }
  if (cs?.challenge) {
    out({ id: uid(), type: "heading", props: { level: 2, text: "Challenge", eyebrow: "02" } });
    out({ id: uid(), type: "paragraph", props: { html: String(cs.challenge).replace(/\n/g, "<br/>") } });
  }
  if (cs?.approach) {
    out({ id: uid(), type: "heading", props: { level: 2, text: "Approach", eyebrow: "03" } });
    out({ id: uid(), type: "paragraph", props: { html: String(cs.approach).replace(/\n/g, "<br/>") } });
    const bullets = Array.isArray(cs?.approachBullets) ? (cs.approachBullets as string[]).filter(Boolean) : [];
    if (bullets.length) out({ id: uid(), type: "bulletList", props: { style: "check", items: bullets } });
  }
  if (cs?.solution) {
    out({ id: uid(), type: "heading", props: { level: 2, text: "Solution", eyebrow: "04" } });
    out({ id: uid(), type: "paragraph", props: { html: String(cs.solution).replace(/\n/g, "<br/>") } });
  }

  const metrics = Array.isArray(cs?.metrics) ? (cs.metrics as Array<{ value: string; label: string }>).filter(m => m && (m.value || m.label)) : [];
  if (metrics.length) {
    out({ id: uid(), type: "heading", props: { level: 2, text: "Results", eyebrow: "05" } });
    out({ id: uid(), type: "metricsGrid", props: { items: metrics } });
  }

  const gallery = Array.isArray(cs?.galleryImages) ? (cs.galleryImages as string[]).filter(Boolean) : [];
  if (gallery.length) {
    out({ id: uid(), type: "gallery", props: { columns: gallery.length >= 3 ? 3 : 2, images: gallery } });
  }

  const t = cs?.testimonial as { quote?: string; author?: string } | undefined;
  if (t?.quote) out({ id: uid(), type: "testimonial", props: { quote: t.quote, author: t.author || "", role: "" } });

  const stack = Array.isArray(cs?.stack) ? (cs.stack as string[]).filter(Boolean) : [];
  if (stack.length) out({ id: uid(), type: "tagList", props: { label: "Tools / Stack", items: stack } });

  return blocks;
}

export const ADDABLE_BLOCKS: Array<{ type: BlockType; label: string; icon: string }> = [
  { type: "heading",     label: "Heading",        icon: "H" },
  { type: "paragraph",   label: "Paragraph",      icon: "¶" },
  { type: "image",       label: "Image",          icon: "🖼" },
  { type: "video",       label: "Video",          icon: "▶" },
  { type: "metricsGrid", label: "Metrics grid",   icon: "▦" },
  { type: "bulletList",  label: "Bullet list",    icon: "•" },
  { type: "testimonial", label: "Testimonial",    icon: "❝" },
  { type: "tagList",     label: "Tags",           icon: "#" },
  { type: "gallery",     label: "Gallery",        icon: "▥" },
  { type: "button",      label: "Button",         icon: "▭" },
  { type: "divider",     label: "Divider",        icon: "—" },
  { type: "spacer",      label: "Spacer",         icon: "↕" },
];
