import { Storage } from "@google-cloud/storage";
import { logger } from "./logger";

const REPLIT_SIDECAR = "http://127.0.0.1:1106";

export const GCS_BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "";
export const GCS_ENABLED = !!GCS_BUCKET_ID && !(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);
export const GCS_MEDIA_PREFIX = "media";

export let gcsClient: Storage | null = null;

if (GCS_ENABLED) {
  gcsClient = new Storage({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    credentials: {
      audience: "replit",
      subject_token_type: "access_token",
      token_url: `${REPLIT_SIDECAR}/token`,
      type: "external_account",
      credential_source: {
        url: `${REPLIT_SIDECAR}/credential`,
        format: { type: "json", subject_token_field_name: "access_token" },
      },
      universe_domain: "googleapis.com",
    } as any,
    projectId: "",
  });
  logger.info("GCS (Replit Object Storage) media storage enabled");
}

export function getApiBaseUrl(): string {
  const domain = (process.env.REPLIT_DOMAINS || "").split(",")[0]?.trim() || "";
  return domain ? `https://${domain}` : "";
}
