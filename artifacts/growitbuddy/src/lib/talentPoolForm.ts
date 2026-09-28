export type PoolFormFieldType = "text" | "email" | "url" | "textarea";

export interface PoolFormField {
  key: string;
  label: string;
  placeholder: string;
  type: PoolFormFieldType;
  required: boolean;
  enabled: boolean;
}

const BASE_FIELDS: PoolFormField[] = [
  { key: "name", label: "Full Name", placeholder: "Your full name", type: "text", required: true, enabled: true },
  { key: "email", label: "Email Address", placeholder: "you@example.com", type: "email", required: true, enabled: true },
  { key: "contact", label: "Contact (WhatsApp / Telegram)", placeholder: "@handle or number", type: "text", required: true, enabled: true },
  {
    key: "notes",
    label: "Additional Notes",
    placeholder: "Anything specific you'd like us to know about your work or availability...",
    type: "textarea",
    required: false,
    enabled: true,
  },
];

const POOL_FIELDS: Record<string, PoolFormField[]> = {
  designers: [
    { key: "portfolio", label: "Behance / Dribbble", placeholder: "https://behance.net/...", type: "text", required: true, enabled: true },
    { key: "figma", label: "Figma Portfolio", placeholder: "https://figma.com/...", type: "text", required: false, enabled: true },
  ],
  thumbnail: [
    { key: "portfolio", label: "Portfolio Link", placeholder: "https://...", type: "text", required: true, enabled: true },
    { key: "link", label: "Submission Link", placeholder: "Google Drive / Dropbox with your thumbnail", type: "text", required: true, enabled: true },
  ],
  writers: [
    { key: "niche", label: "Writing Niche / Topics", placeholder: "e.g. Finance, Health, Creator Economy", type: "text", required: true, enabled: true },
    { key: "sample", label: "Writing Sample", placeholder: "https://docs.google.com/...", type: "text", required: true, enabled: true },
    { key: "linkedin", label: "LinkedIn Profile", placeholder: "https://linkedin.com/in/...", type: "text", required: false, enabled: true },
  ],
  social: [
    { key: "platforms", label: "Platforms Managed", placeholder: "e.g. Instagram, LinkedIn, TikTok", type: "text", required: true, enabled: true },
    { key: "portfolio", label: "Portfolio / Case Study", placeholder: "https://...", type: "text", required: true, enabled: true },
  ],
  motion: [
    { key: "tools", label: "Tools Used", placeholder: "e.g. After Effects, Rive, Cavalry", type: "text", required: true, enabled: true },
    { key: "reel", label: "Reel / Demo Link", placeholder: "https://...", type: "text", required: true, enabled: true },
  ],
  ai: [
    { key: "tools", label: "AI Tools Used", placeholder: "e.g. n8n, Make, OpenAI, Zapier", type: "text", required: true, enabled: true },
    { key: "example", label: "Automation Example", placeholder: "https://...", type: "text", required: true, enabled: true },
    { key: "loom", label: "Loom Walkthrough", placeholder: "https://loom.com/share/...", type: "text", required: false, enabled: true },
  ],
  ugc: [
    { key: "social", label: "Instagram / TikTok Handle", placeholder: "@yourhandle", type: "text", required: true, enabled: true },
    { key: "sample", label: "Content Sample Link", placeholder: "Drive / Dropbox / Link", type: "text", required: true, enabled: true },
    { key: "niche", label: "Brand Types / Niches", placeholder: "e.g. Skincare, Tech, Food", type: "text", required: false, enabled: true },
  ],
  editors: [
    { key: "tools", label: "Editing Software", placeholder: "e.g. Premiere Pro, DaVinci, Final Cut", type: "text", required: true, enabled: true },
    { key: "reel", label: "Reel / Showreel Link", placeholder: "https://...", type: "text", required: true, enabled: true },
    { key: "sample", label: "Sample Edit", placeholder: "Drive / YouTube / Frame.io link", type: "text", required: false, enabled: true },
  ],
  meme: [
    { key: "social", label: "Instagram / X Handle", placeholder: "@yourhandle", type: "text", required: true, enabled: true },
    { key: "portfolio", label: "Meme Portfolio Link", placeholder: "Drive / page / IG profile", type: "text", required: true, enabled: true },
    { key: "niche", label: "Niches You Cover", placeholder: "e.g. Finance, Pop culture", type: "text", required: false, enabled: true },
  ],
};

const VALID_TYPES = new Set<PoolFormFieldType>(["text", "email", "url", "textarea"]);
const RESERVED_KEYS = new Set(["type", "message", "notifyEmail", "formFields"]);
const VARIANT_BY_POOL_KEY: Record<string, string> = {
  "thumbnail-designers": "thumbnail",
  "social-managers": "social",
  "motion-designers": "motion",
  "ai-creators": "ai",
  "ugc-creators": "ugc",
  "meme-designers": "meme",
};

function normalizePoolKey(poolKey: string): string {
  const key = poolKey.startsWith("pool-") ? poolKey.slice("pool-".length) : poolKey;
  return VARIANT_BY_POOL_KEY[key] ?? key;
}

function getDefaults(poolKey: string): PoolFormField[] {
  const variantFields = POOL_FIELDS[normalizePoolKey(poolKey)] ?? [];
  return [...BASE_FIELDS.slice(0, 3), ...variantFields, BASE_FIELDS[3]].map(field => ({ ...field }));
}

/**
 * Returns the default fields for legacy pool content or safely normalizes an
 * admin-saved field list. A saved empty array is intentional; only name/email
 * are restored because lead delivery requires both.
 */
export function getPoolFormFields(poolKey: string, raw?: unknown): PoolFormField[] {
  const defaults = getDefaults(poolKey);
  if (raw === undefined) return defaults;
  if (!Array.isArray(raw)) {
    throw new Error("Saved talent-pool form fields must be an array.");
  }
  if (raw.length > 50) {
    throw new Error("Saved talent-pool form contains more than 50 fields.");
  }

  const defaultsByKey = new Map(defaults.map(field => [field.key, field]));
  const seen = new Set<string>();
  const fields: PoolFormField[] = [];

  for (const [index, item] of raw.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`Saved talent-pool form field ${index + 1} is malformed.`);
    }
    const candidate = item as Partial<PoolFormField>;
    const key = typeof candidate.key === "string" ? candidate.key : "";
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(key) || RESERVED_KEYS.has(key)) {
      throw new Error(`Saved talent-pool form field ${index + 1} has an invalid key.`);
    }
    if (!defaultsByKey.has(key) && !/^custom_[A-Za-z0-9_-]{1,56}$/.test(key)) {
      throw new Error(`Saved talent-pool form field "${key}" is not valid for this pool.`);
    }
    if (seen.has(key)) {
      throw new Error(`Saved talent-pool form contains duplicate field key "${key}".`);
    }
    if (typeof candidate.label !== "string" || !candidate.label.trim() || candidate.label.length > 120) {
      throw new Error(`Saved talent-pool form field "${key}" needs a label of 1–120 characters.`);
    }
    if (typeof candidate.placeholder !== "string" || candidate.placeholder.length > 240) {
      throw new Error(`Saved talent-pool form field "${key}" has an invalid placeholder.`);
    }
    if (typeof candidate.required !== "boolean" || typeof candidate.enabled !== "boolean") {
      throw new Error(`Saved talent-pool form field "${key}" has invalid required/visibility settings.`);
    }
    if (!VALID_TYPES.has(candidate.type as PoolFormFieldType)) {
      throw new Error(`Saved talent-pool form field "${key}" has an unsupported input type.`);
    }

    const type = candidate.type as PoolFormFieldType;
    if ((key === "name" && type !== "text") || (key === "email" && type !== "email")) {
      throw new Error(`Saved talent-pool form field "${key}" has a fixed input type and cannot be changed.`);
    }
    fields.push({
      key,
      label: candidate.label.trim(),
      placeholder: candidate.placeholder,
      type,
      required: key === "name" || key === "email"
        ? true
        : candidate.required,
      enabled: key === "name" || key === "email"
        ? true
        : candidate.enabled,
    });
    seen.add(key);
  }

  const missingMandatory = ["name", "email"]
    .filter(key => !seen.has(key))
    .map(key => defaultsByKey.get(key))
    .filter((field): field is PoolFormField => !!field);
  fields.unshift(...missingMandatory);

  return fields;
}