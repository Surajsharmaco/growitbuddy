import { useEffect, useState } from "react";

/**
 * Subscribes to body[data-gb-preview] — set by AdminPageBar's "Preview as
 * visitor" toggle. Inline-edit components read this to suppress chrome
 * (outlines, control bars, contentEditable) so the admin sees exactly what
 * visitors see without having to log out.
 */
export function usePreviewMode(): boolean {
  const [preview, setPreview] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.body.dataset.gbPreview === "1";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const read = () => setPreview(document.body.dataset.gbPreview === "1");
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.body, { attributes: true, attributeFilter: ["data-gb-preview"] });
    return () => obs.disconnect();
  }, []);

  return preview;
}
