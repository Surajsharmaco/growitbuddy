---
name: GrowitBuddy dynamic-page SEO & error containment
description: Where dynamic-page SEO lives, what's noindex by design, and the global error boundary contract.
---

# Dynamic-page SEO & robustness

- **Case studies** (`/portfolio/:category/case/:id`) emit SEO **client-side** via `<SEOMeta>` (CreativeWork JSON-LD + canonical) in CaseStudy.tsx. Like all SEO, crawlers see it server-side only after the prebuilt `api/render.js` is regenerated — see `growitbuddy-ssr-prebuilt.md`. Don't assume editing the page alone updates what Googlebot sees.
- **Shared portfolio links** (`/portfolio/shared/...`) are `noindex,follow` **by design** (private share URLs); canonical still points to the public non-shared case URL. Keep new share routes noindex.
- **There is NO `/influencers/:slug` route** — influencer profiles are a grid on `/influencers`, not separate pages. An explore subagent once hallucinated this route; don't add sitemap/JSON-LD for it.
- **Global error containment:** `RouteErrorBoundary` (src/components/ErrorBoundary.tsx) wraps the public page Switch (inside Layout) and AdminGuard content. It is **route-keyed** (resets on navigation). A single component crash shows a graceful fallback with site chrome intact instead of a white screen.

**Why:** the site's "sometimes everything breaks" perception came largely from unguarded crashes blanking the whole SPA and a broken (white-on-white) 404. The boundary + on-theme noindex 404 fix this.
