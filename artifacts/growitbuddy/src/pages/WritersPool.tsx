import TalentPoolPage, { type PoolConfig } from "./TalentPoolPage";

const config: PoolConfig = {
  sectionKey: "pool-writers",
  poolType: "writers",
  formVariant: "writers",
  defaults: {
    eyebrow: "SCRIPTWRITERS NETWORK",
    headline: "Write content that builds authority.",
    description: "Join our writing network and contribute to high-performing creator content systems built around storytelling, hooks, and audience psychology.",
    opportunityText: "The best creators don't just produce - they build systems. We collaborate with writers who understand the difference.",
    ctaPrimary: "Submit Your Writing",
    ctaSecondary: "View Resources",
    videoUrl: "",
    heroTrustText: "We build long-term writing relationships inside the GrowitBuddy creator ecosystem.",
    stepsTitle: "How it works.",
    steps: [
      { number: "01", title: "Study the Frameworks",  desc: "Understand our hook systems and storytelling approach." },
      { number: "02", title: "Access Writing Guides", desc: "Download script frameworks and writing examples." },
      { number: "03", title: "Submit Your Writing",   desc: "Share a writing sample that shows your voice and range." },
      { number: "04", title: "Join the Network",      desc: "Get added for future content and script projects." },
    ],
    resourcesTitle: "Writing Resources & Frameworks",
    resourcesSubtext: "Everything you need to understand how we approach content and submit your writing.",
    resources: [
      { id: "1", title: "Script Frameworks",       desc: "Structures we use across short-form and long-form content.",  link: "", btnLabel: "Open" },
      { id: "2", title: "Writing Examples",         desc: "Real scripts and samples for reference and context.",          link: "", btnLabel: "Open" },
      { id: "3", title: "Hook Systems",             desc: "Opening strategies that capture attention in the first line.", link: "", btnLabel: "Download" },
      { id: "4", title: "Storytelling Structures",  desc: "Narrative arcs and frameworks for building authority.",        link: "", btnLabel: "Download" },
    ],
    formTitle: "Submit Your Writing",
    formSubtext: "Share your writing background and a sample so we can understand your style and range.",
    formDisclaimer: "Submitting adds you to our internal writing network. We reach out when content projects open up.",
    formNotifyEmail: "",
    finalHeadline: "Ready to write for the ecosystem?",
    finalSubtext: "Submit your writing and become part of the GrowitBuddy content network.",
    finalCtaPrimary: "Submit Your Writing",
    seoTitle: "Scriptwriters Network - GrowitBuddy",
    seoDesc: "Join the GrowitBuddy scriptwriting network. Access writing frameworks, submit your samples, and collaborate on future content.",
  },
};

export default function WritersPool() {
  return <TalentPoolPage config={config} />;
}
