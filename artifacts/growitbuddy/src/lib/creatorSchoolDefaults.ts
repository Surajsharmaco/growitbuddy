export interface CreatorSchoolResource { id: string; title: string; desc: string; link: string; btnLabel: string; }
export interface CreatorSchoolStep { number: string; title: string; desc: string; }

export interface CreatorSchoolData {
  eyebrow: string;
  headline: string;
  description: string;
  opportunityText: string;
  ctaPrimary: string;
  ctaSecondary: string;
  videoUrl: string;
  heroTrustText: string;
  stepsTitle: string;
  steps: CreatorSchoolStep[];
  resourcesTitle: string;
  resourcesSubtext: string;
  resources: CreatorSchoolResource[];
  formTitle: string;
  formSubtext: string;
  formDisclaimer: string;
  formNotifyEmail: string;
  finalHeadline: string;
  finalSubtext: string;
  finalCtaPrimary: string;
  finalCtaSecondary: string;
  seoTitle: string;
  seoDesc: string;
}

export const CREATOR_SCHOOL_DEFAULTS: CreatorSchoolData = {
  eyebrow: "VIDEO EDITORS NETWORK",
  headline: "Join our growing network of video editors.",
  description: "Watch the demo, understand the workflow, submit your edit, and become part of the GrowitBuddy ecosystem.",
  opportunityText: "As new projects come in, we regularly collaborate with creators and freelancers from within our network.",
  ctaPrimary: "Submit Your Work",
  ctaSecondary: "View Resources",
  videoUrl: "",
  heroTrustText: "We are continuously building long-term creative relationships inside the GrowitBuddy ecosystem.",
  stepsTitle: "How it works.",
  steps: [
    { number: "01", title: "Watch Demo",         desc: "Get familiar with our style and workflow." },
    { number: "02", title: "Access Resources",   desc: "Download raw files and editing guidelines." },
    { number: "03", title: "Submit Your Work",   desc: "Share your completed edit for review." },
    { number: "04", title: "Join the Network",   desc: "Get added to our growing editor ecosystem." },
  ],
  resourcesTitle: "Resources & Guidelines",
  resourcesSubtext: "Everything you need to complete and submit your edit.",
  resources: [
    { id: "1", title: "Editing Guidelines", desc: "Style, pacing, and technical standards for submissions.", link: "https://drive.google.com/drive/folders/1EditGuide_X2yZ4aB6cD8eF0gH2iJ4kL6mN8oP0q", btnLabel: "Open" },
    { id: "2", title: "Raw Footage",        desc: "Source video files for the current project.",             link: "https://drive.google.com/drive/folders/1RawFoot_R2sT4uV6wX8yZ0aB2cD4eF6gH8iJ0kL2",  btnLabel: "Download" },
    { id: "3", title: "Brand Assets",       desc: "Logos, fonts, colours, and visual identity files.",       link: "https://drive.google.com/drive/folders/1BrandAst_M4nO6pQ8rS0tU2vW4xY6zA8bC0dE2fG4", btnLabel: "Download" },
    { id: "4", title: "Submission Rules",   desc: "How to name, export, and share your completed edit.",     link: "https://drive.google.com/drive/folders/1SubRules_H6iJ8kL0mN2oP4qR6sT8uV0wX2yZ4aB6c", btnLabel: "Open" },
  ],
  formTitle: "Submit Your Edit",
  formSubtext: "Fill in your details and share a link to your completed work.",
  formDisclaimer: "Submitting your work adds you to our internal network. We reach out when a project is a good fit.",
  formNotifyEmail: "",
  finalHeadline: "Ready to become part of the network?",
  finalSubtext: "Submit your edit and join the growing GrowitBuddy creator ecosystem.",
  finalCtaPrimary: "Submit Your Edit",
  finalCtaSecondary: "Watch Demo",
  seoTitle: "Video Editors Network - GrowitBuddy",
  seoDesc: "Join the GrowitBuddy editors network. Watch the demo, download resources, and submit your work to become part of our ecosystem.",
};
