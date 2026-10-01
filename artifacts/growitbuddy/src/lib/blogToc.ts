export const DEFAULT_TOC_VISIBLE = 5;

export function tocVisibleCount(value: unknown): number {
  const count = Number(value);
  return Number.isInteger(count) && count >= 1 && count <= 30 ? count : DEFAULT_TOC_VISIBLE;
}

const INLINE_TOC_SELECTOR = [
  ".wp-block-table-of-contents", ".ez-toc-container", "#ez-toc-container",
  ".lwptoc", ".toc_container", ".kb-table-of-content-nav",
  ".ub_table-of-contents", ".rank-math-toc", ".wp-block-rank-math-toc-block",
  ".rmp-toc", "#table-of-contents",
].join(", ");

/**
 * WordPress TOCs arrive as HTML, not React elements. Mark only the extra list
 * items as hidden, keeping every link and its original href in the HTML.
 * The article's delegated button handler changes expanded and re-renders.
 */
export function limitInlineToc(html: string, visibleCount: number, expanded: boolean): string {
  if (typeof DOMParser === "undefined" || !html) return html;
  const document = new DOMParser().parseFromString(html, "text/html");
  const containers = Array.from(document.body.querySelectorAll(INLINE_TOC_SELECTOR))
    .filter((element) => !element.parentElement?.closest(INLINE_TOC_SELECTOR));

  // Hand-authored TOCs use a heading followed by an anchor list.
  if (!containers.length) {
    const heading = Array.from(document.body.querySelectorAll("h2,h3,h4"))
      .find((element) => /^(?:table of contents|contents|on this page|in this article|jump to):?$/i.test(element.textContent?.trim() ?? ""));
    const list = heading?.nextElementSibling;
    if (list?.matches("ul,ol")) containers.push(list);
  }

  for (const [index, container] of containers.entries()) {
    const items = Array.from(container.querySelectorAll("li")).filter((li) =>
      Array.from(li.querySelectorAll('a[href*="#"]')).some((anchor) => anchor.closest("li") === li));
    if (items.length <= visibleCount) continue;

    items.forEach((li, itemIndex) => {
      if (itemIndex >= visibleCount) {
        li.setAttribute("data-gb-toc-extra", "");
        if (!expanded) li.setAttribute("hidden", "");
      }
    });
    if (!container.id) container.id = `gb-inline-toc-${index}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gb-toc-toggle";
    button.setAttribute("data-gb-toc-toggle", "");
    button.setAttribute("aria-controls", container.id);
    button.setAttribute("aria-expanded", String(expanded));
    button.textContent = expanded ? "Show Less" : `Show More (${items.length - visibleCount})`;
    if (container.matches("ul,ol")) container.insertAdjacentElement("afterend", button);
    else container.append(button);
  }
  return document.body.innerHTML;
}