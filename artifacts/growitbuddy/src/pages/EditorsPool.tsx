import TalentPoolPage, { type PoolConfig } from "./TalentPoolPage";

const config: PoolConfig = {
  sectionKey: "pool-editors",
  poolType: "editors",
  formVariant: "editors",
  defaults: {
    eyebrow: "VIDEO EDITORS NETWORK",
    headline: "Edit content that builds creator authority.",
    description: "Join our video editor network and help founders and creators turn raw footage into high-retention long-form, shorts, and podcast edits.",
    opportunityText: "Great editors don't just cut clips - they shape narrative, pacing, and retention. We work with editors who think like storytellers, not button-pushers.",
    ctaPrimary: "Submit Your Reel",
    ctaSecondary: "View Resources",
    videoUrl: "",
    heroTrustText: "We build long-term creative relationships with video editors inside the GrowitBuddy creator ecosystem.",
    stepsTitle: "How it works.",
    steps: [
      { number: "01", title: "Watch the Overview",   desc: "Understand the type of video content we edit for creator brands." },
      { number: "02", title: "Access the References", desc: "Download editing style guides, retention principles, and templates." },
      { number: "03", title: "Submit Your Work",     desc: "Share your reel and a sample edit so we understand your style." },
      { number: "04", title: "Join the Network",     desc: "Get added for future long-form, shorts, and podcast editing projects." },
    ],
    resourcesTitle: "Editor Resources & Style Guides",
    resourcesSubtext: "References, project templates, and retention principles for high-performing creator video edits.",
    resources: [
      { id: "1", title: "Long-Form Editing Guide",  desc: "Pacing, B-roll, and retention principles for YouTube long-form.", link: "https://drive.google.com/drive/folders/1LongFormGuide_U2vW4xY6zA8bC0dE2fG4hI6jK8", btnLabel: "Open" },
      { id: "2", title: "Shorts Editing Templates", desc: "Premiere and CapCut templates for vertical short-form.",           link: "https://drive.google.com/drive/folders/1ShortsTemp_L0mN2oP4qR6sT8uV0wX2yZ4aB6cD8", btnLabel: "Download" },
      { id: "3", title: "Podcast Edit Checklist",    desc: "Audio cleanup, chapter markers, and clip extraction workflow.",    link: "https://drive.google.com/drive/folders/1PodcastCheck_E0fG2hI4jK6lM8nO0pQ2rS4tU6v", btnLabel: "Open" },
      { id: "4", title: "Retention Breakdowns",      desc: "Frame-by-frame analysis of high-performing creator videos.",       link: "https://drive.google.com/drive/folders/1RetBreakdown_W8xY0zA2bC4dE6fG8hI0jK2lM4n", btnLabel: "Open" },
    ],
    formTitle: "Submit Your Reel",
    formSubtext: "Share your editing reel and a sample project so we can understand your style and pacing.",
    formDisclaimer: "Submitting adds you to our internal video editor network. We reach out when creator brand and podcast projects come in.",
    formNotifyEmail: "",
    finalHeadline: "Ready to edit videos that build authority?",
    finalSubtext: "Submit your reel and join the growing GrowitBuddy video editor network.",
    finalCtaPrimary: "Submit Your Reel",
    seoTitle: "Video Editors Network - GrowitBuddy",
    seoDesc: "Join the GrowitBuddy video editor network. Edit long-form, shorts, and podcast content for founders and creator brands.",
  },
};

export default function EditorsPool() {
  return <TalentPoolPage config={config} />;
}
