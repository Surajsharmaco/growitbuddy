import { createHash } from "crypto";

// Cloudinary's canonical config is the CLOUDINARY_URL string:
//   cloudinary://<api_key>:<api_secret>@<cloud_name>
// When present it is authoritative (avoids field-mismatch mistakes); we fall
// back to the individual CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET vars.
// Discard placeholder/masked values (e.g. "<your_api_key>") so they never
// override a real value coming from the individual env vars.
function clean(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const t = v.trim();
  if (!t || t.includes("<") || t.includes(">")) return undefined;
  return t;
}

function parseCloudinaryUrl(): { cloud?: string; key?: string; secret?: string } {
  let url = process.env.CLOUDINARY_URL;
  if (!url) return {};
  url = url.trim().replace(/^CLOUDINARY_URL\s*=\s*/i, "").trim();
  const m = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!m) return {};
  return { key: clean(m[1]), secret: clean(m[2]), cloud: clean(m[3]) };
}

const parsed = parseCloudinaryUrl();
const CLOUD = parsed.cloud ?? clean(process.env.CLOUDINARY_CLOUD_NAME);
const KEY = parsed.key ?? clean(process.env.CLOUDINARY_API_KEY);
const SECRET = parsed.secret ?? clean(process.env.CLOUDINARY_API_SECRET);

export function cloudinaryConfigured(): boolean {
  return Boolean(CLOUD && KEY && SECRET);
}

export type CloudinaryUploadResult = { url: string; publicId: string };

export async function uploadToCloudinary(
  buffer: Buffer,
  mimetype: string,
  opts: { folder?: string; publicId?: string; overwrite?: boolean } = {},
): Promise<CloudinaryUploadResult> {
  if (!CLOUD || !KEY || !SECRET) throw new Error("Cloudinary not configured");

  const folder = opts.folder ?? "growitbuddy/media";
  const timestamp = Math.floor(Date.now() / 1000);

  const signParams: Record<string, string> = { folder, timestamp: String(timestamp) };
  if (opts.publicId) signParams.public_id = opts.publicId;
  if (opts.overwrite) signParams.overwrite = "true";

  const toSign = Object.keys(signParams)
    .sort()
    .map((k) => `${k}=${signParams[k]}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + SECRET).digest("hex");

  const dataUri = `data:${mimetype};base64,${buffer.toString("base64")}`;
  const form = new FormData();
  form.append("file", dataUri);
  form.append("api_key", KEY);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  if (opts.publicId) form.append("public_id", opts.publicId);
  if (opts.overwrite) form.append("overwrite", "true");
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/auto/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as { secure_url: string; public_id: string };
  return { url: json.secure_url, publicId: json.public_id };
}
