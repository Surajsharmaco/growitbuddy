export const SHARED_CONTENT_SECTIONS = [
  "navbar",
  "footer",
  "settings",
  "page_visibility",
] as const;

const CONTENT_SECTION_BY_SLUG: Record<string, string[]> = {
  insights: ["blog"],
  career: ["fulltime", "internship", "freelancers"],
  distribution: ["distribution-network", "distribution-pages"],
  influencers: ["influencer-explore"],
  join: ["joinnetwork"],
  creators: ["creators-form"],
  "join-page-owner": ["page-owner-form"],
  "designers-pool": ["pool-designers"],
  "thumbnail-designers": ["pool-thumbnail-designers"],
  "writers-pool": ["pool-writers"],
  "social-media-managers": ["pool-social-managers"],
  "motion-designers": ["pool-motion-designers"],
  "ai-creators": ["pool-ai-creators"],
  "ugc-creators": ["pool-ugc-creators"],
  "meme-designers": ["pool-meme-designers"],
  "video-editors": ["pool-editors"],
};

export function sectionsForSlug(slug: string): string[] {
  return Array.from(
    new Set([slug, ...(CONTENT_SECTION_BY_SLUG[slug] ?? []), ...SHARED_CONTENT_SECTIONS]),
  );
}