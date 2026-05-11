import { useState, useRef } from "react";
import { motion } from "framer-motion";
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

interface FullTimePageData {
  heroLabel: string; heroHeadline: string; heroSubtext: string;
  perksHeadline: string; perks: string[];
  rolesLabel: string; roles: string[];
  formHeadline: string; formSubtext: string;
  formSuccessHeadline: string; formSuccessSubtext: string;
}
const FT_DEFAULTS: FullTimePageData = {
  heroLabel: "Careers at GrowitBuddy",
  heroHeadline: "Build modern authority systems with us.",
  heroSubtext: "We're building a high-output creative ecosystem for founders, creators, and brands - and we're looking for ambitious people who want to do meaningful work.",
  perksHeadline: "Why join full-time?",
  perks: ["Flexible remote-first work environment", "Work directly on creator and authority systems", "High ownership and creative impact", "Access to modern workflows, systems, and frameworks", "Opportunities to grow across multiple creative disciplines"],
  rolesLabel: "Open Roles",
  roles: ["Content Strategist", "Video Editor", "Graphic Designer", "Motion Designer", "Thumbnail Designer", "Copywriter", "Social Media Manager", "Distribution Specialist", "AI Automation Specialist", "Web & Funnel Designer", "Community Manager", "Operations Coordinator"],
  formHeadline: "Apply for a full-time role",
  formSubtext: "We review every application. Expect a response within 7 business days.",
  formSuccessHeadline: "Application received.",
  formSuccessSubtext: "We review every application carefully. If you are a fit, we will reach out within 7 business days.",
};

const ROLES = [
  "Content Strategist",
  "Video Editor",
  "Graphic Designer",
  "Motion Designer",
  "Thumbnail Designer",
  "Copywriter",
  "Social Media Manager",
  "Distribution Specialist",
  "AI Automation Specialist",
  "Web & Funnel Designer",
  "Community Manager",
  "Meme Creator",
  "Operations Coordinator",
  "Other",
];

const EXPERIENCE_OPTIONS = [
  "Less than 1 year",
  "1–2 years",
  "3–5 years",
  "5+ years",
];

const schema = z.object({
  name: z.string().min(2, "Enter your full name").max(80, "Name too long").regex(/^[a-zA-Z\s'-]+$/, "Name should only contain letters"),
  email: z.string().email("Enter a valid email address (e.g. you@example.com)"),
  phone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, "Enter a valid phone number (e.g. +1 234 567 8900)"),
  role: z.string().min(1, "Please select a role"),
  experience: z.string().min(1, "Please select your experience level"),
  linkedinUrl: z.string().url("Enter a valid URL (must start with https://)"),
  coverNote: z.string().min(30, "Please write at least 30 characters about yourself"),
});
type F = z.infer<typeof schema>;

export default function FullTime() {
  const ft = usePublicContent<FullTimePageData>("fulltime", FT_DEFAULTS);
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const successRef = useRef<HTMLDivElement>(null);
  const [otherRole, setOtherRole] = useState("");

  const form = useForm<F>({
    resolver: zodResolver(schema as any),
    mode: "onBlur",
    defaultValues: { name: "", email: "", phone: "", role: "", experience: "", linkedinUrl: "", coverNote: "" },
  });

  const watchedRole = form.watch("role");

  const onSubmit = async (data: F) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/forms/full-time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, otherRole: data.role === "Other" ? otherRole : undefined }),
      });
      if (res.ok) {
        setSubmittedEmail(data.email);
        setSubmitted(true);
        form.reset();
        setOtherRole("");
        setTimeout(() => successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      } else {
        toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Connection error", description: "Please check your connection and try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif" }}>
      <SEOMeta
        title="Full-Time Careers - GrowitBuddy"
        description="Join the GrowitBuddy team full-time. We are hiring content strategists, writers, editors, and growth specialists who want to do their best work."
        robots="noindex,follow"
      />

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 80, paddingLeft: 24, paddingRight: 24, borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 16 }}>{ft.heroLabel}</p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ fontWeight: 800, fontSize: "clamp(28px, 7vw, 88px)", letterSpacing: "-0.04em", lineHeight: "1.08", color: "#0A0A0A", maxWidth: "18ch", marginBottom: 24 }}
          >
            {ft.heroHeadline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: "clamp(15px, 4.5vw, 18px)", color: "#5F5F5F", lineHeight: "1.75", maxWidth: "52ch" }}
          >
            {ft.heroSubtext}
          </motion.p>
        </div>
      </section>

      {/* Perks + Form */}
      <section style={{ padding: "80px 24px", background: "#FFFFFF" }}>
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Perks */}
          <div>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(20px, 3vw, 40px)", letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 32, lineHeight: 1.15 }}>
              {ft.perksHeadline}
            </h2>
            <ul style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
              {ft.perks.map((perk, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.5 }}
                  style={{ display: "flex", alignItems: "center", gap: 14 }}
                >
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(10,10,10,0.03)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check className="w-3.5 h-3.5" style={{ color: "#0A0A0A" }} />
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: "#0A0A0A" }}>{perk}</span>
                </motion.li>
              ))}
            </ul>

            <div style={{ background: "#EFEFEA", borderRadius: 16, padding: "28px 32px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 14 }}>{ft.rolesLabel}</p>
              {ft.roles.map((role, i) => (
                <p key={i} style={{ fontSize: 14, color: "#5F5F5F", lineHeight: "1.7", marginBottom: 8 }}>{role}</p>
              ))}
            </div>
          </div>

          {/* Form */}
          <motion.div
            ref={successRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {submitted ? (
              <>
                <div style={{ background: "#F8F8F6", border: "1.5px solid #E5E5E0", borderRadius: 20, padding: "48px 36px", textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#EFEFEA", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>✓</div>
                  <h3 style={{ fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 12 }}>{ft.formSuccessHeadline}</h3>
                  <p style={{ fontSize: 15, color: "#5F5F5F", lineHeight: "1.75" }}>
                    {ft.formSuccessSubtext}
                  </p>
                </div>
                <EcosystemOptIn context="full-time" prefillEmail={submittedEmail} />
              </>
            ) : (
              <div style={{ background: "#F8F8F6", border: "1.5px solid #E5E5E0", borderRadius: 20, padding: "40px 32px" }}>
                <h3 style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 8 }}>{ft.formHeadline}</h3>
                <p style={{ fontSize: 14, color: "#5F5F5F", marginBottom: 28 }}>{ft.formSubtext}</p>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "#0A0A0A" }}>Full Name</FormLabel>
                        <FormControl><input className="gb-input" placeholder="Your full name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "#0A0A0A" }}>Email Address</FormLabel>
                        <FormControl><input type="email" className="gb-input" placeholder="you@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "#0A0A0A" }}>Contact Number</FormLabel>
                        <FormControl><input type="tel" className="gb-input" placeholder="+1 234 567 8900" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="role" render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "#0A0A0A" }}>Role You Are Applying For</FormLabel>
                        <FormControl>
                          <select className="gb-input" style={{ height: 48, appearance: "none" }} value={field.value} onChange={field.onChange}>
                            <option value="">Select a role</option>
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </FormControl>
                        {watchedRole === "Other" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ marginTop: 10 }}
                          >
                            <input
                              className="gb-input"
                              placeholder="Please describe the role you are applying for..."
                              value={otherRole}
                              onChange={(e) => setOtherRole(e.target.value)}
                            />
                          </motion.div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="experience" render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "#0A0A0A" }}>Years of Experience</FormLabel>
                        <FormControl>
                          <select className="gb-input" style={{ height: 48, appearance: "none" }} value={field.value} onChange={field.onChange}>
                            <option value="">Select experience level</option>
                            {EXPERIENCE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "#0A0A0A" }}>LinkedIn or Portfolio URL</FormLabel>
                        <FormControl><input className="gb-input" placeholder="https://linkedin.com/in/yourname" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="coverNote" render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "#0A0A0A" }}>Why GrowitBuddy?</FormLabel>
                        <FormControl>
                          <textarea
                            className="gb-input"
                            style={{ minHeight: 120, resize: "none", lineHeight: "1.6" }}
                            placeholder="Tell us about yourself and why you want to join..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <button
                      type="submit"
                      disabled={submitting}
                      className="gb-btn"
                      style={{ justifyContent: "center", marginTop: 8, padding: "14px 0", fontSize: 15 }}
                    >
                      {submitting ? "Submitting…" : "Submit Application"}
                      {!submitting && <ArrowRight className="w-4 h-4" />}
                    </button>
                    <p style={{ fontSize: 13, color: "#8A8A8A", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
                      Questions? Reach us at{" "}
                      <a href="mailto:careers.growitbuddy@gmail.com" style={{ color: "#1E293B", fontWeight: 600, textDecoration: "none" }}>
                        careers.growitbuddy@gmail.com
                      </a>
                    </p>
                  </form>
                </Form>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
