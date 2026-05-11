export interface FaqItem {
  question: string;
  answer: string;
}

export interface HowToStep {
  name: string;
  text: string;
}

export interface PostSeo {
  focusKeyword: string;
  secondaryKeywords: string;
  seoTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  noIndex: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  schemaType: "Article" | "BlogPosting" | "NewsArticle" | "TechArticle" | "Review" | "FAQ" | "HowTo" | "VideoObject" | "WebPage" | "None";
  faqItems: FaqItem[];
  howToSteps: HowToStep[];
  searchIntent: "informational" | "transactional" | "commercial" | "navigational" | "";
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tag: string;
  readTime?: string;
  content: string;
  featuredImage?: string;
  seo?: Partial<PostSeo>;
  status?: "draft" | "published";
  source?: "cms" | "wordpress";
}

export function defaultSeo(): PostSeo {
  return {
    focusKeyword: "",
    secondaryKeywords: "",
    seoTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    noIndex: false,
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    schemaType: "Article",
    faqItems: [],
    howToSteps: [],
    searchIntent: "",
  };
}

export const blogPosts: BlogPost[] = [
  {
    slug: "why-authority-compounds",
    title: "Why Authority Compounds (and Traffic Doesn't)",
    excerpt: "Most founders chase traffic. The smartest ones build authority - and discover it's the only asset that gets more valuable as you grow.",
    date: "April 10, 2026",
    tag: "Founders",
    readTime: "6 min read",
    featuredImage: "https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=800&h=450&fit=crop",
    content: `## The Traffic Trap\n\nEvery founder eventually discovers the traffic trap. You publish content, maybe even go viral once or twice, and then... nothing. The spike fades. You're back to square one.\n\nTraffic is rented. Authority is owned.\n\nWhen you build genuine authority in your space - when people know your name before they need your product - something remarkable happens. Every piece of content you create amplifies the last. Every podcast appearance opens two more. Every client win attracts three more.\n\n## What Authority Actually Means\n\nAuthority is not the same as popularity. It's **specific credibility in a specific domain** recognized by a specific audience.\n\nThe founder known as "the LinkedIn guy" has traffic. The founder known as "the person who redefined how Series A SaaS companies think about go-to-market" has authority.\n\nOne gets likes. The other closes deals from a DM.\n\n## The Compounding Mechanism\n\nAuthority compounds through four mechanisms:\n\n1. **Network trust transfer** - When someone with authority endorses you, their trust passes to you.\n2. **Search and discovery** - People find you when searching for expertise, not entertainment.\n3. **Premium positioning** - Authority justifies premium pricing without lengthy justification.\n4. **Inbound leverage** - The best opportunities come inbound when authority is established.\n\n## How to Start Building It\n\nStart with a single specific claim. Not "I help companies grow." Try: "I help bootstrapped B2B SaaS founders close their first 50 enterprise contracts without a sales team."\n\nSpecificity is the seed of authority. Everything else is distribution.`,
  },
  {
    slug: "content-system-not-content-creation",
    title: "Stop Creating Content. Start Building a Content System.",
    excerpt: "The difference between founders who burn out and those who compound isn't talent - it's whether they have a system or are improvising every week.",
    date: "April 3, 2026",
    tag: "Founders",
    readTime: "8 min read",
    featuredImage: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=450&fit=crop",
    content: `## The Improvisation Burnout Loop\n\nYou've been there: Sunday night, staring at a blank draft, needing to "post something" tomorrow. You write something mediocre, it gets 12 likes, and you feel like a fraud.\n\nThis is the improvisation loop. And it's the single biggest reason smart founders quit on content.\n\n## What a Content System Looks Like\n\nA content system has four components:\n\n### 1. Positioning Foundation\nBefore you produce a single piece, you need clarity on: Who are you talking to? What do you uniquely believe? What is the one outcome you help them achieve?\n\n### 2. The Content Engine\nThis is your repeatable production process.\n\n### 3. The Distribution Loop\nA system without distribution is a journal.\n\n### 4. The Feedback Layer\nTrack which content drives actual business outcomes.`,
  },
  {
    slug: "the-4-pillars-of-founder-authority",
    title: "The 4 Pillars of Founder Authority",
    excerpt: "After working with 200+ founders, we've identified the four pillars that separate recognized industry voices from well-kept secrets.",
    date: "March 27, 2026",
    tag: "Founders",
    readTime: "7 min read",
    featuredImage: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=450&fit=crop",
    content: `## Not All Content Builds Authority\n\nWe've analyzed the content output of hundreds of founders. Here's what we found: most content does not build authority. It builds noise.\n\n## Pillar 1: Distinctive Positioning\n\nAuthority begins with a point of view that is yours and only yours.\n\n## Pillar 2: Consistent Signal\n\nAuthority requires repetition of the same theme and worldview.\n\n## Pillar 3: Proof Architecture\n\nPositioning without proof is just opinion.\n\n## Pillar 4: Distribution Leverage\n\nThe best content that no one reads builds no authority.`,
  },
  {
    slug: "founder-brand-vs-company-brand",
    title: "Your Founder Brand is More Valuable Than Your Company Brand",
    excerpt: "Companies pivot, rebrand, and get acquired. Your personal authority travels with you forever.",
    date: "April 17, 2026",
    tag: "Brand",
    readTime: "6 min read",
    featuredImage: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=450&fit=crop",
    content: `## The Brand That Lasts\n\nMost founders invest heavily in building their company brand. But your personal brand moves with you through every chapter.\n\n## Why Founder-Led Content Outperforms Company Content\n\nFounder-authored content outperforms brand content by a factor of 5 to 10 in organic reach, engagement, and conversion.`,
  },
  {
    slug: "creator-monetization-without-millions",
    title: "How to Monetize Your Audience Before You Hit 10K Followers",
    excerpt: "You don't need a massive following to earn from your content. You need the right 500 people, the right offer, and a clear path from content to conversion.",
    date: "April 20, 2026",
    tag: "Creators",
    readTime: "7 min read",
    featuredImage: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=450&fit=crop",
    content: `## The Follower Count Myth\n\nEvery creator eventually gets told the same thing: "Grow the audience first. Monetize later." This advice is not just wrong. It's actively harmful.\n\n## The 500-Person Principle\n\nA specific, engaged audience of 500 people who see you as the person for one particular problem is worth more commercially than 50,000 general followers.`,
  },
];
