import { useEffect } from "react";

const SITE      = "https://growitbuddy.com";
const DEFAULT_IMAGE = `${SITE}/opengraph.jpg`;
const SITE_NAME = "GrowitBuddy";
const TWITTER   = "@growitbuddy";

export interface SEOMetaProps {
  title: string;
  description: string;
  robots?:   string;
  ogImage?:  string;
  ogType?:   "website" | "article";
  canonical?: string;
  schema?:   Record<string, unknown> | Record<string, unknown>[];
}

function setMeta(selector: string, keyAttr: string, keyVal: string, content: string) {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(keyAttr, keyVal);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export default function SEOMeta({
  title,
  description,
  robots  = "index,follow",
  ogImage,
  ogType  = "website",
  canonical,
  schema,
}: SEOMetaProps) {
  const pageUrl = canonical ?? `${SITE}${window.location.pathname}`;
  const imgUrl  = ogImage
    ? (ogImage.startsWith("http") ? ogImage : `${SITE}${ogImage}`)
    : DEFAULT_IMAGE;

  useEffect(() => {
    document.title = title;

    setMeta('meta[name="description"]',         "name",     "description",     description);
    setMeta('meta[name="robots"]',              "name",     "robots",          robots);
    setMeta('meta[name="author"]',              "name",     "author",          SITE_NAME);

    setMeta('meta[property="og:title"]',        "property", "og:title",        title);
    setMeta('meta[property="og:description"]',  "property", "og:description",  description);
    setMeta('meta[property="og:url"]',          "property", "og:url",          pageUrl);
    setMeta('meta[property="og:type"]',         "property", "og:type",         ogType);
    setMeta('meta[property="og:image"]',        "property", "og:image",        imgUrl);
    setMeta('meta[property="og:image:width"]',  "property", "og:image:width",  "1200");
    setMeta('meta[property="og:image:height"]', "property", "og:image:height", "630");
    setMeta('meta[property="og:site_name"]',    "property", "og:site_name",    SITE_NAME);

    setMeta('meta[name="twitter:card"]',        "name", "twitter:card",        "summary_large_image");
    setMeta('meta[name="twitter:title"]',       "name", "twitter:title",       title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMeta('meta[name="twitter:image"]',       "name", "twitter:image",       imgUrl);
    setMeta('meta[name="twitter:site"]',        "name", "twitter:site",        TWITTER);

    setLink("canonical", pageUrl);

    const schemaId = "gb-jsonld";
    let script = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (schema) {
      if (!script) {
        script = document.createElement("script");
        script.id   = schemaId;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      const nodes = Array.isArray(schema) ? schema : [schema];
      script.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });
    } else {
      script?.remove();
    }
  }, [title, description, robots, pageUrl, imgUrl, ogType, schema]);

  return null;
}
