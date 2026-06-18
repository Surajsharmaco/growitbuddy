export interface HomeData {
  heroBadge: string;
  heroHeadline: string;
  heroHeadlineItalic: string;
  heroSubtext: string;
  heroCTAPrimary: string;
  heroCTASecondary: string;
  stats: Array<{ value: string; label: string }>;
  problemLabel: string;
  problemHeadline: string;
  problems: Array<{ title: string; desc: string }>;
  solutionLabel: string;
  solutionHeadline: string;
  solutionBeforeLabel: string;
  solutionAfterLabel: string;
  solutionBefore: string[];
  solutionAfter: string[];
  servicesLabel: string;
  servicesHeadline: string;
  services: Array<{ num: string; title: string; desc: string; href: string }>;
  frameworkLabel: string;
  frameworkHeadline: string;
  frameworkSteps: Array<{ step: string; title: string; desc: string }>;
  frameworkCTA: string;
  proofLabel: string;
  proofHeadline: string;
  proof: Array<{ metric: string; unit: string; name: string; category: string }>;
  processLabel: string;
  processHeadline: string;
  processSteps: Array<{ num: string; title: string; desc: string }>;
  ecosystemLabel: string;
  ecosystemHeadline: string;
  ecosystemCreatorTag: string;
  ecosystemCreatorTitle: string;
  ecosystemCreatorDesc: string;
  ecosystemCreatorCTA: string;
  ecosystemFreelancerTag: string;
  ecosystemFreelancerTitle: string;
  ecosystemFreelancerDesc: string;
  ecosystemFreelancerCTA: string;
  auditLabel: string;
  auditHeadline: string;
  auditSubtext: string;
  auditCTA: string;
  founderLabel: string;
  founderPhoto: string;
  founderInitials: string;
  founderName: string;
  founderQuote: string;
  founderTags: string[];
  testimonialsHeadline: string;
  testimonials: Array<{ quote: string; name: string; role: string; initials: string }>;
  ctaHeadline: string;
  ctaSubtext: string;
  ctaButton: string;
  ctaSuccess: string;
  ctaSecondaryLink: string;
}

export const HOME_DEFAULTS: HomeData = {
  heroBadge: "700M+ views generated for our clients",
  heroHeadline: "We create and distribute content that builds your",
  heroHeadlineItalic: "authority.",
  heroSubtext:
    "We help founders, creators, and businesses turn expertise into authority and that authority into consistent inbound demand through content strategy and distribution.",
  heroCTAPrimary: "Book a Strategy Call",
  heroCTASecondary: "See Our Work",
  stats: [
    { value: "700M+", label: "Views Generated Across Content Networks" },
    { value: "200+",  label: "Founders & Brands Served" },
    { value: "90K+",  label: "Content Assets Created Across High-Volume Pages" },
  ],
  problemLabel: "The Problem",
  problemHeadline: "Most content gets attention. Very little builds authority.",
  problems: [
    {
      title: "You're creating content. But it's not part of a real content strategy.",
      desc: "Most content gets a few likes, then disappears. Without a clear content strategy and positioning, your output doesn't build the kind of trust that turns followers into paying clients.",
    },
    {
      title: "You're getting attention - but not reaching the right audience.",
      desc: "Reach without relevance leads nowhere. Without precise audience targeting, your content misses the decision-makers and buyers who actually matter to your business.",
    },
    {
      title: "You have no system - just constant effort.",
      desc: "Showing up consistently is exhausting when every post is a new decision. Without a structured content system, growth stays unpredictable no matter how much effort you put in.",
    },
  ],
  solutionLabel: "The Solution",
  solutionHeadline: "From random content - to a system that builds authority.",
  solutionBeforeLabel: "Content without a system",
  solutionAfterLabel: "With GrowitBuddy",
  solutionBefore: [
    "Content with no strategic direction",
    "Reach without the right audience",
    "Metrics without real business outcomes",
    "Inconsistency and creative burnout",
    "No compounding effect over time",
  ],
  solutionAfter: [
    "Clear positioning before any content",
    "Consistent reach to the right people",
    "Content that builds trust and drives demand",
    "A system that runs without daily effort",
    "Authority that compounds with every piece",
  ],
  servicesLabel: "Services",
  servicesHeadline:
    "Everything you need to build authority and generate inbound demand.",
  services: [
    {
      num: "01",
      title: "Content Creation",
      desc: "High-volume content systems designed to build visibility, trust, and long-term authority across modern platforms.",
      href: "/services#service-1",
    },
    {
      num: "02",
      title: "Personal Branding",
      desc: "Authority positioning systems that help founders, creators, and brands become recognized voices in their category.",
      href: "/services#service-2",
    },
    {
      num: "03",
      title: "Distribution & Growth",
      desc: "Distribution infrastructure designed to amplify reach, compound attention, and generate inbound demand.",
      href: "/services#service-3",
    },
    {
      num: "04",
      title: "Web & Funnel Systems",
      desc: "Digital systems built to convert authority into inbound leads, trust, and scalable opportunities.",
      href: "/services#service-4",
    },
    {
      num: "05",
      title: "AI Automation",
      desc: "AI-powered systems that automate communication, support, lead flow, and creator operations.",
      href: "/services#service-5",
    },
    {
      num: "06",
      title: "Digital Products & Growth",
      desc: "Systems designed to help creators and brands monetize attention through products, communities, and scalable offers.",
      href: "/services#service-6",
    },
  ],
  frameworkLabel: "Framework",
  frameworkHeadline: "The GrowitBuddy System.",
  frameworkSteps: [
    {
      step: "01",
      title: "Positioning",
      desc: "Shape perception and build recognition in your category and niche so the right people know exactly what you stand for.",
    },
    {
      step: "02",
      title: "Production",
      desc: "Create high-signal content built for attention, trust, and consistency at scale - video, copy, and graphics that communicate authority.",
    },
    {
      step: "03",
      title: "Distribution",
      desc: "Push content into the right audiences through networks and performance systems so it reaches the people who actually matter.",
    },
    {
      step: "04",
      title: "Inbound Demand",
      desc: "Turn compounding visibility into authority, qualified leads, and inbound opportunities - without chasing anyone.",
    },
  ],
  frameworkCTA: "Explore the Full Framework",
  // Proof section: concise, result-focused copy
  proofLabel: "Results",
  proofHeadline: "Real results. Real inbound growth.",
  proof: [
    { metric: "700M+", unit: "views generated", name: "Across content networks and brand campaigns", category: "Distribution · Multi-channel" },
    { metric: "200+",  unit: "founders & brands served", name: "Across industries and content verticals", category: "Network · Global" },
    { metric: "90K+",  unit: "content assets created", name: "Across high-volume pages and channels", category: "Content · High-Volume" },
  ],
  processLabel: "Process",
  processHeadline: "How we build your authority system.",
  processSteps: [
    {
      num: "01",
      title: "Understand",
      desc: "We study your market, your audience, and your current positioning to identify exactly where your content marketing opportunity is.",
    },
    {
      num: "02",
      title: "Strategize",
      desc: "We design your content planning roadmap - what to say, where to say it, and how to say it in a way that builds trust and drives real inbound demand.",
    },
    {
      num: "03",
      title: "Execute",
      desc: "Our team handles content creation and distribution every week - so you can focus entirely on running your business.",
    },
    {
      num: "04",
      title: "Scale",
      desc: "We track performance, refine your growth strategy, and expand your content reach as your authority compounds over time.",
    },
  ],
  ecosystemLabel: "Ecosystem",
  ecosystemHeadline: "Built for creators and freelancers too.",
  ecosystemCreatorTag: "For Creators",
  ecosystemCreatorTitle: "Turn your platform into consistent income.",
  ecosystemCreatorDesc:
    "We help creators build a positioned, monetized content system - so your audience turns into a real business, not just a following.",
  ecosystemCreatorCTA: "Join as a Creator",
  ecosystemFreelancerTag: "For Freelancers",
  ecosystemFreelancerTitle: "Join the GrowitBuddy network.",
  ecosystemFreelancerDesc:
    "Are you a writer, editor, or strategist? Apply to work with ambitious founders and help them build the authority they deserve.",
  ecosystemFreelancerCTA: "Apply to Join",
  auditLabel: "Content Growth Diagnosis",
  auditHeadline: "Find out exactly what's limiting your content growth.",
  auditSubtext:
    "Answer 6 questions and get a personalized breakdown of exactly what's holding your content marketing back - free, in under 2 minutes.",
  auditCTA: "Get My Growth Diagnosis",
  founderLabel: "Founder",
  founderPhoto: "",
  founderInitials: "SS",
  founderName: "Suraj Sharma",
  founderQuote:
    "\"I built GrowitBuddy after watching brilliant founders lose market position to louder, less qualified voices. Authority isn't given - it's built. We built the systems to do it consistently.\"",
  founderTags: ["Founder & CEO", "Content Strategist", "Authority Architect"],
  testimonialsHeadline: "What founders we've worked with say.",
  testimonials: [
    {
      quote:
        "Honestly, I was skeptical at first - I'd worked with two agencies before and both just recycled my old posts. The GrowitBuddy team actually sat with me for two hours figuring out what I wanted to be known for. Three months in, I'm getting cold DMs from people I used to look up to. That's the part nobody warned me would feel weird.",
      name: "Rohan Mehta",
      role: "Founder, Aarna Consumer Labs",
      initials: "RM",
    },
    {
      quote:
        "The first month was slower than I'd hoped - they kept pushing back on my ideas which annoyed me a little, in hindsight rightly so. By month two the inbound started: two podcast invites, one investor intro, and a partnership conversation that's now signed. I still write my own posts; they just made me sound more like myself.",
      name: "Priya Iyer",
      role: "Co-founder, Lumen.health",
      initials: "PI",
    },
    {
      quote:
        "I'm not a content person. I run a 14-person agency and I just needed someone to handle the LinkedIn stuff without making me cringe. They get the tone, they ship on time, and when something flopped they actually told me why instead of spinning it. That alone was worth it.",
      name: "Karan Sethi",
      role: "Founder, Northstar Creative",
      initials: "KS",
    },
  ],
  ctaHeadline: "If your content isn't driving results, it's not a content problem.",
  ctaSubtext:
    "It's a distribution and authority problem. Book a free growth breakdown - we'll show you exactly what to fix and how.",
  ctaButton: "Get your growth breakdown",
  ctaSuccess: "You're on the list. We'll be in touch within 24 hours.",
  ctaSecondaryLink: "Take the Authority Audit",
};
