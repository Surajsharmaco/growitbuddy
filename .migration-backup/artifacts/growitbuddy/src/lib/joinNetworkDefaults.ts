export interface JoinNetworkData {
  heroLabel: string;
  heroHeadline: string;
  heroSubtext: string;
  card1Num: string; card1Title: string; card1Subtitle: string; card1Desc: string; card1CTA: string;
  card2Num: string; card2Title: string; card2Subtitle: string; card2Desc: string; card2CTA: string;
  footerNote: string;
}

export const JOIN_NETWORK_DEFAULTS: JoinNetworkData = {
  heroLabel: "Join Our Network",
  heroHeadline: "Choose Your Path.",
  heroSubtext: "Two ways to become part of a growing ecosystem. Pick the one that fits you.",
  card1Num: "01",
  card1Title: "I'm an Influencer",
  card1Subtitle: "",
  card1Desc: "I create content on my personal profile, build an audience, and collaborate with brands.",
  card1CTA: "Continue as Influencer",
  card2Num: "02",
  card2Title: "I run Pages",
  card2Subtitle: "Meme / Theme Pages",
  card2Desc: "I manage one or more content pages with large audiences and help distribute content at scale.",
  card2CTA: "Continue as Page Owner",
  footerNote: "Not sure where you fit? Choose the closest option - we'll guide you from there.",
};
