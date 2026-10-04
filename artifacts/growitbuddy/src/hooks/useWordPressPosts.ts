import type { BlogPost } from "@/data/blogPosts";

// WordPress is disconnected. Keep these compatibility exports for existing
// callers; CMS content remains authoritative and no external requests are made.
const disconnected = {
  posts: [] as BlogPost[],
  loading: false,
  imagesResolving: false,
  error: null,
};

export function useWordPressPosts(_enabled = true) {
  return disconnected;
}

export async function resolveWpFeaturedImages(_slugs: string[]): Promise<Record<string, string>> {
  return {};
}

export async function fetchWpPostBySlug(_slug: string): Promise<BlogPost | null> {
  return null;
}