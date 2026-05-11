import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ArrowRight } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import SEOMeta from "@/components/SEOMeta";
import EcosystemOptIn from "@/components/EcosystemOptIn";
import { API_BASE } from "@/lib/api";

const ROLES = [
  "Video Editing",
  "Graphic Design",
  "Thumbnail Design",
  "Content Writing",
  "Copywriting",
  "Social Media",
  "Motion Design",
  "AI Automation",
  "Web Design",
  "Brand Strategy",
  "Meme Creation",
  "Other",
];

const EXPERIENCE_OPTIONS = ["Beginner", "Intermediate"];

const schema = z.object({
  name: z.string().min(2, "Enter your full name").max(80).regex(/^[a-zA-Z\s'-]+$/, "Name should only contain letters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, "Enter a valid phone number").or(z.literal("")).optional(),
  role: z.string().min(1, "Please select a role"),
  otherRole: z.string().optional(),
  experience: z.string().min(1, "Please select your experience level"),
  portfolioUrl: z.string().url("Enter a valid URL (must start with https://)").or(z.literal("")).optional(),
  whyJoin: z.string().min(20, "Please write at least 20 characters").max(1000, "Max 1000 characters"),
});
type F = z.infer<typeof schema>;

export default function Internship() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const successRef = useRef<HTMLDivElement>(null);

  const form = useForm<F>({
    resolver: zodResolver(schema as any),
    mode: "onBlur",
    defaultValues: { name: "", email: "", phone: "", role: "", otherRole: "", experience: "", portfolioUrl: "", whyJoin: "" },
  });

  const watchRole = form.watch("role");

  const onSubmit = async (data: F) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        role: data.role === "Other" && data.otherRole?.trim() ? `Other: ${data.otherRole.trim()}` : data.role,
      };
      const res = await fetch(`${API_BASE}/forms/internship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSubmittedEmail(data.email);
        setSubmitted(true);
        form.reset();
        setTimeout(() => successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      } else {
        toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Connection error", description: "Please check your connection.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%",
    padding: "13px 16px",
    borderRadius: 10,
    border: "1.5px solid #E5E5E0",
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    color: "#0A0A0A",
    background: "#FFFFFF",
    outline: "none",
    transition: "border-color 0.15s",
    boxSizing: "border-box",
  };

  const lbl: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#8A8A8A",
    marginBottom: 7,
  };

  return (
    <div style={{ background: "var(--gb-bg)", fontFamily: "'Inter', sans-serif", minHeight: "100vh" }}>
      <SEOMeta
        title="Internship — GrowitBuddy"
        description="Work on real projects, gain hands-on experience, and become part of a high-performance content and authority studio."
        robots="noindex,follow"
      />

      {/* Hero */}
      <section style={{ paddingTop: 100, paddingBottom: 72, background: "#FFFFFF", borderBottom: "1px solid #E5E5E0" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px" }}>
          <span className="gb-eyebrow" style={{ marginBottom: 18, display: "block" }}>Creator Internship</span>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ fontWeight: 900, fontSize: "clamp(28px, 6vw, 72px)", letterSpacing: "-0.04em", lineHeight: 1.08, color: "#0A0A0A", maxWidth: "18ch", marginBottom: 20 }}
          >
            Start building real-world experience.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 17, color: "#5F5F5F", lineHeight: 1.75, maxWidth: "50ch" }}
          >
            Work alongside creators, brands, and modern content systems while learning through execution — not theory.
          </motion.p>
        </div>
      </section>

      {/* Content + Form */}
      <section style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}
          className="internship-grid">
          <style>{`
            @media (max-width: 768px) {
              .internship-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
            }
          `}</style>

          {/* Left */}
          <div>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(22px, 2.5vw, 32px)", letterSpacing: "-0.025em", color: "#0A0A0A", marginBottom: 28, lineHeight: 1.2 }}>
              What you'll experience.
            </h2>
            <ul style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 44 }}>
              {[
                "Real projects with practical execution",
                "Structured feedback and collaborative workflows",
                "Exposure to modern creator and authority systems",
                "Opportunities to build your portfolio with shipped work",
                "A path toward freelance, creator, or full-time opportunities",
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
                >
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(139,58,26,0.08)", border: "1px solid rgba(139,58,26,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <Check size={10} color="var(--gb-accent)" />
                  </span>
                  <span style={{ fontSize: 15, color: "#5F5F5F", lineHeight: 1.65 }}>{item}</span>
                </motion.li>
              ))}
            </ul>

            <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "22px 26px", border: "1px solid #E5E5E0" }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#C2A878", marginBottom: 12 }}>
                Ideal For
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {[
                  "Creators starting their journey",
                  "People who want hands-on experience instead of only tutorials",
                  "Early-stage creatives looking to sharpen real-world skills",
                  "Ambitious individuals who want to grow through execution",
                ].map((item, i) => (
                  <li key={i} style={{ fontSize: 14, color: "#5F5F5F", lineHeight: 1.6, display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#C2A878", marginTop: 2, flexShrink: 0 }}>—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — Form */}
          <div ref={successRef}>
            {submitted ? (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ borderRadius: 16, background: "#FFFFFF", border: "1px solid #E5E5E0", padding: "48px 36px", textAlign: "center" }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(139,58,26,0.08)", border: "1.5px solid rgba(139,58,26,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <Check size={22} color="var(--gb-accent)" />
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.025em", color: "#0A0A0A", marginBottom: 10 }}>Application received.</h3>
                  <p style={{ fontSize: 14, color: "#5F5F5F", lineHeight: 1.7, maxWidth: "30ch", margin: "0 auto" }}>
                    We'll review it and get back to you within a few days.
                  </p>
                </motion.div>
                <EcosystemOptIn context="internship" prefillEmail={submittedEmail} />
              </>
            ) : (
              <div style={{ background: "#FFFFFF", border: "1px solid #E5E5E0", borderRadius: 16, padding: "36px 32px" }}>
                <h3 style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em", color: "#0A0A0A", marginBottom: 6 }}>Apply for Internship</h3>
                <p style={{ fontSize: 13, color: "#8A8A8A", marginBottom: 28, lineHeight: 1.6 }}>
                  We read every application. If you're a fit, we'll be in touch.
                </p>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem style={{ display: "flex", flexDirection: "column" }}>
                          <FormLabel style={lbl}>Full Name</FormLabel>
                          <FormControl>
                            <input {...field} placeholder="Jane Smith" style={inp} />
                          </FormControl>
                          <FormMessage style={{ fontSize: 11, color: "#ef4444" }} />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem style={{ display: "flex", flexDirection: "column" }}>
                          <FormLabel style={lbl}>Email</FormLabel>
                          <FormControl>
                            <input {...field} type="email" placeholder="you@example.com" style={inp} />
                          </FormControl>
                          <FormMessage style={{ fontSize: 11, color: "#ef4444" }} />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem style={{ display: "flex", flexDirection: "column" }}>
                        <FormLabel style={lbl}>Phone <span style={{ fontWeight: 400, opacity: 0.6, textTransform: "none", letterSpacing: 0 }}>(optional)</span></FormLabel>
                        <FormControl>
                          <input {...field} type="tel" placeholder="+1 234 567 8900" style={inp} />
                        </FormControl>
                        <FormMessage style={{ fontSize: 11, color: "#ef4444" }} />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="role" render={({ field }) => (
                      <FormItem style={{ display: "flex", flexDirection: "column" }}>
                        <FormLabel style={lbl}>Role Applying For</FormLabel>
                        <FormControl>
                          <select {...field} style={{ ...inp, cursor: "pointer", color: field.value ? "#0A0A0A" : "#8A8A8A" }}>
                            <option value="" disabled style={{ color: "#8A8A8A" }}>Select a role</option>
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </FormControl>
                        <FormMessage style={{ fontSize: 11, color: "#ef4444" }} />
                      </FormItem>
                    )} />

                    {watchRole === "Other" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.2 }}
                      >
                        <FormField control={form.control} name="otherRole" render={({ field }) => (
                          <FormItem style={{ display: "flex", flexDirection: "column" }}>
                            <FormLabel style={lbl}>Please describe your role</FormLabel>
                            <FormControl>
                              <input {...field} placeholder="e.g. Podcast editing, SEO, Community management..." style={inp} />
                            </FormControl>
                            <FormMessage style={{ fontSize: 11, color: "#ef4444" }} />
                          </FormItem>
                        )} />
                      </motion.div>
                    )}

                    <FormField control={form.control} name="experience" render={({ field }) => (
                      <FormItem style={{ display: "flex", flexDirection: "column" }}>
                        <FormLabel style={lbl}>Experience Level</FormLabel>
                        <div style={{ display: "flex", gap: 10 }}>
                          {EXPERIENCE_OPTIONS.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => field.onChange(opt)}
                              style={{
                                flex: 1,
                                padding: "11px 16px",
                                borderRadius: 10,
                                fontSize: 13,
                                fontWeight: 600,
                                fontFamily: "'Inter', sans-serif",
                                cursor: "pointer",
                                border: field.value === opt ? "1.5px solid #1E293B" : "1.5px solid #E5E5E0",
                                background: field.value === opt ? "#1E293B" : "#FFFFFF",
                                color: field.value === opt ? "#FFFFFF" : "#5F5F5F",
                                transition: "all 0.15s",
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        <FormMessage style={{ fontSize: 11, color: "#ef4444" }} />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="portfolioUrl" render={({ field }) => (
                      <FormItem style={{ display: "flex", flexDirection: "column" }}>
                        <FormLabel style={lbl}>Portfolio / Work Link <span style={{ fontWeight: 400, opacity: 0.6, textTransform: "none", letterSpacing: 0 }}>(optional)</span></FormLabel>
                        <FormControl>
                          <input {...field} type="url" placeholder="https://yourwork.com" style={inp} />
                        </FormControl>
                        <FormMessage style={{ fontSize: 11, color: "#ef4444" }} />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="whyJoin" render={({ field }) => (
                      <FormItem style={{ display: "flex", flexDirection: "column" }}>
                        <FormLabel style={lbl}>Why do you want to join?</FormLabel>
                        <FormControl>
                          <textarea
                            {...field}
                            rows={4}
                            placeholder="Tell us what drives you and what you hope to build here..."
                            style={{ ...inp, resize: "vertical", minHeight: 96 }}
                          />
                        </FormControl>
                        <FormMessage style={{ fontSize: 11, color: "#ef4444" }} />
                      </FormItem>
                    )} />

                    <button
                      type="submit"
                      disabled={submitting}
                      className="gb-btn"
                      style={{ padding: "14px 28px", fontSize: 15, width: "100%", justifyContent: "center", marginTop: 4, opacity: submitting ? 0.65 : 1 }}
                    >
                      {submitting ? "Submitting…" : "Apply for Internship"}
                      {!submitting && <ArrowRight size={14} style={{ marginLeft: 8 }} />}
                    </button>

                    <p style={{ fontSize: 12, color: "#8A8A8A", textAlign: "center", lineHeight: 1.6 }}>
                      Questions?{" "}
                      <a href="mailto:careers.growitbuddy@gmail.com" style={{ color: "#1E293B", fontWeight: 600, textDecoration: "none" }}>
                        careers.growitbuddy@gmail.com
                      </a>
                    </p>
                  </form>
                </Form>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
