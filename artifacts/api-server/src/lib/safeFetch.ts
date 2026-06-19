// ── SSRF-safe, size-capped, streaming fetch ──────────────────────────────────
// The backup features download images from URLs that ultimately come from
// UNTRUSTED sources: image URLs scraped out of external WordPress HTML and
// arbitrary `media_files.url` values in the database. A naive fetch of such URLs
// would let a malicious/compromised value point the server at internal/private
// network addresses (SSRF) or stream an unbounded body into memory.
//
// This helper:
//   • allows only http/https,
//   • blocks hosts that resolve to private / loopback / link-local / reserved IPs
//     (DNS is resolved and every returned address is checked),
//   • follows redirects MANUALLY, re-validating the host at every hop,
//   • preflights Content-Length and hard-caps the streamed body size,
// so a single response can never exceed the cap and can never reach an internal
// target.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function ipIsPrivate(ip: string): boolean {
  const fam = isIP(ip);
  if (fam === 4) {
    const p = ip.split(".").map(Number);
    if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
    if (p[0] === 10) return true; // private
    if (p[0] === 127) return true; // loopback
    if (p[0] === 0) return true; // "this" network
    if (p[0] === 169 && p[1] === 254) return true; // link-local
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true; // private
    if (p[0] === 192 && p[1] === 168) return true; // private
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true; // CGNAT
    if (p[0] >= 224) return true; // multicast / reserved
    return false;
  }
  if (fam === 6) {
    const lo = ip.toLowerCase().replace(/^\[|\]$/g, "");
    if (lo === "::1" || lo === "::") return true; // loopback / unspecified
    if (lo.startsWith("fe80")) return true; // link-local
    if (lo.startsWith("fc") || lo.startsWith("fd")) return true; // unique local
    if (lo.startsWith("::ffff:")) return ipIsPrivate(lo.slice(lo.lastIndexOf(":") + 1)); // IPv4-mapped
    return false;
  }
  return false; // not an IP literal — handled by DNS resolution
}

async function hostIsSafe(hostname: string): Promise<boolean> {
  const lower = hostname.toLowerCase().replace(/\.$/, "");
  if (!lower) return false;
  if (lower === "localhost" || lower.endsWith(".localhost") || lower.endsWith(".internal") || lower.endsWith(".local")) {
    return false;
  }
  if (isIP(hostname)) return !ipIsPrivate(hostname);
  try {
    const addrs = await lookup(hostname, { all: true });
    if (!addrs.length) return false;
    return addrs.every((a) => !ipIsPrivate(a.address));
  } catch {
    return false;
  }
}

export interface SafeFetchResult {
  bytes: Uint8Array;
  contentType: string;
  finalUrl: string;
}

export interface SafeFetchOptions {
  maxBytes: number;
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxRedirects?: number;
}

export async function safeFetchToBuffer(rawUrl: string, opts: SafeFetchOptions): Promise<SafeFetchResult | null> {
  const { maxBytes, headers = {}, timeoutMs = 20000, maxRedirects = 3 } = opts;
  let url = rawUrl;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!(await hostIsSafe(parsed.hostname))) return null;

    let res: Response;
    try {
      res = await fetch(url, { headers, redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
    } catch {
      return null;
    }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return null;
      try {
        url = new URL(loc, url).toString();
      } catch {
        return null;
      }
      continue; // re-validate the next host
    }

    if (!res.ok || !res.body) return null;
    const clen = Number(res.headers.get("content-length") || "0");
    if (clen && clen > maxBytes) return null;

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          try {
            await reader.cancel();
          } catch {
            /* already closed */
          }
          return null;
        }
        chunks.push(value);
      }
    }
    if (total === 0) return null;

    const bytes = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
      bytes.set(c, off);
      off += c.byteLength;
    }
    return { bytes, contentType: res.headers.get("content-type") || "", finalUrl: res.url || url };
  }

  return null; // too many redirects
}
