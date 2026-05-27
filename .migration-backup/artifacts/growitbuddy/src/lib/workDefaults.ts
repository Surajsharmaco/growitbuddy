export interface ClientLogo {
  id: number;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  link: string;
  enabled: boolean;
  createdAt: string;
}

export interface WorkItemStat { label: string; value: string; }

export interface WorkItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  metric: string;
  metricLabel: string;
  description: string;
  tags: string[];
  stats: WorkItemStat[];
  imageUrl: string;
}

export interface WorkHeroStat {
  eyebrow: string;
  value: string;
  valueLabel: string;
  headline: string;
  description: string;
}

export interface WorkData {
  headline: string;
  subtext: string;
  heroStats: WorkHeroStat[];
  items: WorkItem[];
}

export const WORK_DEFAULTS: WorkData = {
  headline: "Proof of authority at scale.",
  subtext: "Real systems. Real execution. Real outcomes.",
  heroStats: [
    {
      eyebrow: "Multi-Channel · Content Networks",
      value: "700M+",
      valueLabel: "views generated",
      headline: "Built large-scale visibility across content ecosystems through consistent high-volume distribution systems.",
      description: "Distributed content across platforms and campaigns to generate massive organic reach.",
    },
    {
      eyebrow: "Services · Authority System",
      value: "200+",
      valueLabel: "founders & brands served",
      headline: "Built authority systems for founders, creators, and modern internet brands.",
      description: "Positioned creators and businesses into recognized voices within their niche.",
    },
    {
      eyebrow: "Content Engine · High Volume",
      value: "90K+",
      valueLabel: "content assets created",
      headline: "Executed high-volume content production at scale across multiple platforms.",
      description: "Consistent output across short-form, long-form, platform-native, and distribution-first formats.",
    },
  ],
  items: [
    { id: "1", title: "Built a SaaS founder into an industry voice", subtitle: "LinkedIn Authority Campaign", category: "B2B SaaS · LinkedIn", metric: "14M+", metricLabel: "impressions", description: "From zero presence to recognized authority in 6 months.", tags: [], stats: [], imageUrl: "" },
    { id: "2", title: "Agency owner authority engine", subtitle: "Multi-channel content strategy", category: "Services · Multi-channel", metric: "$2.4M", metricLabel: "inbound pipeline", description: "A systematic content strategy and distribution system drove inbound pipeline that exceeded prior annual revenue.", tags: [], stats: [], imageUrl: "" },
    { id: "3", title: "Creator monetization system", subtitle: "YouTube authority build", category: "Creator Economy · YouTube", metric: "250K", metricLabel: "subscribers", description: "A content strategy built around a proprietary framework compounded into 250K subscribers.", tags: [], stats: [], imageUrl: "" },
    { id: "4", title: "Executive personal brand", subtitle: "Podcast & PR strategy", category: "Leadership · Podcast & PR", metric: "15+", metricLabel: "speaking invites / qtr", description: "Personal branding strategy turned a quiet operator into a recognized industry thought leader with consistent media placement.", tags: [], stats: [], imageUrl: "" },
    { id: "5", title: "E-commerce founder growth", subtitle: "X / Twitter brand build", category: "E-commerce · X / Twitter", metric: "400%", metricLabel: "branded search growth", description: "A personal brand-first content marketing approach made this founder synonymous with their product category.", tags: [], stats: [], imageUrl: "" },
    { id: "6", title: "VC authority engine", subtitle: "LinkedIn positioning", category: "Finance · LinkedIn", metric: "3x", metricLabel: "deal flow growth", description: "Content strategy and personal branding positioned this venture firm as the category expert.", tags: [], stats: [], imageUrl: "" },
  ],
};
