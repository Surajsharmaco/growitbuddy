import DOMPurify from "dompurify";

/** Rich overview is presentation only; plain excerpt remains the SEO/card source. */
export function renderOverviewHtml(html: string): string {
  const safe = DOMPurify.sanitize(html);
  const doc = new DOMParser().parseFromString(safe, "text/html");
  // The post title remains the single H1, even if Heading 1 is used in the editor.
  doc.body.querySelectorAll("h1").forEach(heading => {
    const h2 = doc.createElement("h2");
    for (const attr of Array.from(heading.attributes)) h2.setAttribute(attr.name, attr.value);
    while (heading.firstChild) h2.appendChild(heading.firstChild);
    heading.replaceWith(h2);
  });
  return doc.body.innerHTML;
}
