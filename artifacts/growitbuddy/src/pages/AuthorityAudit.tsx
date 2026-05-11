import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";
import { API_BASE } from "@/lib/api";

const TEXT = "#0A0A0A";
type Answers = Record<string, string>;

interface AuditQuestion {
  id: string;
  type: "text" | "choice";
  question: string;
  placeholder?: string;
  options?: string[];
}

interface AuditCmsData {
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

const AUDIT_DEFAULTS: AuditCmsData = {
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

interface Report {
  score: number;
  scoreLabel: string;
  stage: string;
  stageDesc: string;
  contentGap: string;
  narrative: string;
  priorityAction: string;
  blockers: { title: string; detail: string }[];
  fixes: { title: string; detail: string }[];
  outcomes: string[];
}

const QUESTIONS = [
  { id: "name",        type: "text",   question: "First, what's your name?",                                     placeholder: "Your first name" },
  { id: "role",        type: "choice", question: "What best describes you?",                                     options: ["Founder / Startup CEO", "Coach or Consultant", "Content Creator", "Freelancer or Agency Owner"] },
  { id: "platform",    type: "choice", question: "Where do you mainly publish content?",                         options: ["LinkedIn", "Instagram", "YouTube", "X / Twitter", "TikTok", "Newsletter", "Podcast"] },
  { id: "tenure",      type: "choice", question: "How long have you been creating content?",                     options: ["Less than 3 months", "3-12 months", "1-2 years", "2+ years"] },
  { id: "frequency",   type: "choice", question: "How often do you post right now?",                             options: ["Daily", "3-5x per week", "1-2x per week", "A few times a month", "Rarely or never"] },
  { id: "problem",     type: "choice", question: "What frustrates you most about your content right now?",       options: ["Not getting enough views or reach", "Content isn't converting to clients or revenue", "I don't know what to post", "I can't stay consistent", "My content feels scattered or unclear"] },
  { id: "contentType", type: "choice", question: "What type of content do you mostly create?",                   options: ["Educational / how-to content", "Personal stories and opinions", "Case studies and results", "Industry news and commentary", "Mixed - no clear theme"] },
  { id: "goal",        type: "choice", question: "What does winning look like for you in the next 6 months?",    options: ["Be a recognized name in my niche", "Get consistent inbound leads from content", "Grow to 10K+ engaged followers", "Create a new income stream from content"] },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function roleShort(r: string) {
  if (r === "Founder / Startup CEO") return "a founder";
  if (r === "Coach or Consultant")   return "a coach/consultant";
  if (r === "Content Creator")       return "a creator";
  return "a freelancer";
}
function freqPhrase(f: string) {
  if (f === "Daily")               return "every day";
  if (f === "3-5x per week")       return "3-5 times per week";
  if (f === "1-2x per week")       return "once or twice a week";
  if (f === "A few times a month") return "a few times a month";
  return "rarely";
}
function tenurePhrase(t: string) {
  if (t === "Less than 3 months") return "just getting started";
  if (t === "3-12 months")        return "in your first year";
  if (t === "1-2 years")          return "about a year in";
  return "well into your content journey";
}

function getStage(frequency: string, tenure: string, problem: string) {
  const isRare = ["Rarely or never", "A few times a month"].includes(frequency);
  const isNew  = ["Less than 3 months", "3-12 months"].includes(tenure);
  if (isRare && isNew) return { stage: "Early Stage", stageDesc: "You're at the start. The decisions you make in the next 90 days set everything else." };
  if (isRare)          return { stage: "Stalled",     stageDesc: "You have experience but momentum has stopped. The gap between expertise and output is costing you opportunities." };
  if (["My content feels scattered or unclear", "I don't know what to post"].includes(problem))
                       return { stage: "Unfocused",   stageDesc: "You're active but without clear positioning, effort isn't compounding into authority." };
  if (problem === "Content isn't converting to clients or revenue" && !isNew)
                       return { stage: "Plateau",     stageDesc: "You're showing up consistently but not getting the return you should. This is a strategy problem, not an effort problem." };
  if (isNew)           return { stage: "Building",    stageDesc: "Foundation work done now determines how fast authority compounds later." };
  return                      { stage: "Building",    stageDesc: "You're pointed in the right direction. The next moves determine whether this compounds or stalls." };
}

function getContentGap(contentType: string, problem: string) {
  if (contentType === "Mixed - no clear theme")                                                                       return "Positioning Gap";
  if (contentType === "Industry news and commentary")                                                                  return "Differentiation Gap";
  if (contentType === "Educational / how-to content" && problem === "Content isn't converting to clients or revenue") return "Conversion Gap";
  if (problem === "Not getting enough views or reach")                                                                 return "Distribution Gap";
  if (["I don't know what to post", "My content feels scattered or unclear"].includes(problem))                      return "Strategy Gap";
  if (problem === "Content isn't converting to clients or revenue")                                                    return "Trust Gap";
  if (problem === "I can't stay consistent")                                                                           return "System Gap";
  return "Authority Gap";
}

function buildNarrative(a: Answers, gap: string): string {
  const role = roleShort(a.role); const freq = freqPhrase(a.frequency); const tenure = tenurePhrase(a.tenure);
  const open: Record<string, string> = {
    "Not getting enough views or reach":
      `You've been ${tenure} as ${role}, posting on ${a.platform} ${freq}. That level of effort should be gaining traction - but your content keeps hitting a ceiling. The audience isn't growing because your posts aren't being surfaced beyond the people who already know you. This is a distribution problem, not a quality problem.`,
    "Content isn't converting to clients or revenue":
      `As ${role} who's been creating content ${freq} on ${a.platform}, you're putting in the work. But the audience you're building isn't turning into business. That gap - between people who read your posts and people who pay you - is almost always a trust architecture problem. Your content is informative. It's not yet persuasive.`,
    "I don't know what to post":
      `You've been ${tenure} trying to build authority on ${a.platform} as ${role}. The platform is right. The intent is right. But without a clear content strategy, every post feels like a fresh decision. That friction is what's stopping you from building momentum. You don't have a creativity problem. You have a direction problem.`,
    "I can't stay consistent":
      `You know content works. You've seen it work for others. But as ${role} posting ${freq} on ${a.platform}, consistency has been the wall you can't get past. This is almost never a motivation issue. It's a systems issue. When content creation depends on willpower, it always loses to the demands of running a business.`,
    "My content feels scattered or unclear":
      `After ${tenure} posting on ${a.platform} ${freq}, something still feels off. The content goes out. Some of it performs. But it doesn't feel like it's building toward anything. That's because scattered content - even good content - doesn't compound. Audience members can't form a clear picture of who you are or why they should follow you specifically.`,
  };
  const gapSentences: Record<string, string> = {
    "Positioning Gap":     " The core issue is a positioning gap - you're creating content without a single consistent message that builds identity over time.",
    "Differentiation Gap": " The specific gap is differentiation - commentary without a strong POV is indistinguishable from everyone else doing the same.",
    "Conversion Gap":      " The specific gap is conversion - you're generating awareness and interest, but your content doesn't have the trust architecture that moves people to act.",
    "Distribution Gap":    " The specific gap is distribution - your content exists but doesn't travel, and the algorithm isn't amplifying it because the signals aren't there yet.",
    "Strategy Gap":        " The specific gap is strategy - without defined pillars and direction, each post starts from zero instead of compounding on what came before.",
    "Trust Gap":           " The specific gap is trust - your audience hasn't seen enough specific proof that you solve real problems for real people.",
    "System Gap":          " The specific gap is a system - without a repeatable process, every post is a new act of creation instead of a predictable workflow.",
    "Authority Gap":       " The specific gap is authority depth - your content isn't yet building the sustained recognition that makes your name synonymous with your niche.",
  };
  return (open[a.problem] || `After ${tenure} as ${role}, posting ${freq} on ${a.platform}, the pattern is clear.`) + (gapSentences[gap] || "");
}

function buildPriority(problem: string, frequency: string): string {
  if (["Rarely or never", "A few times a month"].includes(frequency))
    return "Commit to a minimum viable posting schedule - 2 posts per week, fixed days, no exceptions. Build the habit before optimizing the content. Consistency at a lower frequency compounds faster than brilliance published sporadically.";
  if (["I don't know what to post", "My content feels scattered or unclear"].includes(problem))
    return "Define your 3 content pillars before you write another post. Write them down as: 'I help [specific person] with [specific problem] using [your specific approach].' Every post you create from this point should reinforce one of those three pillars. This single step turns scattered effort into compounding authority.";
  if (problem === "Not getting enough views or reach")
    return "Spend one hour studying the 5 best-performing posts in your niche this week. Identify the hook structure, the format, and the opening line pattern. Apply those patterns to your next 10 posts before changing anything else. Distribution is a craft - learn the algorithm's language on your platform first.";
  if (problem === "Content isn't converting to clients or revenue")
    return "Publish one proof-based post this week - a real client result, a specific case study, a before/after transformation. Then add it to a monthly rotation. Your audience needs to see that you solve real problems, not just that you understand them. Proof converts faster than expertise alone.";
  if (problem === "I can't stay consistent")
    return "Block two hours this week and write your next 14 days of posts in one sitting. Store them in a doc. Then protect that session on your calendar every two weeks like a client meeting. Consistency is a logistics problem, not a motivation problem - solve it with infrastructure, not willpower.";
  return "Audit your last 10 posts. Find the single one that resonated most. Write down exactly what made it different, then reverse-engineer it into your next 10 posts. Most creators ignore their own data. Don't be one of them.";
}

function buildBlockers(problem: string, platform: string): { title: string; detail: string }[] {
  const all: Record<string, { title: string; detail: string }[]> = {
    "Not getting enough views or reach": [
      { title: "You're posting inside a closed loop", detail: `On ${platform}, reach beyond your existing network requires the algorithm to actively amplify your content. That only happens when early engagement signals - saves, shares, comments - are strong. Right now, those signals aren't triggering distribution.` },
      { title: "Your hooks aren't stopping the scroll", detail: "The first line of a post is the only thing that determines whether someone reads further. If that line doesn't create immediate tension, curiosity, or recognition - the rest of the post doesn't matter." },
      { title: "You're not speaking the platform's native language", detail: `Every platform has formats the algorithm rewards. ${platform} is no different. Content that doesn't match those native patterns gets suppressed before it ever has a chance to reach new people.` },
    ],
    "Content isn't converting to clients or revenue": [
      { title: "You're building awareness, not trust", detail: "Awareness is easy. Trust is what converts. Your content is likely informative and credible - but it's not showing people the specific transformation you deliver. That gap is why people read your posts and still don't reach out." },
      { title: "There's no visible proof in your feed", detail: "Your audience needs to see that you've done this before, for people like them, with real results. Without regular proof-based content - case studies, client outcomes, specific results - you remain a theory, not a proven solution." },
      { title: "Your calls to action are missing or passive", detail: "Even interested people need a clear, specific prompt to take the next step. Passive CTAs like 'feel free to reach out' don't work. Direct, specific ones do: 'DM me [word] if you're dealing with this exact situation.'" },
    ],
    "I can't stay consistent": [
      { title: "Content creation depends on your available time and energy", detail: "When there's no system, posting happens when everything else is done - which means it rarely happens. You're treating content as reactive instead of building it into your week as a non-negotiable." },
      { title: "You have no content buffer to draw from", detail: "Operating with zero posts in reserve means any busy week breaks your streak. A buffer of even 7-10 ready posts changes everything - you never miss because you always have something ready." },
      { title: "Inconsistency is eroding trust you've already built", detail: "Your audience notices when you go quiet. Every gap in your posting schedule reinforces the message that you can't be relied on - which is the opposite of what authority requires." },
    ],
    "I don't know what to post": [
      { title: "You have no defined content pillars", detail: "Without a clear framework for what you post about, every piece of content is a fresh decision from a blank page. That friction doesn't just slow you down - it stops you entirely on busy days." },
      { title: "Your expertise isn't mapped to your audience's problems", detail: "The best content lives at the intersection of what you know deeply and what your audience wants badly. If that intersection isn't defined, you'll keep posting things that feel right but don't land with the right people." },
      { title: "You're trying to be interesting instead of being relevant", detail: "Interesting content gets views. Relevant content builds authority. The difference is knowing exactly who you're writing for and what they need to hear from you specifically." },
    ],
    "My content feels scattered or unclear": [
      { title: "Your positioning isn't clear enough to stick", detail: "When someone lands on your profile, they should immediately know: who you help, what problem you solve, and why you specifically. If that isn't obvious in under 5 seconds, they leave." },
      { title: "Scattered content doesn't compound", detail: "Each unrelated post starts from zero audience interest instead of building on what came before. Authority is built through repetition and depth - saying the same important things in different ways until they're associated with your name." },
      { title: "You have no signature idea your audience associates with you", detail: "The most recognized names in any niche own one idea. That idea becomes a mental shortcut. Without it, you're one of many voices saying reasonable things - instead of the voice people think of first." },
    ],
  };
  return all[problem] || [
    { title: "Your content isn't compounding", detail: "Each post isn't building on the last - effort is high but the cumulative effect is low." },
    { title: "Your positioning needs sharpening", detail: "Your audience can't form a clear picture of what you stand for and why they should follow you specifically." },
    { title: "You need a repeatable system", detail: "Without a system, content creation will always feel like a battle against your own schedule and energy." },
  ];
}

function buildFixes(problem: string, platform: string, role: string): { title: string; detail: string }[] {
  const isFounder = role === "Founder / Startup CEO";
  const isCoach   = role === "Coach or Consultant";
  if (problem === "Not getting enough views or reach") return [
    { title: "Engineer your hooks before anything else", detail: "Spend 30% of your writing time on the first line. It should create immediate tension, challenge a common belief, or name a specific pain. Test 3 different hook styles over 30 days and track which format gets the most early engagement." },
    { title: `Master ${platform}'s native distribution signals`, detail: `Study the top 10 posts in your niche on ${platform} this week. Identify the format pattern, the length, the CTA, and the posting time. These aren't accidents - they're signals the algorithm rewards. Learn to replicate them deliberately.` },
    { title: "Engage strategically for 20 minutes after posting", detail: `On ${platform}, early engagement in the first hour after posting directly influences how widely the algorithm distributes your content. Reply to every comment. Leave 5-10 substantive comments on others' posts in your niche.` },
  ];
  if (problem === "Content isn't converting to clients or revenue") return [
    { title: "Add one proof post per week to your rotation", detail: `${isCoach ? "A client transformation story" : isFounder ? "A customer result or product impact" : "A case study or client outcome"} does more to build conversion trust than 10 educational posts combined. People don't buy expertise - they buy evidence that the expertise works for someone like them.` },
    { title: "Write content that speaks to one specific person's specific problem", detail: "Pick one person who is your ideal client. Write every post as if it's directly for them. Name their exact situation. Name their exact frustration. The more specific the problem you address, the more decisively it converts." },
    { title: "Add a specific, direct CTA to every post", detail: "Not 'feel free to reach out.' A specific prompt: 'If you're a [role] dealing with [exact problem], DM me [word] and I'll send you [specific thing].' Give people a reason to move and a step to take. Remove all friction from the first action." },
  ];
  if (problem === "I can't stay consistent") return [
    { title: "Build a 2-week content buffer this week", detail: "Block two hours. Write 14 posts. Store them somewhere accessible. From that point, you always have content ready - busy weeks don't break streaks, and you can post without creating in the moment. Rebuild the buffer every two weeks." },
    { title: "Create a minimum viable content template", detail: "Design 3 post templates that match your core content pillars. When you don't have time to be creative, fill in a template. A templated post published consistently beats a creative post published occasionally." },
    { title: "Reduce your frequency to a number you can actually hold", detail: "Two posts per week done consistently for 6 months creates more authority than 5 posts per week done for 6 weeks. Find the frequency you can sustain during your worst weeks - then build from there." },
  ];
  if (problem === "I don't know what to post") return [
    { title: "Define your 3 content pillars this week", detail: "Write down 3 topics that sit at the intersection of your deepest expertise and your audience's most pressing problems. Every post you create from now on should fall under one of these pillars. This turns a blank page into a decision between 3 clear options." },
    { title: "Mine your clients for content", detail: `${isCoach || isFounder ? "Talk to your 3 best clients" : "Look at your top comments and DMs"}. Ask what questions they had before working with you, what almost stopped them, what they wish they'd known earlier. Those answers are your next 30 posts.` },
    { title: "Build a 4-week content calendar in advance", detail: "Planning and creating are two different cognitive modes. Do them separately. Spend 30 minutes on Sunday mapping out the week's content themes. Then execute to the plan. Stop making content decisions in real time - they're always worse under pressure." },
  ];
  if (problem === "My content feels scattered or unclear") return [
    { title: "Write a single positioning sentence and post it publicly", detail: "'I help [specific person] achieve [specific result] through [your specific method].' Once that sentence is written, every future post either reinforces it or it doesn't belong in your feed. Clarity compounds. Scatter dissipates." },
    { title: "Launch one signature series and commit to it for 60 days", detail: "Pick a recurring format - a weekly framework, a recurring series name, a consistent structure. Publish it every week for 60 days. This single move does more for audience recognition than any individual viral post ever will." },
    { title: "Audit and archive your off-brand content", detail: "Go through your last 20-30 posts and identify everything that doesn't reinforce your positioning. Archive it. Your profile is a portfolio - it should tell one coherent story, not 6 different ones. Ruthless focus is what makes authority stick." },
  ];
  return [
    { title: "Define your positioning before creating anything else", detail: "Clarity on who you help, what problem you solve, and why your approach is distinct - this is the foundation every piece of content should be built on." },
    { title: "Build a content system, not just a schedule", detail: "A system tells you what to create and how. A schedule just tells you when. Build the system first - the schedule becomes easy when you know what goes in it." },
    { title: "Focus on depth over breadth", detail: "Cover fewer topics more thoroughly. Audiences follow and trust people who seem to know everything about one specific thing - not people who know a little about many things." },
  ];
}

function buildOutcomes(goal: string, platform: string): string[] {
  if (goal === "Be a recognized name in my niche") return [
    `People on ${platform} start tagging you in relevant conversations without being prompted`,
    "Speaking invites, podcast features, and collaboration requests start finding you rather than you chasing them",
    "Your name becomes the immediate association when your specific niche comes up in any room or thread",
  ];
  if (goal === "Get consistent inbound leads from content") return [
    "Inbound messages from prospects who already understand your value before you've spoken a single word",
    "A shorter sales cycle because your content pre-sells - qualified people arrive ready to move forward",
    "A predictable inbound pipeline that doesn't depend on cold outreach, referrals, or going viral",
  ];
  if (goal === "Grow to 10K+ engaged followers") return [
    `Steady, compounding audience growth on ${platform} made up of people aligned with your specific expertise`,
    "Higher engagement rates as your content becomes known for consistent, focused, actionable value",
    "A platform that makes every future launch, announcement, or offer significantly more powerful",
  ];
  if (goal === "Create a new income stream from content") return [
    "An audience that trusts you at the depth required to invest in your courses, programs, or premium services",
    "A repeatable path from content to revenue that doesn't depend on luck, timing, or algorithm changes",
    "The credibility to charge premium prices because your content already proves the depth of your expertise",
  ];
  return [
    "A content system that builds authority consistently without requiring daily creative effort",
    "Compounding recognition as your name becomes associated with a specific niche and perspective",
    "Inbound opportunities that reflect the level of expertise you've always had - now communicated clearly",
  ];
}

function getScore(a: Answers): { score: number; scoreLabel: string } {
  const freqScore: Record<string, number> = {
    "Daily": 28, "3-5x per week": 22, "1-2x per week": 16,
    "A few times a month": 8, "Rarely or never": 3,
  };
  const tenureScore: Record<string, number> = {
    "2+ years": 28, "1-2 years": 20, "3-12 months": 12, "Less than 3 months": 5,
  };
  const contentScore: Record<string, number> = {
    "Case studies and results": 22, "Educational / how-to content": 18,
    "Personal stories and opinions": 15, "Industry news and commentary": 11,
    "Mixed - no clear theme": 6,
  };
  const problemPenalty: Record<string, number> = {
    "My content feels scattered or unclear": -8,
    "I don't know what to post": -8,
    "I can't stay consistent": -6,
    "Content isn't converting to clients or revenue": -4,
    "Not getting enough views or reach": -2,
  };
  const raw = (freqScore[a.frequency] || 5) + (tenureScore[a.tenure] || 5) + (contentScore[a.contentType] || 8) + (problemPenalty[a.problem] || 0);
  const score = Math.min(100, Math.max(10, Math.round((raw / 78) * 100)));
  const scoreLabel =
    score >= 75 ? "Strong Authority" :
    score >= 55 ? "Growing" :
    score >= 38 ? "Developing" :
    score >= 22 ? "Early Stage" : "Just Starting";
  return { score, scoreLabel };
}

function buildReport(a: Answers): Report {
  const { stage, stageDesc } = getStage(a.frequency, a.tenure, a.problem);
  const contentGap = getContentGap(a.contentType, a.problem);
  const { score, scoreLabel } = getScore(a);
  return {
    score, scoreLabel, stage, stageDesc, contentGap,
    narrative:      buildNarrative(a, contentGap),
    priorityAction: buildPriority(a.problem, a.frequency),
    blockers:       buildBlockers(a.problem, a.platform),
    fixes:          buildFixes(a.problem, a.platform, a.role),
    outcomes:       buildOutcomes(a.goal, a.platform),
  };
}

// ── Main component ───────────────────────────────────────────────────────────

export default function AuthorityAudit() {
  const cms = usePublicContent<AuditCmsData>("authority-audit", AUDIT_DEFAULTS);
  const QUESTIONS = cms.questions.length > 0 ? cms.questions : AUDIT_DEFAULTS.questions;

  const [step, setStep]                       = useState(-1);
  const [answers, setAnswers]                 = useState<Answers>({});
  const [textInput, setTextInput]             = useState("");
  const [report, setReport]                   = useState<Report | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterDone, setNewsletterDone]   = useState(false);
  const [newsletterBusy, setNewsletterBusy]   = useState(false);

  const currentQ  = QUESTIONS[step];
  const firstName = answers["name"] || "";

  const handleAnswer = (value: string) => {
    const next = { ...answers, [currentQ.id]: value };
    setAnswers(next);
    setTextInput("");
    if (step === QUESTIONS.length - 1) setReport(buildReport(next));
    else setStep(s => s + 1);
  };

  const handleNewsletter = async () => {
    if (!newsletterEmail.includes("@")) return;
    setNewsletterBusy(true);
    try {
      await fetch(`${API_BASE}/forms/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail, source: "Authority Audit" }),
      });
    } catch { /* silently continue */ }
    setNewsletterDone(true);
    setNewsletterBusy(false);
  };

  const reset = () => { setStep(-1); setAnswers({}); setTextInput(""); setReport(null); setNewsletterDone(false); setNewsletterEmail(""); };

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif" }}>
      <SEOMeta
        title={cms.seoTitle || "Free Authority Audit - Find Your Content Growth Gaps | GrowitBuddy"}
        description={cms.seoDesc || "Answer 8 targeted questions and get your authority stage, content gap, and #1 priority action - free, in under 3 minutes. No email required to start."}
        schema={{
          "@type": "WebApplication",
          "name": "GrowitBuddy Authority Audit",
          "url": "https://growitbuddy.com/authority-audit",
          "description": "A free 8-question authority audit that identifies your content growth gaps and gives you a personalized action plan.",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
        } as Record<string, unknown>}
      />

      {/* ── Hero (always visible, matches site pattern) ── */}
      <section style={{ paddingTop: 120, paddingBottom: 60, paddingLeft: 24, paddingRight: 24, background: "#FFFFFF", borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 16 }}>{cms.heroEyebrow}</p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            style={{ fontWeight: 800, fontSize: "clamp(28px, 7vw, 84px)", letterSpacing: "-0.04em", lineHeight: "1.08", color: TEXT, maxWidth: "18ch", marginBottom: 20 }}
          >
            {cms.heroHeadline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ fontSize: "clamp(15px, 4.5vw, 18px)", color: "#5F5F5F", lineHeight: "1.75", maxWidth: "52ch" }}
          >
            {cms.heroSubtext}
          </motion.p>
        </div>
      </section>

      {/* ── Tool area ── */}
      <section style={{ padding: "60px 24px 100px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <AnimatePresence mode="wait">

            {/* INTRO */}
            {step === -1 && !report && (
              <motion.div key="intro" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4 }}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {/* ── Option 1: Self-serve free audit (primary) ── */}
                <div style={{ background: "#FFFFFF", border: "2px solid #EFEFEA", borderRadius: 24, padding: "36px 36px 32px", display: "flex", flexDirection: "column", gap: 28 }}>
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                    <div>
                      <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#7A7A85", background: "#F8F8F6", borderRadius: 100, padding: "4px 12px", marginBottom: 14 }}>Free - instant results - 3 minutes</span>
                      <h2 style={{ fontWeight: 800, fontSize: "clamp(18px, 3.5vw, 36px)", letterSpacing: "-0.04em", color: TEXT, margin: 0, lineHeight: 1.1 }}>
                        {cms.introFreeTitle}
                      </h2>
                      <p style={{ fontSize: 15, color: "#5F5F5F", marginTop: 10, maxWidth: "46ch", lineHeight: 1.7 }}>
                        {cms.introFreeDesc}
                      </p>
                    </div>
                  </div>

                  {/* 4 deliverables */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
                    {[
                      { n: "01", title: "Your Authority Stage",    desc: "Exactly where you sit and what it means for your next move." },
                      { n: "02", title: "Your Named Content Gap",  desc: "The one gap holding back your growth right now." },
                      { n: "03", title: "Your #1 Priority Action", desc: "One specific action based on your exact situation." },
                      { n: "04", title: "Your Personalized Plan",  desc: "Blockers, fixes, and outcomes written for your role." },
                    ].map(item => (
                      <div key={item.n} style={{ background: "#F8F8F6", borderRadius: 14, padding: "18px 16px" }}>
                        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", color: "#7A7A85", marginBottom: 8 }}>{item.n}</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 5 }}>{item.title}</p>
                        <p style={{ fontSize: 12, color: "#7A7A85", lineHeight: "1.6", margin: 0 }}>{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div>
                    <button
                      onClick={() => setStep(0)}
                      className="gb-btn hover:opacity-85 transition-opacity"
                      style={{ fontSize: 15, padding: "14px 32px" }}
                    >
                      {cms.introFreeButton} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ── Option 2: Team audit (secondary) ── */}
                <div style={{ background: "#EFEFEA", borderRadius: 24, padding: "32px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 12 }}>Done with you</span>
                    <h2 style={{ fontWeight: 800, fontSize: "clamp(20px, 2.5vw, 28px)", letterSpacing: "-0.04em", color: "#0A0A0A", margin: "0 0 10px", lineHeight: 1.15 }}>
                      {cms.introPaidTitle}
                    </h2>
                    <p style={{ fontSize: 14, color: "#5F5F5F", lineHeight: "1.7", margin: 0, maxWidth: "48ch" }}>
                      {cms.introPaidDesc}
                    </p>
                  </div>
                  <a
                    href="/contact"
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 26px", borderRadius: 100, background: "#FFFFFF", color: "#0A0A0A", fontSize: 14, fontWeight: 700, cursor: "pointer", textDecoration: "none", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}
                    className="hover:opacity-85 transition-opacity"
                  >
                    {cms.introPaidButton} <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            )}

            {/* QUESTIONS */}
            {step >= 0 && !report && (
              <motion.div key={`q-${step}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
                {/* Progress bar */}
                <div style={{ marginBottom: 36 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7A7A85" }}>
                      {step + 1} of {QUESTIONS.length}
                    </span>
                    <button
                      onClick={() => { if (step > 0) setStep(s => s - 1); else setStep(-1); }}
                      style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: "#7A7A85", background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                  </div>
                  <div style={{ height: 3, background: "rgba(10,10,10,0.03)", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%`, height: "100%", background: TEXT, borderRadius: 100, transition: "width 0.35s ease" }} />
                  </div>
                </div>

                <h2 style={{ fontWeight: 800, fontSize: "clamp(18px, 4vw, 40px)", letterSpacing: "-0.035em", color: TEXT, marginBottom: 28, lineHeight: 1.15 }}>
                  {currentQ.question}
                </h2>

                {currentQ.type === "text" ? (
                  <div>
                    <input
                      className="gb-input"
                      style={{ fontSize: 16, padding: "16px 20px", borderRadius: 14, width: "100%", boxSizing: "border-box" }}
                      placeholder={currentQ.placeholder}
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && textInput.trim()) handleAnswer(textInput.trim()); }}
                      autoFocus
                    />
                    <button
                      className="gb-btn"
                      style={{ marginTop: 12, width: "100%", justifyContent: "center", fontSize: 15, padding: "15px 0" }}
                      onClick={() => textInput.trim() && handleAnswer(textInput.trim())}
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {currentQ.options?.map(opt => (
                      <button key={opt} onClick={() => handleAnswer(opt)}
                        style={{ textAlign: "left", padding: "16px 20px", borderRadius: 14, border: "1.5px solid #E5E5E0", background: "#FFFFFF", fontSize: 15, fontWeight: 500, color: TEXT, cursor: "pointer", transition: "all 0.15s", fontFamily: "'Inter', sans-serif" }}
                        className="hover:border-[rgba(11,11,11,0.25)] hover:bg-[rgba(11,11,11,0.02)]"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* RESULTS */}
            {report && (
              <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ maxWidth: 860, margin: "0 auto" }}>

                {/* ── Score card ── */}
                <div style={{ background: "#EFEFEA", borderRadius: 24, padding: "40px 36px", marginBottom: 12, display: "flex", alignItems: "center", gap: 36, flexWrap: "wrap" }}>
                  {/* Circle */}
                  <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
                    <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(10,10,10,0.06)" strokeWidth="8" />
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#0A0A0A" strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 52}`}
                        strokeDashoffset={`${2 * Math.PI * 52 * (1 - report.score / 100)}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 1.2s ease" }}
                      />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 28, fontWeight: 900, color: "#0A0A0A", lineHeight: 1, letterSpacing: "-0.04em" }}>{report.score}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#8A8A8A", letterSpacing: "0.08em", textTransform: "uppercase" }}>/100</span>
                    </div>
                  </div>
                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 8 }}>Authority Score</p>
                    <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 4vw, 34px)", letterSpacing: "-0.04em", color: "#0A0A0A", lineHeight: 1.1, marginBottom: 10 }}>
                      {firstName ? `${firstName}, you're` : "You're"} at <span style={{ borderBottom: "2px solid #8A8A8A" }}>{report.scoreLabel}</span>.
                    </h2>
                    <p style={{ fontSize: 14, color: "#5F5F5F", lineHeight: "1.65", margin: 0, maxWidth: "46ch" }}>
                      {report.stageDesc}
                    </p>
                  </div>
                </div>

                {/* Badges */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {[
                    { label: report.stage, dark: true },
                    { label: report.contentGap, dark: false },
                    { label: answers.platform, dark: false },
                    { label: answers.role, dark: false },
                  ].map((b, i) => (
                    <span key={i} style={{ padding: "6px 14px", borderRadius: 100, fontSize: 13, fontWeight: 600, background: b.dark ? "rgba(10,10,10,0.07)" : "#FFFFFF", color: "#0A0A0A", border: "1px solid rgba(10,10,10,0.05)" }}>
                      {b.label}
                    </span>
                  ))}
                </div>

                {/* Narrative */}
                <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "28px 28px", marginBottom: 12, border: "1.5px solid #E5E5E0" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 14 }}>What the data tells us</p>
                  <p style={{ fontSize: 16, lineHeight: "1.8", color: TEXT, margin: 0 }}>{report.narrative}</p>
                </div>

                {/* Priority */}
                <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "28px 28px", marginBottom: 28, border: "1.5px solid #E5E5E0" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 14 }}>Your #1 Priority Action</p>
                  <p style={{ fontSize: 16, fontWeight: 600, color: TEXT, lineHeight: "1.72", margin: 0 }}>{report.priorityAction}</p>
                </div>

                {/* ── Newsletter Gate ── */}
                {!newsletterDone ? (
                  <div style={{ position: "relative", marginBottom: 12 }}>
                    {/* Blurred preview of locked content */}
                    <div style={{ pointerEvents: "none", userSelect: "none", filter: "blur(5px)", opacity: 0.45 }}>
                      {/* Fake blocker preview */}
                      <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "28px 28px", marginBottom: 10, border: "1.5px solid #E5E5E0" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 20 }}>What's holding you back</p>
                        {report.blockers.slice(0, 2).map((b, i) => (
                          <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(10,10,10,0.03)", flexShrink: 0 }} />
                            <div>
                              <div style={{ height: 14, width: "60%", background: "rgba(10,10,10,0.03)", borderRadius: 6, marginBottom: 8 }} />
                              <div style={{ height: 12, width: "90%", background: "rgba(10,10,10,0.03)", borderRadius: 6 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "28px 28px", border: "1.5px solid #E5E5E0" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 20 }}>What to do about it</p>
                        {report.fixes.slice(0, 2).map((_, i) => (
                          <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(10,10,10,0.03)", flexShrink: 0 }} />
                            <div>
                              <div style={{ height: 14, width: "55%", background: "rgba(10,10,10,0.03)", borderRadius: 6, marginBottom: 8 }} />
                              <div style={{ height: 12, width: "85%", background: "rgba(10,10,10,0.03)", borderRadius: 6 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Gate overlay */}
                    <div style={{
                      position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: "linear-gradient(to bottom, rgba(247,247,245,0) 0%, rgba(247,247,245,0.96) 28%)",
                      borderRadius: 20,
                    }}>
                      <div style={{ background: "#FFFFFF", border: "2px solid #EFEFEA", borderRadius: 24, padding: "36px 32px", maxWidth: 480, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EFEFEA", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#0A0A0A" strokeWidth="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round"/></svg>
                        </div>
                        <h3 style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em", color: TEXT, marginBottom: 8, lineHeight: 1.2 }}>
                          Unlock your full audit
                        </h3>
                        <p style={{ fontSize: 14, color: "#5F5F5F", lineHeight: "1.65", marginBottom: 24, maxWidth: "38ch", margin: "0 auto 24px" }}>
                          Get your blockers, action plan, and outcomes. Join our newsletter for free and unlock everything instantly.
                        </p>
                        <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                          <input
                            type="email"
                            value={newsletterEmail}
                            onChange={e => setNewsletterEmail(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleNewsletter(); }}
                            placeholder="Your email address"
                            style={{
                              width: "100%", boxSizing: "border-box", padding: "13px 16px", borderRadius: 12,
                              border: "1.5px solid #E5E5E0", background: "#F8F8F6",
                              fontSize: 14, fontFamily: "'Inter', sans-serif", color: TEXT, outline: "none",
                            }}
                          />
                          <button
                            onClick={handleNewsletter}
                            disabled={newsletterBusy || !newsletterEmail.includes("@")}
                            style={{
                              width: "100%", padding: "13px 0", borderRadius: 12,
                              background: newsletterEmail.includes("@") ? "#EFEFEA" : "rgba(11,11,11,0.2)",
                              color: "#0A0A0A", fontSize: 14, fontWeight: 700, cursor: newsletterEmail.includes("@") ? "pointer" : "default",
                              border: "none", fontFamily: "'Inter', sans-serif", transition: "all 0.15s",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            }}
                          >
                            {newsletterBusy ? "Unlocking..." : "Unlock Full Audit"} {!newsletterBusy && <ArrowRight style={{ width: 16, height: 16 }} />}
                          </button>
                        </div>
                        <p style={{ fontSize: 11, color: "#7A7A85", marginTop: 12 }}>No spam. Unsubscribe anytime.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <motion.div key="unlocked" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                    {/* Blockers */}
                    <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "28px 28px", marginBottom: 12, border: "1.5px solid #E5E5E0" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 20 }}>What's holding you back</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {report.blockers.map((b, i) => (
                          <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                            <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(10,10,10,0.03)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: "#7A7A85" }}>{i + 1}</span>
                            </div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{b.title}</p>
                              <p style={{ fontSize: 14, color: "#5F5F5F", lineHeight: "1.7", margin: 0 }}>{b.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fixes */}
                    <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "28px 28px", marginBottom: 12, border: "1.5px solid #E5E5E0" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 20 }}>What to do about it</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {report.fixes.map((f, i) => (
                          <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                            <div style={{ width: 30, height: 30, borderRadius: 9, background: "#EFEFEA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{f.title}</p>
                              <p style={{ fontSize: 14, color: "#5F5F5F", lineHeight: "1.7", margin: 0 }}>{f.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Outcomes */}
                    <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "28px 28px", marginBottom: 12, border: "1.5px solid #E5E5E0" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 20 }}>What you unlock when you fix this</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {report.outcomes.map((o, i) => (
                          <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(10,10,10,0.03)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="rgba(11,11,11,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            <p style={{ fontSize: 15, color: TEXT, lineHeight: "1.65", margin: 0 }}>{o}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <div style={{ background: "#EFEFEA", borderRadius: 20, padding: "36px 28px", marginBottom: 12 }}>
                      <h3 style={{ fontWeight: 800, fontSize: "clamp(20px, 3.5vw, 28px)", letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 10 }}>
                        Ready to build the system that fixes this?
                      </h3>
                      <p style={{ fontSize: 15, color: "#5F5F5F", lineHeight: "1.7", marginBottom: 24, maxWidth: "48ch" }}>
                        Book a free strategy call. We'll walk through your audit together and map out exactly what to build first.
                      </p>
                      <Link href="/contact">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 100, background: "#FFFFFF", color: TEXT, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }} className="hover:opacity-85 transition-opacity">
                          Book a Free Strategy Call <ArrowRight className="w-4 h-4" />
                        </span>
                      </Link>
                    </div>
                  </motion.div>
                )}

                <button onClick={reset}
                  style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "1.5px solid #E5E5E0", background: "transparent", fontSize: 14, fontWeight: 600, color: "#7A7A85", cursor: "pointer", fontFamily: "'Inter', sans-serif", marginTop: 4 }}>
                  Retake the Audit
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
