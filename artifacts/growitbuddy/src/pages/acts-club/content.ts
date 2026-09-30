import hero from "@assets/generated_images/acts-hero.jpg";
import collab from "@assets/generated_images/acts-collaboration.jpg";
import board from "@assets/generated_images/acts-boardgames.jpg";
import network from "@assets/generated_images/acts-networking.jpg";
import retreat from "@assets/generated_images/acts-retreat.jpg";
import workshop from "@assets/generated_images/acts-workshop.jpg";

export const IMG = { hero, collab, board, network, retreat, workshop };

export const NAV = [
  { label: "Home", href: "#home" },
  { label: "Community", href: "#life" },
  { label: "Opportunities", href: "#opportunities" },
  { label: "Events", href: "#ecosystem" },
  { label: "For Businesses", href: "#platform" },
  { label: "About", href: "#story" },
];

export const STATS = [
  { v: "2.5K+", l: "Creators & Freelancers" },
  { v: "500+", l: "Projects & Opportunities" },
  { v: "100+", l: "Events & Meetups" },
  { v: "4.8/5", l: "Community Rating" },
];

export const AUDIENCES = [
  { t: "For Creators", d: "Create, collaborate and showcase your work.", img: IMG.workshop, alt: "Creators listening to a speaker at an ACTS workshop" },
  { t: "For Freelancers", d: "Find projects, clients and collaborators.", img: IMG.collab, alt: "Freelancers talking over laptops at a shared table" },
  { t: "For Entrepreneurs", d: "Find creative talent, collaborators and opportunities.", img: IMG.network, alt: "Entrepreneurs networking at an evening event" },
];

export const ECOSYSTEM = [
  { n: "01", t: "Opportunities by Your Skills", d: "Projects, freelance work and gigs matched to what you actually do.", img: IMG.collab, icon: "spark" },
  { n: "02", t: "Work with GrowItBuddy", d: "A pathway into a content and distribution studio with 700M+ views.", img: IMG.workshop, icon: "play", feature: true },
  { n: "03", t: "Trips & Retreats", d: "Curated trips and creator retreats to travel, create and unwind together.", img: IMG.retreat, icon: "plane" },
  { n: "04", t: "Meetups & Board Games", d: "Offline evenings built for real relationships beyond screens.", img: IMG.board, icon: "dice" },
  { n: "05", t: "Networking Events", d: "Meet creators, freelancers and founders and swap ideas worth acting on.", img: IMG.network, icon: "users" },
  { n: "06", t: "Learn & Grow", d: "Workshops, panels and skill sessions with people who do the work.", img: IMG.workshop, icon: "book" },
] as const;

export const COLLAGE = [
  { l: "Community Meetups", img: IMG.hero },
  { l: "Board Games", img: IMG.board },
  { l: "Networking", img: IMG.network },
  { l: "Trips & Retreats", img: IMG.retreat },
  { l: "Workshops & Panels", img: IMG.workshop },
];

export const SKILLS: Record<string, string[]> = {
  "Video Editing": ["Short-form edits for a founder-led channel", "Long-form YouTube edit, ongoing", "Reel cutdowns for a brand launch"],
  "Content Creation": ["UGC-style product videos", "Weekly creator collaboration slot", "On-camera host for a series"],
  "Graphic Design": ["Thumbnail set for a creator", "Carousel design system", "Event poster and brand kit"],
  "Social Media": ["Account manager for a D2C brand", "Community moderator, part-time", "Posting calendar build"],
  Marketing: ["Campaign strategist, project-based", "Creator outreach lead", "Launch plan for a new studio"],
  Development: ["Portfolio site for a creator", "Landing page build", "Small automation for a studio"],
  Writing: ["Scriptwriter for explainers", "Newsletter ghostwriting", "Case study writer"],
};

export const STORIES = [
  { q: "I came for the meetups and left with two collaborators and a steady editing client.", n: "Member story A", r: "Video Editor", i: "MA" },
  { q: "The people in the room were actually doing the work. That made every conversation useful.", n: "Member story B", r: "Graphic Designer", i: "MB" },
  { q: "A retreat weekend did more for my network than a year of cold messages.", n: "Member story C", r: "Freelance Marketer", i: "MC" },
];
