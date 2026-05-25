// Single source of truth for portfolio categories.
// Used by Portfolio.tsx (public), AdminPortfolio.tsx (item editor),
// and AdminPortfolioShares.tsx (share-link builder). When you rename or
// reorder a category here, all three stay in sync automatically.

export const PORTFOLIO_CATEGORIES = [
  "Personal Branding",
  "Content Creation",
  "Long-Form Editing",
  "Short-Form Editing",
  "Graphics",
  "Social Media Management",
  "Distribution & Growth",
  "Web & Funnel Systems",
  "AI Automation",
  "Digital Products & Growth",
] as const;

export type PortfolioCategory = typeof PORTFOLIO_CATEGORIES[number];
