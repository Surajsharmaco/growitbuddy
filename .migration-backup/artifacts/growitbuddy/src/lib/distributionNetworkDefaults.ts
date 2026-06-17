export interface DistNetAdvItem { label: string; desc: string; }
export interface DistNetStep { num: string; title: string; desc: string; }

export interface DistributionNetworkData {
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtext: string;
  heroCTA: string;
  advantageLabel: string;
  advantageHeadline: string;
  advantageSubtext: string;
  advantageItems: DistNetAdvItem[];
  hiwLabel: string;
  hiwHeadline: string;
  hiwSteps: DistNetStep[];
  ctaLabel: string;
  ctaHeadline: string;
  ctaSubtext: string;
  ctaButton: string;
}

export const DISTRIBUTION_NETWORK_DEFAULTS: DistributionNetworkData = {
  heroEyebrow: "Distribution Network",
  heroHeadline: "Plug Into High-Performing Distribution.",
  heroSubtext: "Access a curated network of meme and theme pages with millions of followers. Distribute your content at scale and reach the right audience faster.",
  heroCTA: "Run a Campaign",
  advantageLabel: "The Advantage",
  advantageHeadline: "What You Get",
  advantageSubtext: "Every page in our network is vetted for real engagement. You get access to distribution that actually converts.",
  advantageItems: [
    { label: "High-reach distribution",              desc: "Tap into pages with millions of engaged followers across every major niche." },
    { label: "Access to engaged audiences",          desc: "Not just followers - communities that interact, share, and act." },
    { label: "Faster visibility for your content",   desc: "Skip the slow ramp. Get in front of the right people from day one." },
    { label: "Scalable content amplification",       desc: "Run campaigns across multiple pages simultaneously for compound reach." },
  ],
  hiwLabel: "Process",
  hiwHeadline: "How It Works",
  hiwSteps: [
    { num: "01", title: "Choose your niche",            desc: "Filter by genre to find pages that match your target audience perfectly." },
    { num: "02", title: "Select relevant pages",        desc: "Browse vetted meme and theme pages by reach, country, and engagement." },
    { num: "03", title: "Run your campaign",            desc: "We coordinate content distribution across your selected pages simultaneously." },
    { num: "04", title: "Track reach and performance",  desc: "Get full reporting on reach, impressions, and campaign performance." },
  ],
  ctaLabel: "Ready to scale?",
  ctaHeadline: "Ready to Distribute at Scale?",
  ctaSubtext: "Leverage our network to get your content in front of the right audience. Fast, targeted, and measurable.",
  ctaButton: "Start a Campaign",
};
