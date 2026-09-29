import sharp from "sharp";

export type ConvertFormat = "webp" | "avif";

const TARGET_MIME: Record<ConvertFormat, string> = {
  webp: "image/webp",
  avif: "image/avif",
};

// Require at least this fractional size reduction before we bother replacing the
// original. Avoids re-encoding churn when the result is the same size or larger.
const MIN_IMPROVEMENT = 0.02;

export interface ConvertSuccess {
  ok: true;
  buffer: Buffer;
  mimetype: string;
  width?: number;
  height?: number;
}
export interface ConvertSkip {
  ok: false;
  reason: string;
}
export type ConvertResult = ConvertSuccess | ConvertSkip;

/**
 * Optimize new static raster uploads at full resolution. Keep tiny/already
 * efficient originals when AVIF would make the file larger; never re-encode
 * AVIF, vector graphics, animation or video.
 */
export async function prepareUploadedImage(
  input: Buffer,
  mimetype: string,
): Promise<{ buffer: Buffer; mimetype: string }> {
  const original = { buffer: input, mimetype };
  const mt = mimetype.toLowerCase();
  if (!mt.startsWith("image/") || mt === "image/svg+xml" || mt === "image/gif" || mt === "image/avif") return original;

  const meta = await sharp(input, { limitInputPixels: 80_000_000 }).metadata();
  if ((meta.pages ?? 1) > 1) return original;

  const encode = (quality: number) =>
    sharp(input, { limitInputPixels: 80_000_000 })
      .rotate()
      .avif({ quality, effort: 6, chromaSubsampling: "4:4:4" })
      .toBuffer();
  let output = await encode(82);
  if (output.length >= input.length) {
    const smaller = await encode(76);
    if (smaller.length < output.length) output = smaller;
  }
  return output.length < input.length
    ? { buffer: output, mimetype: "image/avif" }
    : original;
}

/**
 * Re-encode a raster image to WebP or AVIF at high (near-lossless) quality.
 * Dimensions are preserved (never resized/upscaled) and metadata is stripped.
 * Returns a skip result for vectors, animations, videos, unreadable input, or
 * when the encoded output would not be meaningfully smaller than the original.
 */
export async function convertImageBuffer(
  input: Buffer,
  format: ConvertFormat,
  mimetype: string,
): Promise<ConvertResult> {
  const mt = (mimetype || "").toLowerCase();
  if (mt.startsWith("video/")) return { ok: false, reason: "video file — not an image" };
  if (mt === "image/svg+xml" || mt.includes("svg")) {
    return { ok: false, reason: "SVG is a vector — already tiny, skipped" };
  }

  let meta: sharp.Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: 80_000_000 }).metadata();
  } catch {
    return { ok: false, reason: "unreadable or unsupported image" };
  }
  if ((meta.pages ?? 1) > 1) {
    return { ok: false, reason: "animated image — skipped" };
  }

  let out: Buffer;
  try {
    const pipeline = sharp(input, { limitInputPixels: 80_000_000 }).rotate();
    if (format === "webp") {
      out = await pipeline
        .webp({ quality: 84, effort: 6, smartSubsample: true, alphaQuality: 90 })
        .toBuffer();
    } else {
      out = await pipeline
        .avif({ quality: 80, effort: 6, chromaSubsampling: "4:4:4" })
        .toBuffer();
    }
  } catch {
    return { ok: false, reason: "conversion failed" };
  }

  if (out.length >= input.length * (1 - MIN_IMPROVEMENT)) {
    return { ok: false, reason: "already optimal — no meaningful size gain" };
  }

  return {
    ok: true,
    buffer: out,
    mimetype: TARGET_MIME[format],
    width: meta.width,
    height: meta.height,
  };
}
