export interface AboutTeamMember { name: string; role: string; photo: string; }
export interface AboutValue { title: string; description: string; }
export interface AboutStat { value: string; label: string; }

export interface AboutData {
  founderName: string;
  founderRole: string;
  founderBio: string;
  founderPhoto: string;
  founderLinkedin: string;
  founderTwitter: string;
  founderInstagram: string;
  missionHeadline: string;
  missionBody: string;
  stats: AboutStat[];
  team: AboutTeamMember[];
  values: AboutValue[];
}

export const ABOUT_DEFAULTS: AboutData = {
  founderName: "Suraj Sharma",
  founderRole: "Founder & CEO",
  founderBio:
    "We build content and distribution systems that help founders and creators become the most recognized voices in their space.",
  founderPhoto: "",
  founderLinkedin: "",
  founderTwitter: "",
  founderInstagram: "",
  missionHeadline: "Expertise deserves to be heard.",
  missionBody:
    "Most founders and creators we work with are genuinely exceptional at what they do. The problem is never the expertise - it's the communication system around it. We fix that by building content and distribution systems that consistently put the right message in front of the right people.",
  stats: [
    { value: "700M+", label: "Views Generated" },
    { value: "200+",  label: "Founders & Brands" },
    { value: "90K+",  label: "Content Assets" },
  ],
  team: [],
  values: [
    {
      title: "Signal over noise",
      description:
        "We build for impact, not visibility. Every piece of content is designed to build credibility and attract the right opportunities.",
    },
    {
      title: "Systems, not one-offs",
      description:
        "We don't run campaigns. We build infrastructure - repeatable systems that compound and create leverage over time.",
    },
    {
      title: "Radical clarity",
      description:
        "Our clients always know what's working, what isn't, and what's next. Honest, clear communication is the foundation of any great partnership.",
    },
  ],
};
