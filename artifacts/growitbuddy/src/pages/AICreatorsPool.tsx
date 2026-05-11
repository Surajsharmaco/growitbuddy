import TalentPoolPage, { type PoolConfig } from "./TalentPoolPage";

const config: PoolConfig = {
  sectionKey: "pool-ai-creators",
  poolType: "ai-creators",
  formVariant: "ai",
  defaults: {
    eyebrow: "AI CREATORS & AUTOMATION NETWORK",
    headline: "Build AI systems that solve real business problems.",
    description: "Join our AI creator network for future automation, workflow implementation, and AI-powered content system projects.",
    opportunityText: "The businesses that win are building automation infrastructure now. We collaborate with AI creators who can design and implement real systems.",
    ctaPrimary: "Submit Your AI Project",
    ctaSecondary: "View Resources",
    videoUrl: "",
    heroTrustText: "We build long-term relationships with AI creators and automation specialists inside the GrowitBuddy ecosystem.",
    stepsTitle: "How it works.",
    steps: [
      { number: "01", title: "Watch the Overview",    desc: "Understand the types of automation projects we run." },
      { number: "02", title: "Access the Blueprints", desc: "Download AI workflow examples and prompt systems." },
      { number: "03", title: "Submit Your Project",   desc: "Share an example of your automation or AI work." },
      { number: "04", title: "Join the Network",      desc: "Get added for future AI and automation projects." },
    ],
    resourcesTitle: "AI Resources & Automation Blueprints",
    resourcesSubtext: "Workflow examples, prompt systems, and references for the types of automation we build.",
    resources: [
      { id: "1", title: "AI Workflow Examples",    desc: "Real automation workflows built for creator businesses.",    link: "", btnLabel: "Open" },
      { id: "2", title: "Prompt Systems",          desc: "Prompt frameworks for content, analysis, and operations.",   link: "", btnLabel: "Open" },
      { id: "3", title: "Automation Blueprints",   desc: "Flowcharts and logic maps for common automation builds.",    link: "", btnLabel: "Download" },
      { id: "4", title: "API References",          desc: "Common integrations and API patterns we use in projects.",   link: "", btnLabel: "Open" },
    ],
    formTitle: "Submit Your AI Project",
    formSubtext: "Tell us about the tools you use and share a project or workflow example you've built.",
    formDisclaimer: "Submitting adds you to our internal AI creator network. We reach out when automation and AI projects open up.",
    formNotifyEmail: "",
    finalHeadline: "Ready to build with us?",
    finalSubtext: "Submit your project and become part of the GrowitBuddy AI creator network.",
    finalCtaPrimary: "Submit Your AI Project",
    seoTitle: "AI Creators & Automation Network - GrowitBuddy",
    seoDesc: "Join the GrowitBuddy AI creator and automation network. Access workflow blueprints, submit your project, and collaborate on future AI builds.",
  },
};

export default function AICreatorsPool() {
  return <TalentPoolPage config={config} />;
}
