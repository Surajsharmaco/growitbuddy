import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { API_BASE } from "@/lib/api";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";
import HalftoneDots from "@/components/effects/HalftoneDots";
import EcosystemOptIn from "@/components/EcosystemOptIn";

interface ContactPageData {
  heroHeadline: string;
  heroSubtext: string;
  bookingLabel: string;
  bookingHeadline: string;
  calLink: string;
  formHeadline: string;
  formSubtext: string;
  formSuccessHeadline: string;
  formSuccessSubtext: string;
  contactInfo: { label: string; value: string; href: string }[];
}

const CONTACT_DEFAULTS: ContactPageData = {
  heroHeadline: "Let's build your authority system.",
  heroSubtext: "We partner with ambitious founders and creators who are serious about authority. One strategy call is all it takes to get started.",
  bookingLabel: "Book a call",
  bookingHeadline: "Pick a time that works for you.",
  calLink: "growitbuddy.com/growth-strategy-call",
  formHeadline: "Send us a message",
  formSubtext: "We respond to every inquiry within 24 hours.",
  formSuccessHeadline: "Message sent!",
  formSuccessSubtext: "We'll be in touch within 24 hours to schedule your free strategy call.",
  contactInfo: [
    { label: "Email", value: "cs.growitbuddy@gmail.com", href: "mailto:cs.growitbuddy@gmail.com" },
    { label: "Response time", value: "Within 24 hours", href: "" },
    { label: "Based", value: "Global - 4 timezones", href: "" },
    { label: "Next step", value: "Free 30-min strategy call", href: "" },
  ],
};

const CAL_NS = "gb-booking";
const CAL_ELEMENT_ID = "gb-cal-inline";

function CalEmbed({ calLink }: { calLink: string }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!calLink) return;
    const w = window as any;

    // Key the guard by calLink so changing the link in admin re-initializes
    const doneKey = `__gbCalDone_${calLink}`;
    if (w[doneKey]) return;

    try {
      if (!w.Cal) {
        // eslint-disable-next-line no-new-func
        new Function("window", `
          (function(C,A,L){var p=function(a,ar){a.q.push(ar)};var d=C.document;C.Cal=C.Cal||function(){var cal=C.Cal;var ar=arguments;if(!cal.loaded){cal.ns={};cal.q=cal.q||[];d.head.appendChild(d.createElement("script")).src=A;cal.loaded=true}if(ar[0]===L){var api=function(){p(api,arguments)};var namespace=ar[1];api.q=api.q||[];if(typeof namespace==="string"){cal.ns[namespace]=cal.ns[namespace]||api;p(cal.ns[namespace],ar);p(cal,["initNamespace",namespace])}else p(cal,ar);return}p(cal,ar)};})(window,"https://app.cal.com/embed/embed.js","init");
        `)(window);
      }

      w.Cal("init", CAL_NS, { origin: "https://app.cal.com" });
      w.Cal.ns[CAL_NS]("inline", {
        elementOrSelector: `#${CAL_ELEMENT_ID}`,
        config: { layout: "month_view", useSlotsViewOnSmallScreen: true },
        calLink,
      });
      w.Cal.ns[CAL_NS]("ui", {
        hideEventTypeDetails: false,
        layout: "month_view",
        styles: { branding: { brandColor: "#EFEFEA" } },
      });

      w[doneKey] = true;

      const target = document.getElementById(CAL_ELEMENT_ID);
      if (target) {
        const observer = new MutationObserver(() => {
          if (target.querySelector("iframe")) {
            setLoaded(true);
            observer.disconnect();
          }
        });
        observer.observe(target, { childList: true, subtree: true });
        return () => { observer.disconnect(); };
      }
      return undefined;
    } catch (err) {
      console.warn("Cal embed init error:", err);
      setLoaded(true);
      return undefined;
    }
  }, [calLink]);

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 600 }}>
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "#f4f4f2",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, border: "3px solid rgba(11,11,11,0.12)",
            borderTopColor: "#EFEFEA", borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ fontSize: 13, fontWeight: 500, color: "#7A7A85", fontFamily: "'Inter', sans-serif" }}>
            Loading calendar...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      <div
        id={CAL_ELEMENT_ID}
        style={{ width: "100%", minHeight: 600 }}
      />
    </div>
  );
}

const schema = z.object({
  name: z.string().min(2, "Enter your full name").max(80, "Name too long").regex(/^[a-zA-Z\s'-]+$/, "Name should only contain letters"),
  email: z.string().email("Enter a valid email address (e.g. you@example.com)"),
  company: z.string().min(1, "Enter your company or brand name").max(100, "Company name too long"),
  message: z.string().min(20, "Please write at least 20 characters about your goals"),
});
type F = z.infer<typeof schema>;

export default function Contact() {
  const cms = usePublicContent<ContactPageData>("contact", CONTACT_DEFAULTS);
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const successRef = useRef<HTMLDivElement>(null);
  const form = useForm<F>({ resolver: zodResolver(schema as any), mode: "onBlur", defaultValues: { name: "", email: "", company: "", message: "" } });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get("to");
    if (to) {
      const id = to === "form" ? "section-form" : "section-cal";
      const attempt = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };
      setTimeout(attempt, 200);
    }
  }, []);

  const onSubmit = async (data: F) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/forms/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
      toast({ title: "Connection error", description: "Please check your connection and try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif" }}>
      <SEOMeta
        title="Book a Strategy Call | Contact GrowitBuddy"
        description="Talk to the GrowitBuddy team. Book a free 30-minute authority strategy call or send a message - we respond within 24 hours. Based globally across 4 timezones."
        schema={{
          "@type": "ContactPage",
          "name": "Contact GrowitBuddy",
          "url": "https://growitbuddy.com/contact",
          "description": "Book a free strategy call or send a message to GrowitBuddy.",
          "mainEntity": {
            "@type": "Organization",
            "@id": "https://growitbuddy.com/#organization",
            "name": "GrowitBuddy",
            "email": "cs.growitbuddy@gmail.com",
            "url": "https://growitbuddy.com"
          }
        } as Record<string, unknown>}
      />

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 80, paddingLeft: 24, paddingRight: 24, background: "#FFFFFF", borderBottom: "1px solid #E5E5E0", position: "relative", overflow: "hidden" }}>
        <HalftoneDots
          style={{ position: "absolute", bottom: 0, right: 0, opacity: 0.13, pointerEvents: "none" }}
          origin="bottom-right" width={280} height={220}
        />
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 16 }}>Contact</p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              style={{ fontWeight: 800, fontSize: "clamp(28px, 6.5vw, 80px)", letterSpacing: "-0.04em", lineHeight: "1.08", color: "#0A0A0A" }}
            >
              {cms.heroHeadline}
            </motion.h1>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: "clamp(15px, 4.5vw, 18px)", lineHeight: "1.75", color: "#5F5F5F", alignSelf: "flex-end" }}
          >
            {cms.heroSubtext}
          </motion.p>
        </div>
      </section>

      {/* Cal.com Booking */}
      <section id="section-cal" style={{ padding: "80px 24px", background: "#FFFFFF", borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 12 }}>{cms.bookingLabel}</p>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(20px, 3vw, 40px)", letterSpacing: "-0.04em", color: "#0A0A0A", marginBottom: 40, lineHeight: 1.1 }}>
            {cms.bookingHeadline}
          </h2>
          <CalEmbed calLink={cms.calLink || CONTACT_DEFAULTS.calLink} />
        </div>
      </section>

      {/* Who this is for */}
      <section style={{ padding: "80px 24px", background: "#F8F8F6", borderTop: "1px solid #E5E5E0", borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ background: "#FFFFFF", border: "1.5px solid #E5E5E0", borderRadius: 16, padding: "36px 32px" }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 20 }}>Who this is for</p>
              {[
                "Founders building a personal brand or inbound machine",
                "Creators ready to scale output with a real system",
                "Brands investing in long-term content authority",
                "SaaS, agencies, and ecommerce companies ready to grow organically",
                "Anyone serious about sustainable, compounding growth",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                  <span style={{ color: "var(--gb-accent)", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <p style={{ fontSize: 14, color: "#5F5F5F", lineHeight: "1.65", margin: 0 }}>{item}</p>
                </div>
              ))}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              style={{ background: "#1E293B", borderRadius: 16, padding: "36px 32px" }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(194,168,120,0.7)", marginBottom: 20 }}>Who this is NOT for</p>
              {[
                "Looking for the cheapest option on the market",
                "Not ready to invest in a real content strategy",
                "Wanting overnight results without building foundations",
                "Businesses without a clear product or offer to promote",
                "Teams not willing to participate in their own brand story",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✕</span>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: "1.65", margin: 0 }}>{item}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "80px 24px", background: "#FFFFFF", borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginBottom: 48 }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 12 }}>
              Onboarding process
            </p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(18px, 3.5vw, 38px)", letterSpacing: "-0.035em", color: "#0A0A0A", lineHeight: 1.1 }}>
              What happens after you reach out.
            </h2>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 2, background: "rgba(10,10,10,0.03)", borderRadius: 16, overflow: "hidden" }}>
            {[
              { step: "01", label: "Strategy Call", desc: "30-minute session to understand your goals, gaps, and what success looks like for you." },
              { step: "02", label: "Audit & Plan", desc: "We audit your current presence and map a clear 90-day system - positioning, content, and distribution." },
              { step: "03", label: "Proposal", desc: "A tailored proposal within 48 hours. No generic packages - a system built for your specific situation." },
              { step: "04", label: "Execution", desc: "Onboarding within 5–7 days. Monthly reviews, clear KPIs, and full transparency throughout." },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                style={{ background: "#FFFFFF", padding: "32px 28px" }}
              >
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gb-accent)", marginBottom: 16 }}>{s.step}</p>
                <h3 style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", color: "#0A0A0A", marginBottom: 10 }}>{s.label}</h3>
                <p style={{ fontSize: 14, color: "#5F5F5F", lineHeight: "1.7", margin: 0 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
          <div style={{ marginTop: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "wrap", borderTop: "1px solid #EEEEEA", paddingTop: 28 }}>
            {[
              "Response time: within 24 hours",
              "Minimum engagement: 3 months",
              "Based globally — 4 timezones",
            ].map((text, i, arr) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 24px", fontSize: 13, color: "#5F5F5F", fontWeight: 500 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#C2A878", display: "inline-block", flexShrink: 0 }} />
                  {text}
                </span>
                {i < arr.length - 1 && (
                  <span style={{ width: 1, height: 14, background: "#E0E0D8", display: "inline-block", flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "80px 24px", background: "#F8F8F6", borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[860px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginBottom: 48 }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: 12 }}>
              Common questions
            </p>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(18px, 3.5vw, 38px)", letterSpacing: "-0.035em", color: "#0A0A0A", lineHeight: 1.1 }}>
              Frequently asked questions.
            </h2>
          </motion.div>
          {[
            {
              q: "How long before we see results?",
              a: "Most clients begin seeing organic traction within 60–90 days. Meaningful compounding growth typically builds from month 3 onward. We set clear KPIs at the start so you always know what we're measuring.",
            },
            {
              q: "What is the minimum engagement period?",
              a: "We work on a minimum 3-month basis. Authority and content systems require consistency to compound - short engagements don't produce the outcomes we're known for.",
            },
            {
              q: "Do you work with small businesses or only large brands?",
              a: "We work with founders, individual creators, growing companies, and established brands. The right fit is about mindset and seriousness - not company size.",
            },
            {
              q: "What makes GrowitBuddy different from a standard SMMA?",
              a: "We're not a social media management agency. We build content infrastructure - the systems, distribution, and positioning that create compounding inbound demand. Our work is strategic and execution-heavy.",
            },
            {
              q: "Can you handle everything, or do we need our own team?",
              a: "We can operate fully done-for-you, or in a hybrid model where we augment your team. We'll recommend the right structure during the strategy call.",
            },
            {
              q: "How do I know if this is the right investment for us?",
              a: "If you have a real product or offer, an audience worth reaching, and a commitment to building long-term - the strategy call will make the fit clear quickly.",
            },
          ].map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              style={{ borderTop: "1px solid #E5E5E0", padding: "28px 0" }}
            >
              <h3 style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", color: "#0A0A0A", marginBottom: 12, lineHeight: 1.4 }}>{faq.q}</h3>
              <p style={{ fontSize: 14, color: "#5F5F5F", lineHeight: "1.75", margin: 0 }}>{faq.a}</p>
            </motion.div>
          ))}
          <div style={{ borderTop: "1px solid #E5E5E0" }} />
        </div>
      </section>

      {/* Form + info */}
      <section id="section-form" style={{ padding: "80px 24px 100px" }}>
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-16">
          {/* Info */}
          <div>
            <div style={{ borderTop: "1px solid #E5E5E0", display: "flex", flexDirection: "column" }}>
              {cms.contactInfo.map((item) => (
                <div key={item.label} style={{ padding: "20px 0", borderBottom: "1px solid #E5E5E0" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 6 }}>{item.label}</p>
                  {item.href
                    ? <a href={item.href} style={{ fontSize: 16, fontWeight: 600, color: "#0A0A0A", textDecoration: "none" }} className="hover:opacity-60 transition-opacity">{item.value}</a>
                    : <p style={{ fontSize: 16, fontWeight: 500, color: "#0A0A0A" }}>{item.value}</p>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <motion.div ref={successRef} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {submitted ? (
              <>
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1.5px solid #E5E5E0",
                    borderRadius: 20,
                    padding: "60px 40px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(30,41,59,0.12)", border: "1.5px solid rgba(30,41,59,0.35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 30, fontWeight: 800, color: "var(--gb-accent-hover)" }}>✓</div>
                  <h3 style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 12 }}>{cms.formSuccessHeadline}</h3>
                  <p style={{ fontSize: 16, color: "#5F5F5F", lineHeight: "1.75" }}>
                    {cms.formSuccessSubtext}
                  </p>
                </div>
                <EcosystemOptIn context="contact" prefillEmail={submittedEmail} />
              </>
            ) : (
              <div style={{ background: "#FFFFFF", border: "1.5px solid #E5E5E0", borderRadius: 20, padding: "40px 36px" }}>
                <h3 style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 8 }}>{cms.formHeadline}</h3>
                <p style={{ fontSize: 14, color: "#5F5F5F", marginBottom: 28 }}>{cms.formSubtext}</p>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 16 }}>
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "#0A0A0A" }}>Name</FormLabel>
                          <FormControl><input className="gb-input" placeholder="Your name" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "#0A0A0A" }}>Email</FormLabel>
                          <FormControl><input type="email" className="gb-input" placeholder="you@example.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="company" render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "#0A0A0A" }}>Company / Brand</FormLabel>
                        <FormControl><input className="gb-input" placeholder="Your company" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="message" render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "#0A0A0A" }}>What are you looking to achieve?</FormLabel>
                        <FormControl>
                          <textarea
                            className="gb-input"
                            style={{ minHeight: 140, resize: "none", lineHeight: "1.6" }}
                            placeholder="Tell us about your goals and challenges..."
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
                      data-testid="button-book-call-cta"
                    >
                      {submitting ? "Sending…" : "Send Message"}
                      {!submitting && <ArrowRight className="w-4 h-4" />}
                    </button>
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
