export interface AuditQuestion {
  id: string;
  type: "text" | "choice";
  question: string;
  placeholder?: string;
  options?: string[];
}

export interface AuthorityAuditData {
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtext: string;
  seoTitle: string;
  seoDesc: string;
  introFreeTitle: string;
  introFreeDesc: string;
  introFreeButton: string;
  introPaidTitle: string;
  introPaidDesc: string;
  introPaidButton: string;
  questions: AuditQuestion[];
}

export const AUTHORITY_AUDIT_DEFAULTS: AuthorityAuditData = {
  heroEyebrow: "Authority Audit",
  heroHeadline: "Find out what's limiting your authority.",
  heroSubtext: "8 targeted questions. You get your authority stage, your specific content gap, your #1 priority action, and a personalized plan - free, in under 3 minutes.",
  seoTitle: "Authority Audit - GrowitBuddy",
  seoDesc: "8 targeted questions. Get your authority stage, content gap, and #1 priority action - free, in under 3 minutes.",
  introFreeTitle: "Free Authority Audit",
  introFreeDesc: "8 targeted questions. You get your authority stage, your specific content gap, your #1 priority action, and a personalized breakdown.",
  introFreeButton: "Start Free Audit",
  introPaidTitle: "Expert Authority Audit",
  introPaidDesc: "Skip the self-serve. Book a 1-on-1 audit call with our team. We go deep into your content, your positioning, and your platform performance.",
  introPaidButton: "Book Audit Call",
  questions: [
    { id: "name",        type: "text",   question: "First, what's your name?",                                     placeholder: "Your first name" },
    { id: "role",        type: "choice", question: "What best describes you?",                                     options: ["Founder / Startup CEO", "Coach or Consultant", "Content Creator", "Freelancer or Agency Owner"] },
    { id: "platform",    type: "choice", question: "Where do you mainly publish content?",                         options: ["LinkedIn", "Instagram", "YouTube", "X / Twitter", "TikTok", "Newsletter", "Podcast"] },
    { id: "tenure",      type: "choice", question: "How long have you been creating content?",                     options: ["Less than 3 months", "3-12 months", "1-2 years", "2+ years"] },
    { id: "frequency",   type: "choice", question: "How often do you post right now?",                             options: ["Daily", "3-5x per week", "1-2x per week", "A few times a month", "Rarely or never"] },
    { id: "problem",     type: "choice", question: "What frustrates you most about your content right now?",       options: ["Not getting enough views or reach", "Content isn't converting to clients or revenue", "I don't know what to post", "I can't stay consistent", "My content feels scattered or unclear"] },
    { id: "contentType", type: "choice", question: "What type of content do you mostly create?",                   options: ["Educational / how-to content", "Personal stories and opinions", "Case studies and results", "Industry news and commentary", "Mixed - no clear theme"] },
    { id: "goal",        type: "choice", question: "What does winning look like for you in the next 6 months?",    options: ["Be a recognized name in my niche", "Get consistent inbound leads from content", "Grow to 10K+ engaged followers", "Create a new income stream from content"] },
  ],
};
