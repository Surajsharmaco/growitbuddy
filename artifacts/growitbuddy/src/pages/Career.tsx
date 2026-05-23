import { useState, useRef, useEffect, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { API_BASE } from "@/lib/api";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";
import EcosystemOptIn from "@/components/EcosystemOptIn";

type CareerType = "full-time" | "internship" | "freelancer";

const TYPE_OPTIONS: { value: CareerType; label: string; sub: string }[] = [
  { value: "freelancer", label: "Talent Network", sub: "Project-based work" },
  { value: "internship", label: "Internship",     sub: "Learn by doing" },
  { value: "full-time",  label: "Full-Time",      sub: "Join the core team" },
];

const EXPERIENCE_OPTIONS = ["Less than 1 year", "1–2 years", "3–5 years", "5+ years"];
const INTERN_EXPERIENCE = ["Beginner", "Intermediate"];

const FT_ROLES = [
  "Content Strategist", "Video Editor", "Graphic Designer", "Motion Designer",
  "Thumbnail Designer", "Copywriter", "Social Media Manager", "Distribution Specialist",
  "AI Automation Specialist", "Web & Funnel Designer", "Community Manager",
  "Meme Creator", "Operations Coordinator", "Other",
];
const INTERN_ROLES = [
  "Video Editing", "Graphic Design", "Thumbnail Design", "Content Writing",
  "Copywriting", "Social Media", "Motion Design", "AI Automation",
  "Web Design", "Brand Strategy", "Meme Creation", "Other",
];
const FREELANCE_SKILLS = [
  "Video Editing", "Graphic Design", "Motion Design", "Thumbnail Design",
  "Script Writing", "Content Strategy", "Copywriting", "Social Media Management",
  "UGC Creation", "AI Automation", "AI Chatbots", "Web Design", "Funnel Building",
  "Distribution & Growth", "Community Management", "Podcast Editing", "Brand Strategy",
  "LinkedIn Growth", "YouTube Growth", "Email Marketing", "Meme Creation", "Other",
];

// ── Zod schemas per type ──────────────────────────────────────────────────────
const baseName = z.string().min(2, "Enter your full name").max(80, "Name too long").regex(/^[a-zA-Z\s'-]+$/, "Name should only contain letters");
const baseEmail = z.string().email("Enter a valid email address");
const phoneRe = /^\+?[\d\s\-().]{7,20}$/;

const fullTimeSchema = z.object({
  name: baseName,
  email: baseEmail,
  phone: z.string().regex(phoneRe, "Enter a valid phone number"),
  role: z.string().min(1, "Please select a role"),
  experience: z.string().min(1, "Please select your experience level"),
  linkedinUrl: z.string().url("Enter a valid URL (must start with https://)"),
  coverNote: z.string().min(30, "Please write at least 30 characters"),
});

const internshipSchema = z.object({
  name: baseName,
  email: baseEmail,
  phone: z.string().regex(phoneRe, "Enter a valid phone number").or(z.literal("")).optional(),
  role: z.string().min(1, "Please select a role"),
  experience: z.string().min(1, "Please select your experience level"),
  portfolioUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  whyJoin: z.string().min(20, "Please write at least 20 characters").max(1000, "Max 1000 characters"),
});

const freelanceSchema = z.object({
  name: baseName,
  email: baseEmail,
  phone: z.string().regex(phoneRe, "Enter a valid phone number"),
  skills: z.array(z.string()).min(1, "Please select at least one skill"),
  portfolioUrl: z.string().url("Enter a valid URL").or(z.literal("")),
  experience: z.string().min(1, "Please select your experience level"),
});

// ── Content interfaces (reuse existing publicContent sections) ───────────────
interface FullTimeContent {
  heroLabel: string; heroHeadline: string; heroSubtext: string;
  perksHeadline: string; perks: string[];
  rolesLabel: string; roles: string[];
  formHeadline: string; formSubtext: string;
  formSuccessHeadline: string; formSuccessSubtext: string;
}
interface FreelancersContent {
  heroLabel: string; heroHeadline: string; heroSubtext: string;
  perksHeadline: string; perks: string[];
  notForEveryoneTitle: string; notForEveryone: string[];
  formHeadline: string; formSubtext: string;
  formSuccessHeadline: string; formSuccessSubtext: string;
}
interface InternshipContent {
  heroLabel: string; heroHeadline: string; heroSubtext: string;
  perksHeadline: string; perks: string[];
  idealForTitle: string; idealFor: string[];
  formHeadline: string; formSubtext: string;
  formSuccessHeadline: string; formSuccessSubtext: string;
}

const FT_DEFAULTS: FullTimeContent = {
  heroLabel: "Careers at GrowitBuddy",
  heroHeadline: "Build modern authority systems with us.",
  heroSubtext: "We're building a high-output creative ecosystem for founders, creators, and brands — and we're looking for ambitious people who want to do meaningful work.",
  perksHeadline: "Why join full-time?",
  perks: ["Flexible remote-first work environment", "Work directly on creator and authority systems", "High ownership and creative impact", "Access to modern workflows, systems, and frameworks", "Opportunities to grow across multiple creative disciplines"],
  rolesLabel: "Open Roles",
  roles: ["Content Strategist", "Video Editor", "Graphic Designer", "Motion Designer", "Thumbnail Designer", "Copywriter", "Social Media Manager", "Distribution Specialist", "AI Automation Specialist", "Web & Funnel Designer", "Community Manager", "Operations Coordinator"],
  formHeadline: "Apply for a full-time role",
  formSubtext: "We review every application. Expect a response within 7 business days.",
  formSuccessHeadline: "Application received.",
  formSuccessSubtext: "We review every application carefully. If you are a fit, we will reach out within 7 business days.",
};

const FL_DEFAULTS: FreelancersContent = {
  heroLabel: "Talent Network",
  heroHeadline: "Join the creator network behind modern authority brands.",
  heroSubtext: "Work on real projects, collaborate with creators and brands, and become part of a long-term creative ecosystem — not random one-off gigs.",
  perksHeadline: "What You Get.",
  perks: ["Real-world creator and brand projects", "Consistent freelance and collaboration opportunities", "Access to systems, workflows, and creative resources", "Opportunities across content, design, AI, and growth", "Long-term relationships inside the GrowitBuddy ecosystem"],
  notForEveryoneTitle: "Built for creators who want to grow",
  notForEveryone: ["Creative people serious about improving their craft", "Freelancers looking for meaningful long-term opportunities", "Creators who value consistency, quality, and execution", "Talent interested in building real-world experience and relationships"],
  formHeadline: "Apply for the Talent Network",
  formSubtext: "Selection is performance-based. Apply now and prove your work.",
  formSuccessHeadline: "Application received.",
  formSuccessSubtext: "We review applications based on performance. If you make the cut, we'll be in touch within 7 business days.",
};

const IN_DEFAULTS: InternshipContent = {
  heroLabel: "Creator Internship",
  heroHeadline: "Start building real-world experience.",
  heroSubtext: "Work alongside creators, brands, and modern content systems while learning through execution — not theory.",
  perksHeadline: "What you'll experience.",
  perks: ["Real projects with practical execution", "Structured feedback and collaborative workflows", "Exposure to modern creator and authority systems", "Opportunities to build your portfolio with shipped work", "A path toward freelance, creator, or full-time opportunities"],
  idealForTitle: "Ideal For",
  idealFor: ["Creators starting their journey", "People who want hands-on experience instead of only tutorials", "Early-stage creatives looking to sharpen real-world skills", "Ambitious individuals who want to grow through execution"],
  formHeadline: "Apply for Internship",
  formSubtext: "We read every application. If you're a fit, we'll be in touch.",
  formSuccessHeadline: "Application received.",
  formSuccessSubtext: "We'll review it and get back to you within a few days.",
};

// ── Page component ────────────────────────────────────────────────────────────
export default function Career() {
  const ft = usePublicContent<FullTimeContent>("fulltime", FT_DEFAULTS);
  const fl = usePublicContent<FreelancersContent>("freelancers", FL_DEFAULTS);
  const intern = usePublicContent<InternshipContent>("internship", IN_DEFAULTS);
  const { toast } = useToast();
  const [location] = useLocation();

  const [type, setType] = useState<CareerType>(() => {
    if (typeof window === "undefined") return "freelancer";
    const qs = new URLSearchParams(window.location.search);
    const t = qs.get("type");
    if (t === "full-time" || t === "internship" || t === "freelancer") return t;
    return "freelancer";
  });

  // Allow URL ?type= to update selection on navigation
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const t = qs.get("type");
    if (t === "full-time" || t === "internship" || t === "freelancer") setType(t);
  }, [location]);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const successRef = useRef<HTMLDivElement>(null);

  // Reset submitted state when switching type
  function switchType(t: CareerType) {
    setType(t);
    setSubmitted(false);
    // Update URL without full navigation
    const url = new URL(window.location.href);
    url.searchParams.set("type", t);
    window.history.replaceState({}, "", url.toString());
  }

  const activeContent =
    type === "full-time"  ? { hero: { label: ft.heroLabel, headline: ft.heroHeadline, subtext: ft.heroSubtext },
                              perksHeadline: ft.perksHeadline, perks: ft.perks,
                              sideTitle: ft.rolesLabel, sideItems: ft.roles,
                              form: { headline: ft.formHeadline, subtext: ft.formSubtext },
                              success: { headline: ft.formSuccessHeadline, subtext: ft.formSuccessSubtext } } :
    type === "internship" ? { hero: { label: intern.heroLabel, headline: intern.heroHeadline, subtext: intern.heroSubtext },
                              perksHeadline: intern.perksHeadline, perks: intern.perks,
                              sideTitle: intern.idealForTitle, sideItems: intern.idealFor,
                              form: { headline: intern.formHeadline, subtext: intern.formSubtext },
                              success: { headline: intern.formSuccessHeadline, subtext: intern.formSuccessSubtext } } :
                            { hero: { label: fl.heroLabel, headline: fl.heroHeadline, subtext: fl.heroSubtext },
                              perksHeadline: fl.perksHeadline, perks: fl.perks,
                              sideTitle: fl.notForEveryoneTitle, sideItems: fl.notForEveryone,
                              form: { headline: fl.formHeadline, subtext: fl.formSubtext },
                              success: { headline: fl.formSuccessHeadline, subtext: fl.formSuccessSubtext } };

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif" }}>
      <SEOMeta
        title="Careers — GrowitBuddy"
        description="Join GrowitBuddy as a full-time team member, intern, or part of our talent network. Real work, real impact, real growth."
        robots="index,follow"
      />

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 56, paddingLeft: 24, paddingRight: 24, borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 16 }}>
            {activeContent.hero.label}
          </p>
          <AnimatePresence mode="wait">
            <motion.h1
              key={`h-${type}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              style={{ fontWeight: 800, fontSize: "clamp(28px, 7vw, 72px)", letterSpacing: "-0.04em", lineHeight: "1.08", color: "#0A0A0A", maxWidth: "20ch", marginBottom: 20 }}
            >
              {activeContent.hero.headline}
            </motion.h1>
          </AnimatePresence>
          <p style={{ fontSize: "clamp(15px, 4.5vw, 18px)", color: "#5F5F5F", lineHeight: "1.75", maxWidth: "56ch", marginBottom: 36 }}>
            {activeContent.hero.subtext}
          </p>

          {/* Type Selector */}
          <div
            role="tablist"
            aria-label="Choose application type"
            className="career-tablist"
          >
            {TYPE_OPTIONS.map((opt) => {
              const active = type === opt.value;
              return (
                <button
                  key={opt.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => switchType(opt.value)}
                  data-testid={`career-tab-${opt.value}`}
                  className={`career-tab-btn${active ? " is-active" : ""}`}
                >
                  <span className="career-tab-label">{opt.label}</span>
                  <span className="career-tab-sub">{opt.sub}</span>
                  <span className="career-tab-arrow" aria-hidden="true">→</span>
                </button>
              );
            })}
          </div>
          <style>{`
            .career-tablist {
              display: flex;
              flex-direction: column;
              gap: 8px;
              width: 100%;
              background: #FFFFFF;
              border: 1px solid #E5E5E0;
              border-radius: 16px;
              padding: 8px;
            }
            .career-tab-btn {
              display: flex;
              align-items: center;
              gap: 12px;
              width: 100%;
              padding: 14px 16px;
              border: none;
              border-radius: 12px;
              background: transparent;
              color: #5F5F5F;
              font-family: 'Inter', sans-serif;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.18s, color 0.18s;
              text-align: left;
            }
            .career-tab-btn:hover { background: #F5F5F0; }
            .career-tab-btn.is-active { background: #1E293B; color: #FFFFFF; }
            .career-tab-btn.is-active:hover { background: #1E293B; }
            .career-tab-label {
              font-size: 15px;
              font-weight: 700;
              line-height: 1.2;
              flex-shrink: 0;
            }
            .career-tab-sub {
              font-size: 13px;
              font-weight: 500;
              opacity: 0.7;
              line-height: 1.2;
              flex: 1;
            }
            .career-tab-arrow {
              font-size: 16px;
              opacity: 0;
              transform: translateX(-4px);
              transition: opacity 0.18s, transform 0.18s;
            }
            .career-tab-btn.is-active .career-tab-arrow {
              opacity: 1;
              transform: translateX(0);
            }
            @media (min-width: 640px) {
              .career-tablist {
                display: inline-flex;
                flex-direction: row;
                flex-wrap: wrap;
                width: auto;
                gap: 6px;
                padding: 6px;
                border-radius: 14px;
              }
              .career-tab-btn {
                width: auto;
                min-width: 150px;
                padding: 10px 18px;
                flex-direction: column;
                align-items: flex-start;
                gap: 2px;
                border-radius: 10px;
              }
              .career-tab-label { font-size: 14px; }
              .career-tab-sub { font-size: 11px; opacity: 0.65; flex: none; }
              .career-tab-btn.is-active .career-tab-sub { opacity: 0.85; }
              .career-tab-arrow { display: none; }
            }
          `}</style>
        </div>
      </section>

      {/* Perks + Form */}
      <section style={{ padding: "72px 24px", background: "#FFFFFF" }}>
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Left: perks + side box */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`left-${type}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <h2 style={{ fontWeight: 800, fontSize: "clamp(20px, 3vw, 36px)", letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 28, lineHeight: 1.15 }}>
                {activeContent.perksHeadline}
              </h2>
              <ul style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 36 }}>
                {activeContent.perks.map((perk, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(10,10,10,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check className="w-3.5 h-3.5" style={{ color: "#0A0A0A" }} />
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 500, color: "#0A0A0A" }}>{perk}</span>
                  </li>
                ))}
              </ul>
              <div style={{ background: "#EFEFEA", borderRadius: 16, padding: "24px 28px" }}>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 12 }}>
                  {activeContent.sideTitle}
                </p>
                {activeContent.sideItems.map((item, i) => (
                  <p key={i} style={{ fontSize: 14, color: "#5F5F5F", lineHeight: "1.7", marginBottom: 6 }}>
                    {item}
                  </p>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Right: form */}
          <div ref={successRef}>
            {submitted ? (
              <SuccessCard headline={activeContent.success.headline} subtext={activeContent.success.subtext} type={type} email={submittedEmail} />
            ) : (
              <div style={{ background: "#F8F8F6", border: "1.5px solid #E5E5E0", borderRadius: 20, padding: "36px 32px" }}>
                <h3 style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 6 }}>
                  {activeContent.form.headline}
                </h3>
                <p style={{ fontSize: 14, color: "#5F5F5F", marginBottom: 24 }}>
                  {activeContent.form.subtext}
                </p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`form-${type}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                  >
                    {type === "full-time"  && <FullTimeForm
                      onSuccess={(em) => { setSubmittedEmail(em); setSubmitted(true); setTimeout(() => successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}
                      submitting={submitting} setSubmitting={setSubmitting} toast={toast} />}
                    {type === "internship" && <InternshipForm
                      onSuccess={(em) => { setSubmittedEmail(em); setSubmitted(true); setTimeout(() => successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}
                      submitting={submitting} setSubmitting={setSubmitting} toast={toast} />}
                    {type === "freelancer" && <FreelancerForm
                      onSuccess={(em) => { setSubmittedEmail(em); setSubmitted(true); setTimeout(() => successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}
                      submitting={submitting} setSubmitting={setSubmitting} toast={toast} />}
                  </motion.div>
                </AnimatePresence>
                <p style={{ fontSize: 13, color: "#8A8A8A", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
                  Questions?{" "}
                  <a href="mailto:careers.growitbuddy@gmail.com" style={{ color: "#1E293B", fontWeight: 600, textDecoration: "none" }}>
                    careers.growitbuddy@gmail.com
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Success Card ──────────────────────────────────────────────────────────────
function SuccessCard({ headline, subtext, type, email }: { headline: string; subtext: string; type: CareerType; email: string }) {
  const ctx = type === "freelancer" ? "freelancer" : type;
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ background: "#F8F8F6", border: "1.5px solid #E5E5E0", borderRadius: 20, padding: "48px 36px", textAlign: "center" }}
      >
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#EFEFEA", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 26 }}>✓</div>
        <h3 style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 12 }}>{headline}</h3>
        <p style={{ fontSize: 15, color: "#5F5F5F", lineHeight: "1.75" }}>{subtext}</p>
      </motion.div>
      <EcosystemOptIn context={ctx} prefillEmail={email} />
    </>
  );
}

// ── Sub-form: Full-Time ───────────────────────────────────────────────────────
type FormProps = {
  onSuccess: (email: string) => void;
  submitting: boolean;
  setSubmitting: (b: boolean) => void;
  toast: ReturnType<typeof useToast>["toast"];
};

function FullTimeForm({ onSuccess, submitting, setSubmitting, toast }: FormProps) {
  type F = z.infer<typeof fullTimeSchema>;
  const form = useForm<F>({
    resolver: zodResolver(fullTimeSchema as any),
    mode: "onBlur",
    defaultValues: { name: "", email: "", phone: "", role: "", experience: "", linkedinUrl: "", coverNote: "" },
  });
  const [otherRole, setOtherRole] = useState("");
  const watched = form.watch("role");

  const onSubmit = async (data: F) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/forms/full-time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, otherRole: data.role === "Other" ? otherRole : undefined }),
      });
      if (res.ok) { onSuccess(data.email); form.reset(); setOtherRole(""); }
      else toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } catch {
      toast({ title: "Connection error", description: "Please check your connection.", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <TextField form={form} name="name"  label="Full Name"  placeholder="Your full name" />
        <TextField form={form} name="email" label="Email Address" type="email" placeholder="you@example.com" />
        <TextField form={form} name="phone" label="Contact Number" type="tel" placeholder="+1 234 567 8900" />
        <SelectField form={form} name="role" label="Role You Are Applying For" options={FT_ROLES} placeholder="Select a role" />
        {watched === "Other" && (
          <input className="gb-input" placeholder="Please describe the role..." value={otherRole} onChange={(e) => setOtherRole(e.target.value)} />
        )}
        <SelectField form={form} name="experience" label="Years of Experience" options={EXPERIENCE_OPTIONS} placeholder="Select experience level" />
        <TextField form={form} name="linkedinUrl" label="LinkedIn or Portfolio URL" placeholder="https://linkedin.com/in/yourname" />
        <TextAreaField form={form} name="coverNote" label="Why GrowitBuddy?" placeholder="Tell us about yourself and why you want to join..." />
        <SubmitButton submitting={submitting} text="Submit Application" />
      </form>
    </Form>
  );
}

// ── Sub-form: Internship ──────────────────────────────────────────────────────
function InternshipForm({ onSuccess, submitting, setSubmitting, toast }: FormProps) {
  type F = z.infer<typeof internshipSchema>;
  const form = useForm<F>({
    resolver: zodResolver(internshipSchema as any),
    mode: "onBlur",
    defaultValues: { name: "", email: "", phone: "", role: "", experience: "", portfolioUrl: "", whyJoin: "" },
  });
  const [otherRole, setOtherRole] = useState("");
  const watched = form.watch("role");

  const onSubmit = async (data: F) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        role: data.role === "Other" && otherRole.trim() ? `Other: ${otherRole.trim()}` : data.role,
      };
      const res = await fetch(`${API_BASE}/forms/internship`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (res.ok) { onSuccess(data.email); form.reset(); setOtherRole(""); }
      else toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } catch {
      toast({ title: "Connection error", description: "Please check your connection.", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <TextField form={form} name="name"  label="Full Name" placeholder="Jane Smith" />
        <TextField form={form} name="email" label="Email Address" type="email" placeholder="you@example.com" />
        <TextField form={form} name="phone" label="Phone (optional)" type="tel" placeholder="+1 234 567 8900" />
        <SelectField form={form} name="role" label="Role Applying For" options={INTERN_ROLES} placeholder="Select a role" />
        {watched === "Other" && (
          <input className="gb-input" placeholder="Please describe your role..." value={otherRole} onChange={(e) => setOtherRole(e.target.value)} />
        )}
        <FormField control={form.control} name="experience" render={({ field }) => (
          <FormItem>
            <FormLabel style={fieldLabel}>Experience Level</FormLabel>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              {INTERN_EXPERIENCE.map((opt) => (
                <button key={opt} type="button" onClick={() => field.onChange(opt)} style={{
                  flex: 1, padding: "11px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  fontFamily: "'Inter', sans-serif", cursor: "pointer",
                  border: field.value === opt ? "1.5px solid #1E293B" : "1.5px solid #E5E5E0",
                  background: field.value === opt ? "#1E293B" : "#FFFFFF",
                  color: field.value === opt ? "#FFFFFF" : "#5F5F5F", transition: "all 0.15s",
                }}>{opt}</button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )} />
        <TextField form={form} name="portfolioUrl" label="Portfolio / Work Link (optional)" placeholder="https://yourwork.com" />
        <TextAreaField form={form} name="whyJoin" label="Why do you want to join?" placeholder="Tell us what drives you..." />
        <SubmitButton submitting={submitting} text="Apply for Internship" />
      </form>
    </Form>
  );
}

// ── Sub-form: Freelancer / Talent Network ─────────────────────────────────────
function FreelancerForm({ onSuccess, submitting, setSubmitting, toast }: FormProps) {
  type F = z.infer<typeof freelanceSchema>;
  const form = useForm<F>({
    resolver: zodResolver(freelanceSchema as any),
    mode: "onBlur",
    defaultValues: { name: "", email: "", phone: "", skills: [], portfolioUrl: "", experience: "" },
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [otherSkill, setOtherSkill] = useState("");

  const toggleSkill = (skill: string) => {
    const next = selectedSkills.includes(skill) ? selectedSkills.filter((s) => s !== skill) : [...selectedSkills, skill];
    setSelectedSkills(next);
    form.setValue("skills", next, { shouldValidate: true });
  };

  const onSubmit = async (data: F) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/forms/freelancers`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, otherSkill: selectedSkills.includes("Other") ? otherSkill : undefined }),
      });
      if (res.ok) { onSuccess(data.email); form.reset(); setSelectedSkills([]); setOtherSkill(""); }
      else toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } catch {
      toast({ title: "Connection error", description: "Please check your connection.", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <TextField form={form} name="name"  label="Full Name" placeholder="Your full name" />
        <TextField form={form} name="email" label="Email Address" type="email" placeholder="you@example.com" />
        <TextField form={form} name="phone" label="Contact Number" type="tel" placeholder="+1 234 567 8900" />
        <FormField control={form.control} name="skills" render={() => (
          <FormItem>
            <FormLabel style={fieldLabel}>Skills (select all that apply)</FormLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
              {FREELANCE_SKILLS.map((skill) => (
                <button key={skill} type="button" onClick={() => toggleSkill(skill)} style={{
                  padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: "1.5px solid",
                  borderColor: selectedSkills.includes(skill) ? "#1E293B" : "rgba(11,11,11,0.15)",
                  background: selectedSkills.includes(skill) ? "#1E293B" : "transparent",
                  color: selectedSkills.includes(skill) ? "#FFFFFF" : "#0A0A0A",
                  cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                }}>{skill}</button>
              ))}
            </div>
            {selectedSkills.includes("Other") && (
              <input className="gb-input" style={{ marginTop: 10 }} placeholder="Please describe your skill..."
                value={otherSkill} onChange={(e) => setOtherSkill(e.target.value)} />
            )}
            <FormMessage />
          </FormItem>
        )} />
        <TextField form={form} name="portfolioUrl" label="Portfolio / Work Samples URL (optional)" placeholder="https://yourportfolio.com" />
        <SelectField form={form} name="experience" label="Years of Experience" options={EXPERIENCE_OPTIONS} placeholder="Select experience level" />
        <SubmitButton submitting={submitting} text="Apply for the Talent Network" />
      </form>
    </Form>
  );
}

// ── Shared field primitives ───────────────────────────────────────────────────
const fieldLabel: CSSProperties = { fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "#0A0A0A" };

function TextField({ form, name, label, placeholder, type = "text" }: { form: any; name: string; label: string; placeholder?: string; type?: string }) {
  return (
    <FormField control={form.control} name={name} render={({ field }: any) => (
      <FormItem>
        <FormLabel style={fieldLabel}>{label}</FormLabel>
        <FormControl><input type={type} className="gb-input" placeholder={placeholder} {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );
}

function SelectField({ form, name, label, options, placeholder }: { form: any; name: string; label: string; options: string[]; placeholder: string }) {
  return (
    <FormField control={form.control} name={name} render={({ field }: any) => (
      <FormItem>
        <FormLabel style={fieldLabel}>{label}</FormLabel>
        <FormControl>
          <select className="gb-input" style={{ height: 48, appearance: "none" }} value={field.value || ""} onChange={field.onChange}>
            <option value="">{placeholder}</option>
            {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );
}

function TextAreaField({ form, name, label, placeholder }: { form: any; name: string; label: string; placeholder?: string }) {
  return (
    <FormField control={form.control} name={name} render={({ field }: any) => (
      <FormItem>
        <FormLabel style={fieldLabel}>{label}</FormLabel>
        <FormControl>
          <textarea className="gb-input" style={{ minHeight: 110, resize: "vertical", lineHeight: "1.6" }} placeholder={placeholder} {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );
}

function SubmitButton({ submitting, text }: { submitting: boolean; text: string }) {
  return (
    <button type="submit" disabled={submitting} className="gb-btn"
      style={{ justifyContent: "center", marginTop: 6, padding: "14px 0", fontSize: 15, opacity: submitting ? 0.65 : 1 }}
      data-testid="career-submit">
      {submitting ? "Submitting…" : text}
      {!submitting && <ArrowRight className="w-4 h-4" />}
    </button>
  );
}
