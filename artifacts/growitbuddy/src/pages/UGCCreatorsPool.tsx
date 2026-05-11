import TalentPoolPage, { type PoolConfig } from "./TalentPoolPage";

const config: PoolConfig = {
  sectionKey: "pool-ugc-creators",
  poolType: "ugc-creators",
  formVariant: "ugc",
  defaults: {
    eyebrow: "UGC CREATORS NETWORK",
    headline: "Create authentic content that converts.",
    description: "Become part of our UGC creator network for future brand collaborations, product campaigns, and creator-first partnerships.",
    opportunityText: "Brands are moving away from polished ads and toward authentic creator content. We collaborate with UGC creators who know how to build trust on camera.",
    ctaPrimary: "Submit Your Content",
    ctaSecondary: "View Resources",
    videoUrl: "",
    heroTrustText: "We build long-term creator relationships inside the GrowitBuddy brand ecosystem.",
    stepsTitle: "How it works.",
    steps: [
      { number: "01", title: "Watch the Overview",   desc: "Understand what types of UGC content brands are looking for." },
      { number: "02", title: "Access the Guidelines", desc: "Download brand guidelines, shot examples, and sample scripts." },
      { number: "03", title: "Submit Your Content",  desc: "Share your social profiles and a sample content link." },
      { number: "04", title: "Join the Network",     desc: "Get added for future brand collaborations and campaigns." },
    ],
    resourcesTitle: "UGC Resources & Brand Guidelines",
    resourcesSubtext: "Shot references, scripts, and brand requirements to help you create the right content.",
    resources: [
      { id: "1", title: "UGC References",     desc: "Examples of high-performing UGC across different niches.",     link: "", btnLabel: "Open" },
      { id: "2", title: "Brand Guidelines",   desc: "What brands typically look for in UGC collaborations.",         link: "", btnLabel: "Open" },
      { id: "3", title: "Shot Examples",      desc: "Visual references for framing, lighting, and delivery.",        link: "", btnLabel: "Download" },
      { id: "4", title: "Sample Scripts",     desc: "Hook structures and script frameworks for product videos.",     link: "", btnLabel: "Download" },
    ],
    formTitle: "Submit Your Content",
    formSubtext: "Share your social profiles and a sample content link so we can understand your style.",
    formDisclaimer: "Submitting adds you to our internal UGC creator network. We reach out when brand projects are a good fit.",
    formNotifyEmail: "",
    finalHeadline: "Ready to create with us?",
    finalSubtext: "Submit your content and join the growing GrowitBuddy UGC creator network.",
    finalCtaPrimary: "Submit Your Content",
    seoTitle: "UGC Creators Network - GrowitBuddy",
    seoDesc: "Join the GrowitBuddy UGC creator network. Access brand guidelines, submit your content, and collaborate on future brand campaigns.",
  },
};

export default function UGCCreatorsPool() {
  return <TalentPoolPage config={config} />;
}
