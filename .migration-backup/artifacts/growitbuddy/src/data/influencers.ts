export interface Influencer {
  slug: string;
  name: string;
  username: string;
  niche: string;
  followers: string;
  engagementRate: string;
  description: string;
  photo: string;
  profileEnabled?: boolean;
  updatedAt?: string;
  audienceCountries: string[];
  about: {
    creates: string;
    audience: string;
  };
  metrics: {
    avgViews: string;
    engagementRate: string;
    audienceLocation: string;
  };
  pastWork: {
    brands: string[];
    sampleContent: string[];
  };
  services: string[];
  initials: string;
  accentColor: string;
}

export const NICHE_CATEGORIES = [
  "Business & Entrepreneurship",
  "Personal Finance",
  "Technology & AI",
  "Marketing & Growth",
  "Leadership & Management",
  "E-commerce & DTC",
  "Health & Wellness",
  "Fitness & Sports",
  "Real Estate",
  "Coaching & Education",
  "Fashion & Beauty",
  "Food & Nutrition",
  "Travel & Lifestyle",
  "Self Development",
  "Career & Productivity",
  "Sustainability",
  "Parenting & Family",
  "Gaming",
  "Music & Arts",
  "Mindset & Psychology",
] as const;

export const COUNTRIES = [
  "Australia",
  "Brazil",
  "Canada",
  "France",
  "Germany",
  "India",
  "Japan",
  "Kenya",
  "Mexico",
  "Nigeria",
  "Portugal",
  "Singapore",
  "South Africa",
  "UAE",
  "UK",
  "USA",
] as const;

export const influencers: Influencer[] = [
  {
    slug: "aisha-rahman",
    name: "Aisha Rahman",
    username: "@aisharahman",
    niche: "Business & Entrepreneurship",
    followers: "284K",
    engagementRate: "4.8%",
    description: "Helping founders build authority through authentic storytelling and strategic content.",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
    audienceCountries: ["USA", "UK", "UAE", "Canada"],
    initials: "AR",
    accentColor: "#0B0B0B",
    about: {
      creates: "Long-form LinkedIn essays, founder interview series, and weekly business breakdowns that cut through noise with clear, actionable thinking.",
      audience: "Founders, operators, and aspiring entrepreneurs aged 25-40 who value depth over virality.",
    },
    metrics: {
      avgViews: "120K per post",
      engagementRate: "4.8%",
      audienceLocation: "US (42%), UK (18%), UAE (14%), Canada (11%)",
    },
    pastWork: {
      brands: ["Notion", "Loom", "Stripe", "HubSpot"],
      sampleContent: [
        "LinkedIn series: 'How I built a 6-figure consulting practice without cold outreach'",
        "Interview: 'The founder who exited twice before 35'",
        "Newsletter drop: 'Why your content strategy is costing you clients'",
      ],
    },
    services: ["Sponsored Posts", "Newsletter Takeovers", "Brand Collaborations", "Speaking Partnerships"],
  },
  {
    slug: "marcus-obi",
    name: "Marcus Obi",
    username: "@marcobi",
    niche: "Personal Finance",
    followers: "512K",
    engagementRate: "6.1%",
    description: "Breaking down wealth-building strategies that actually work for the next generation.",
    photo: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=400&h=400&fit=crop&crop=face",
    audienceCountries: ["USA", "UK", "Australia", "Nigeria"],
    initials: "MO",
    accentColor: "#1a1a1a",
    about: {
      creates: "Short-form video explainers, deep-dive threads, and monthly market breakdowns designed to make finance accessible without dumbing it down.",
      audience: "Millennials and Gen Z professionals building their first real wealth -- skeptical of traditional advice and hungry for practical frameworks.",
    },
    metrics: {
      avgViews: "380K per video",
      engagementRate: "6.1%",
      audienceLocation: "US (55%), UK (22%), Australia (9%), Nigeria (8%)",
    },
    pastWork: {
      brands: ["Wealthsimple", "Robinhood", "Coursera", "Morning Brew"],
      sampleContent: [
        "Video: 'The index fund strategy nobody teaches you in your 20s'",
        "Thread: '7 money moves I made before 30 that changed everything'",
        "Sponsored breakdown: 'Comparing every major investment app in 2025'",
      ],
    },
    services: ["Sponsored Videos", "Brand Integrations", "Product Reviews", "Affiliate Partnerships"],
  },
  {
    slug: "sofia-chen",
    name: "Sofia Chen",
    username: "@sofiabuilds",
    niche: "Technology & AI",
    followers: "198K",
    engagementRate: "5.4%",
    description: "Demystifying AI and technology for founders who need to stay ahead without the hype.",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
    audienceCountries: ["USA", "India", "UK", "Singapore"],
    initials: "SC",
    accentColor: "#2a2a2a",
    about: {
      creates: "Technical yet accessible AI breakdowns, founder-focused product reviews, and weekly 'what's actually happening in tech' newsletters.",
      audience: "Non-technical founders, product managers, and senior operators who need to make tech decisions without being engineers.",
    },
    metrics: {
      avgViews: "95K per post",
      engagementRate: "5.4%",
      audienceLocation: "US (38%), India (21%), UK (16%), Singapore (10%)",
    },
    pastWork: {
      brands: ["Anthropic", "Midjourney", "Linear", "Zapier"],
      sampleContent: [
        "Breakdown: 'Every AI tool a founder actually needs in 2025'",
        "Newsletter: 'The week in AI -- what matters and what's noise'",
        "Video series: 'No-code AI workflows for non-technical teams'",
      ],
    },
    services: ["Product Reviews", "Sponsored Content", "Brand Collaborations", "Webinar Partnerships"],
  },
  {
    slug: "jordan-west",
    name: "Jordan West",
    username: "@jordanwestgrowth",
    niche: "Marketing & Growth",
    followers: "341K",
    engagementRate: "5.9%",
    description: "Growth frameworks and marketing strategies built for founders who are playing the long game.",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    audienceCountries: ["USA", "UK", "Australia", "Canada"],
    initials: "JW",
    accentColor: "#111111",
    about: {
      creates: "Case studies, marketing audits, and step-by-step growth frameworks shared through LinkedIn, newsletters, and bi-weekly YouTube breakdowns.",
      audience: "Early-stage and scaling founders, CMOs, and marketers who want strategy over tactics and systems over hacks.",
    },
    metrics: {
      avgViews: "210K per video",
      engagementRate: "5.9%",
      audienceLocation: "US (48%), UK (20%), Australia (12%), Canada (9%)",
    },
    pastWork: {
      brands: ["ConvertKit", "Webflow", "Ahrefs", "Clearbit"],
      sampleContent: [
        "Case study: 'How this SaaS went from 0 to 50K users without paid ads'",
        "Framework: 'The content flywheel that replaced my lead gen strategy'",
        "YouTube: 'Full growth audit of a 7-figure DTC brand (live)'",
      ],
    },
    services: ["Sponsored Posts", "Case Study Features", "Brand Collaborations", "Consulting Content"],
  },
  {
    slug: "priya-nair",
    name: "Priya Nair",
    username: "@priyacreates",
    niche: "Leadership & Management",
    followers: "167K",
    engagementRate: "7.2%",
    description: "Teaching ambitious leaders how to scale themselves so their business can scale too.",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
    audienceCountries: ["UK", "USA", "India", "UAE"],
    initials: "PN",
    accentColor: "#0d0d0d",
    about: {
      creates: "Executive coaching content, leadership frameworks, and raw behind-the-scenes posts about building and leading high-performance teams.",
      audience: "Founders managing their first teams, senior managers stepping into leadership, and operators building company culture from scratch.",
    },
    metrics: {
      avgViews: "74K per post",
      engagementRate: "7.2%",
      audienceLocation: "UK (34%), US (30%), India (20%), UAE (10%)",
    },
    pastWork: {
      brands: ["Atlassian", "Culture Amp", "Rippling", "Deel"],
      sampleContent: [
        "Post series: 'The 5 conversations every leader is avoiding'",
        "Video: 'My first 90-day framework for new team leaders'",
        "Newsletter: 'Why your best people keep leaving (and how to stop it)'",
      ],
    },
    services: ["Sponsored Posts", "Brand Integration", "Speaking Partnerships", "Workshop Collaborations"],
  },
  {
    slug: "tomas-reyes",
    name: "Tomas Reyes",
    username: "@tomasbuilds",
    niche: "E-commerce & DTC",
    followers: "423K",
    engagementRate: "5.5%",
    description: "Behind-the-scenes of building a real product business -- from sourcing to scaling.",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    audienceCountries: ["USA", "UK", "Mexico", "Canada"],
    initials: "TR",
    accentColor: "#181818",
    about: {
      creates: "Raw operational content, supplier frameworks, DTC growth strategies, and unfiltered lessons from running a 7-figure product brand.",
      audience: "Aspiring and active e-commerce founders, DTC operators, and product entrepreneurs who value transparency over polished highlights.",
    },
    metrics: {
      avgViews: "290K per video",
      engagementRate: "5.5%",
      audienceLocation: "US (51%), UK (16%), Mexico (12%), Canada (8%)",
    },
    pastWork: {
      brands: ["Shopify", "Klaviyo", "Gorgias", "Recharge"],
      sampleContent: [
        "YouTube: 'I documented every decision building my first 7-figure product'",
        "Thread: 'The supplier negotiation framework that saved me $200K'",
        "Sponsored breakdown: 'Every tool I actually use to run my DTC brand'",
      ],
    },
    services: ["Product Reviews", "Sponsored Videos", "Brand Integration", "Affiliate Partnerships"],
  },
  {
    slug: "naomi-brooks",
    name: "Naomi Brooks",
    username: "@naomibrookswellness",
    niche: "Health & Wellness",
    followers: "631K",
    engagementRate: "8.3%",
    description: "Evidence-based wellness content that helps high performers optimize their body and mind.",
    photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face",
    audienceCountries: ["USA", "UK", "Australia", "Canada"],
    initials: "NB",
    accentColor: "#0B0B0B",
    about: {
      creates: "Science-backed health breakdowns, longevity protocols, stress management frameworks, and weekly deep dives into what top performers do differently with their health.",
      audience: "Ambitious professionals, founders, and executives aged 28-45 who treat their health as a performance lever, not just a lifestyle choice.",
    },
    metrics: {
      avgViews: "420K per video",
      engagementRate: "8.3%",
      audienceLocation: "US (49%), UK (21%), Australia (14%), Canada (9%)",
    },
    pastWork: {
      brands: ["Whoop", "Levels", "Eight Sleep", "Thorne"],
      sampleContent: [
        "Video: 'The morning protocol that replaced my need for caffeine'",
        "Series: 'What 6 months of HRV tracking taught me about stress'",
        "Sponsored review: 'I wore every top wearable for 30 days -- here's what actually works'",
      ],
    },
    services: ["Product Reviews", "Sponsored Content", "Brand Integrations", "Long-Term Ambassadorships"],
  },
  {
    slug: "derek-fosu",
    name: "Derek Fosu",
    username: "@derekfosu_fit",
    niche: "Fitness & Sports",
    followers: "889K",
    engagementRate: "6.7%",
    description: "Performance training and athletic mindset content built for people who compete at life.",
    photo: "https://images.unsplash.com/photo-1583864697784-a0efc8379f70?w=400&h=400&fit=crop&crop=face",
    audienceCountries: ["USA", "UK", "Australia", "Nigeria"],
    initials: "DF",
    accentColor: "#0B0B0B",
    about: {
      creates: "Training methodology breakdowns, athlete interview series, performance nutrition guides, and unfiltered gym content that prioritizes results over aesthetics.",
      audience: "Recreational athletes, gym-goers, and fitness-focused professionals aged 20-38 who want to train smarter and build sustainable performance habits.",
    },
    metrics: {
      avgViews: "540K per video",
      engagementRate: "6.7%",
      audienceLocation: "US (44%), UK (19%), Australia (11%), Nigeria (10%)",
    },
    pastWork: {
      brands: ["Nike", "Momentous", "Hyperice", "MyFitnessPal"],
      sampleContent: [
        "YouTube: 'I trained like an NFL athlete for 8 weeks -- this is what happened'",
        "Series: 'The minimalist strength program that outperforms everything'",
        "Review: 'Testing every major creatine brand with bloodwork'",
      ],
    },
    services: ["Sponsored Videos", "Product Reviews", "Brand Ambassadorships", "Affiliate Partnerships"],
  },
  {
    slug: "claire-monroe",
    name: "Claire Monroe",
    username: "@clairemonroe_re",
    niche: "Real Estate",
    followers: "278K",
    engagementRate: "5.1%",
    description: "Stripping the mystique out of real estate investing for the next generation of property owners.",
    photo: "https://images.unsplash.com/photo-1560298803-a99b7e4e15f0?w=400&h=400&fit=crop&crop=face",
    audienceCountries: ["USA", "UK", "Canada", "Australia"],
    initials: "CM",
    accentColor: "#1a1a1a",
    about: {
      creates: "Property investment breakdowns, deal analysis walkthroughs, market condition reports, and candid content about the realities of building a real estate portfolio.",
      audience: "First-time investors, young professionals, and entrepreneurs looking to diversify beyond stocks and build passive income through property.",
    },
    metrics: {
      avgViews: "160K per video",
      engagementRate: "5.1%",
      audienceLocation: "US (58%), UK (16%), Canada (13%), Australia (7%)",
    },
    pastWork: {
      brands: ["Fundrise", "Roofstock", "Buildium", "Mashvisor"],
      sampleContent: [
        "Video: 'I analyzed 50 deals before buying my first rental -- here's the framework'",
        "Thread: 'Why most first-time investors fail in year two'",
        "Sponsored breakdown: 'The best real estate platforms compared with real numbers'",
      ],
    },
    services: ["Sponsored Posts", "Product Reviews", "Newsletter Features", "Brand Collaborations"],
  },
  {
    slug: "rafael-santos",
    name: "Rafael Santos",
    username: "@rafaelsantos_coach",
    niche: "Coaching & Education",
    followers: "193K",
    engagementRate: "9.1%",
    description: "Building coaches and educators who create lasting transformation, not just viral moments.",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    audienceCountries: ["USA", "Brazil", "UK", "Portugal"],
    initials: "RS",
    accentColor: "#0B0B0B",
    about: {
      creates: "Coaching methodology frameworks, client acquisition systems, curriculum design walkthroughs, and honest content about building a sustainable online education business.",
      audience: "Aspiring and active coaches, course creators, and consultants who want to build a premium practice without the noise of typical online business influencers.",
    },
    metrics: {
      avgViews: "88K per post",
      engagementRate: "9.1%",
      audienceLocation: "US (39%), Brazil (22%), UK (15%), Portugal (11%)",
    },
    pastWork: {
      brands: ["Kajabi", "Teachable", "Circle", "ConvertKit"],
      sampleContent: [
        "Series: 'The 5-step curriculum framework that gets clients real results'",
        "Video: 'Why most coaches have a delivery problem, not a marketing problem'",
        "Newsletter: 'Building a coaching practice that doesn't need you to post daily'",
      ],
    },
    services: ["Sponsored Posts", "Platform Reviews", "Co-Creation", "Speaking Partnerships"],
  },
  {
    slug: "yasmine-el-amin",
    name: "Yasmine El-Amin",
    username: "@yasminestyle",
    niche: "Fashion & Beauty",
    followers: "1.2M",
    engagementRate: "4.4%",
    description: "Redefining style for the professional woman who refuses to choose between ambition and elegance.",
    photo: "https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=400&h=400&fit=crop&crop=face",
    audienceCountries: ["USA", "UK", "UAE", "France"],
    initials: "YE",
    accentColor: "#0B0B0B",
    about: {
      creates: "Editorial-quality styling content, wardrobe investment guides, beauty reviews, and candid commentary on the intersection of personal brand and professional appearance.",
      audience: "Professional women aged 25-40 in corporate and entrepreneurial environments who see their appearance as an extension of their personal brand.",
    },
    metrics: {
      avgViews: "680K per post",
      engagementRate: "4.4%",
      audienceLocation: "US (38%), UK (24%), UAE (16%), France (9%)",
    },
    pastWork: {
      brands: ["Reformation", "Glossier", "Net-a-Porter", "Charlotte Tilbury"],
      sampleContent: [
        "Series: 'Building a capsule wardrobe for the founder who travels monthly'",
        "Video: 'I spent $5K on a professional wardrobe refresh -- was it worth it?'",
        "Collab: 'Styling the C-suite: 30-day outfit series for executive women'",
      ],
    },
    services: ["Sponsored Posts", "Brand Collaborations", "Long-Term Ambassadorships", "Editorial Content"],
  },
  {
    slug: "ben-tanaka",
    name: "Ben Tanaka",
    username: "@bentanakaeats",
    niche: "Food & Nutrition",
    followers: "447K",
    engagementRate: "7.8%",
    description: "High-performance nutrition made practical for busy people who refuse to eat like a robot.",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face",
    audienceCountries: ["USA", "UK", "Japan", "Australia"],
    initials: "BT",
    accentColor: "#181818",
    about: {
      creates: "Science-informed recipe content, nutrition myth-busting, meal prep systems, and sponsor-integrated reviews of food products that are actually worth buying.",
      audience: "Health-conscious professionals and athletes aged 24-40 who want to eat well without spending hours in the kitchen or following rigid meal plans.",
    },
    metrics: {
      avgViews: "310K per video",
      engagementRate: "7.8%",
      audienceLocation: "US (46%), UK (18%), Japan (12%), Australia (10%)",
    },
    pastWork: {
      brands: ["Sakara Life", "Daily Harvest", "LMNT", "Territory Foods"],
      sampleContent: [
        "Video: 'The 10-ingredient rotation that fuels my entire week'",
        "Series: 'I ate every popular meal kit for 30 days -- brutally honest review'",
        "Breakdown: 'What a sports dietitian actually eats vs. what they post'",
      ],
    },
    services: ["Sponsored Videos", "Recipe Integrations", "Product Reviews", "Brand Ambassadorships"],
  },
  {
    slug: "lena-vasquez",
    name: "Lena Vasquez",
    username: "@lenawanders",
    niche: "Travel & Lifestyle",
    followers: "756K",
    engagementRate: "5.8%",
    description: "Slow travel, smart logistics, and the art of living well without being tethered to one place.",
    photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face",
    audienceCountries: ["USA", "UK", "Germany", "Australia"],
    initials: "LV",
    accentColor: "#0d0d0d",
    about: {
      creates: "Immersive destination content, remote work logistics guides, cost breakdowns for full-time travel, and honest lifestyle content that doesn't romanticize the hard parts.",
      audience: "Remote workers, digital nomads, and aspiring location-independent professionals aged 25-38 who want a real picture of the laptop lifestyle.",
    },
    metrics: {
      avgViews: "490K per post",
      engagementRate: "5.8%",
      audienceLocation: "US (34%), UK (20%), Germany (14%), Australia (11%)",
    },
    pastWork: {
      brands: ["Airbnb", "Bose", "Away", "Wise"],
      sampleContent: [
        "Video: 'Living in 6 countries in 12 months -- the real cost breakdown'",
        "Series: 'The remote work setup that lets me work from anywhere'",
        "Guide: 'How I find apartments for a month in expensive cities'",
      ],
    },
    services: ["Sponsored Posts", "Brand Integrations", "Destination Features", "Long-Term Ambassadorships"],
  },
  {
    slug: "oliver-grant",
    name: "Oliver Grant",
    username: "@oliverdevmind",
    niche: "Self Development",
    followers: "334K",
    engagementRate: "6.5%",
    description: "Evidence-based self development without the toxic positivity or pseudoscience.",
    photo: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face",
    audienceCountries: ["USA", "UK", "Australia", "Canada"],
    initials: "OG",
    accentColor: "#111111",
    about: {
      creates: "Psychology-informed growth frameworks, book breakdowns, habit system reviews, and long-form content on identity, performance, and becoming a more effective person.",
      audience: "Analytical, ambitious individuals aged 22-40 who are skeptical of mainstream self-help but still committed to intentional personal growth.",
    },
    metrics: {
      avgViews: "195K per video",
      engagementRate: "6.5%",
      audienceLocation: "US (41%), UK (22%), Australia (12%), Canada (10%)",
    },
    pastWork: {
      brands: ["Blinkist", "Headspace", "Readwise", "Brilliant"],
      sampleContent: [
        "Video: 'I read 52 self-help books -- here's what actually works'",
        "Series: 'Building identity-based habits (not motivation-based ones)'",
        "Breakdown: 'The psychology behind why smart people stay stuck'",
      ],
    },
    services: ["Sponsored Videos", "Newsletter Features", "Book Collaborations", "Brand Integrations"],
  },
  {
    slug: "maya-johnson",
    name: "Maya Johnson",
    username: "@mayaoncareer",
    niche: "Career & Productivity",
    followers: "412K",
    engagementRate: "7.0%",
    description: "No-nonsense career strategy for ambitious professionals who want to move faster than their peers.",
    photo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face",
    audienceCountries: ["USA", "UK", "Canada", "India"],
    initials: "MJ",
    accentColor: "#0B0B0B",
    about: {
      creates: "Salary negotiation guides, corporate navigation playbooks, productivity system reviews, and real talk about what actually moves careers forward -- and what's just noise.",
      audience: "Mid-career professionals and high-achieving recent graduates aged 24-38 who are done waiting for promotions and want to take their trajectory into their own hands.",
    },
    metrics: {
      avgViews: "270K per post",
      engagementRate: "7.0%",
      audienceLocation: "US (52%), UK (18%), Canada (12%), India (8%)",
    },
    pastWork: {
      brands: ["LinkedIn", "Notion", "Grammarly", "MasterClass"],
      sampleContent: [
        "Video: 'I asked for a $40K raise and got it -- here's the exact script'",
        "Series: 'The unspoken rules of corporate advancement nobody teaches you'",
        "Guide: 'Building your personal board of directors at 28'",
      ],
    },
    services: ["Sponsored Posts", "Brand Integrations", "Newsletter Features", "Speaking Partnerships"],
  },
  {
    slug: "zara-ali",
    name: "Zara Ali",
    username: "@zaragreen",
    niche: "Sustainability",
    followers: "289K",
    engagementRate: "6.9%",
    description: "Making sustainable living accessible to people who don't want to sacrifice quality for conscience.",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
    audienceCountries: ["UK", "USA", "Germany", "Australia"],
    initials: "ZA",
    accentColor: "#0B0B0B",
    about: {
      creates: "Product sustainability audits, ethical brand deep dives, zero-waste lifestyle guides, and balanced content about making greener choices without guilt-tripping the audience.",
      audience: "Conscious consumers and young professionals aged 22-35 who want to reduce their impact without subscribing to an all-or-nothing identity.",
    },
    metrics: {
      avgViews: "172K per post",
      engagementRate: "6.9%",
      audienceLocation: "UK (38%), US (29%), Germany (14%), Australia (11%)",
    },
    pastWork: {
      brands: ["Patagonia", "Allbirds", "Grove Collaborative", "Oatly"],
      sampleContent: [
        "Series: 'I switched every household product for 90 days -- what stayed'",
        "Deep dive: 'What carbon neutral actually means (and when it's greenwashing)'",
        "Review: 'The sustainable brands worth paying more for, ranked'",
      ],
    },
    services: ["Sponsored Posts", "Brand Audits", "Product Reviews", "Long-Term Ambassadorships"],
  },
  {
    slug: "james-okafor",
    name: "James Okafor",
    username: "@jamesokafor",
    niche: "Mindset & Psychology",
    followers: "521K",
    engagementRate: "8.6%",
    description: "Applying behavioral psychology to help high performers break the patterns that are keeping them stuck.",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face",
    audienceCountries: ["USA", "UK", "Nigeria", "Canada"],
    initials: "JO",
    accentColor: "#0d0d0d",
    about: {
      creates: "Deep psychology breakdowns, cognitive bias explainers, behavior change frameworks, and long-form interviews with researchers and practitioners at the edge of human performance.",
      audience: "High achievers, therapists, coaches, and curious minds aged 25-42 who want to understand themselves and others at a deeper level than surface-level self-help offers.",
    },
    metrics: {
      avgViews: "340K per video",
      engagementRate: "8.6%",
      audienceLocation: "US (44%), UK (20%), Nigeria (12%), Canada (9%)",
    },
    pastWork: {
      brands: ["Calm", "BetterHelp", "Waking Up", "Audible"],
      sampleContent: [
        "Video: 'The cognitive distortions holding back every ambitious person I know'",
        "Interview: 'What a behavioral economist learned after studying 10,000 decisions'",
        "Series: 'Why your environment is more powerful than your willpower'",
      ],
    },
    services: ["Sponsored Videos", "Newsletter Features", "Podcast Appearances", "Brand Integrations"],
  },
];
