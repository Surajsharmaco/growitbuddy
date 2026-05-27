import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "@/lib/api";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Plus, Trash2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import SEOMeta from "@/components/SEOMeta";
import EcosystemOptIn from "@/components/EcosystemOptIn";

/* ── Schemas ─────────────────────────────────────────────── */
const baseFields = {
  name: z.string().min(2, "Enter your full name").max(80, "Name too long").regex(/^[a-zA-Z\s'-]+$/, "Name should only contain letters"),
  email: z.string().email("Enter a valid email address (e.g. you@example.com)"),
  phone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, "Enter a valid phone number (e.g. +1 234 567 8900)"),
  niche: z.string().min(1, "Please select your niche"),
  monthlyViews: z.string().min(1, "Please select your range"),
};

const influencerSchema = z.object({ ...baseFields, handle: z.string().min(2, "Enter your social handle or profile URL").max(200, "Too long") });
const pageSchema       = z.object({ ...baseFields });

type InfluencerF = z.infer<typeof influencerSchema>;
type PageF       = z.infer<typeof pageSchema>;

/* ── Constants ───────────────────────────────────────────── */
const NICHES = [
  "Business & Entrepreneurship", "Personal Finance", "Health & Wellness",
  "Technology & AI", "Marketing & Growth", "Leadership & Management",
  "Real Estate", "Coaching & Education", "E-commerce", "Other",
];
const VIEWS_RANGES = [
  "Under 10K/month", "10K – 50K/month", "50K – 200K/month", "200K – 1M/month", "1M+/month",
];
const PAGE_COUNT_OPTIONS = ["1", "2", "3", "4", "5", "More than 5"];

/* ── Config ──────────────────────────────────────────────── */
const CONFIG = {
  influencer: {
    seoTitle: "Influencer Network - GrowitBuddy",
    seoDesc: "Join the GrowitBuddy Influencer Network. Built for serious creators who want real authority, meaningful opportunities, and long-term growth.",
    eyebrow: "Influencer Network",
    hero: "Join the Influencer Network.",
    heroSubtext: "Connect, grow, and unlock opportunities. We work with creators who want to build real authority and long-term growth, not just chase views.",
    sectionTitle: "What You Get.",
    benefits: [
      "Growth-focused guidance built around your platform",
      "Collaboration opportunities with serious creators",
      "Access to brand and content opportunities",
      "Strategic support to build lasting authority",
      "A network of creators focused on long-term growth",
    ],
    calloutLabel: "Built for serious creators",
    calloutItems: [
      "Influencers focused on growth and long-term opportunities",
      "Personal brands building real authority in their space",
      "Content creators who want more than just views",
    ],
    formTitle: "Join the Network",
    formSubtitle: "Takes less than 2 minutes. Every application is reviewed personally.",
    submitLabel: "Join the Influencer Network",
    apiEndpoint: "creators",
    successMsg: "We review every application personally. If you're a fit for the Influencer Network, we'll be in touch within 48 hours.",
  },
  page: {
    seoTitle: "Join Distribution Network - GrowitBuddy",
    seoDesc: "Apply to join the GrowitBuddy Distribution Network as a meme or theme page owner and distribute premium content at scale.",
    eyebrow: "Distribution Network",
    hero: "Join the Distribution Network.",
    heroSubtext: "Partner with us to distribute premium content through your page. We work with serious meme and theme page owners who have real, engaged audiences.",
    sectionTitle: "What You Get.",
    benefits: [
      "Consistent high-quality content for your page",
      "Monetise your audience with premium campaigns",
      "Access to brand and content partnerships",
      "Support from a dedicated distribution team",
      "Part of a growing network of high-reach pages",
    ],
    calloutLabel: "Built for page owners",
    calloutItems: [
      "Meme and theme pages with real engagement",
      "Pages focused on consistent content and growth",
      "Page owners who want long-term partnerships",
    ],
    formTitle: "Apply as Page Owner",
    formSubtitle: "Takes less than 2 minutes. Every application is reviewed personally.",
    submitLabel: "Apply as Page Owner",
    apiEndpoint: "page-owner",
    successMsg: "Your application has been received. Our team will review and get back to you.",
  },
};

export type NetworkApplyType = keyof typeof CONFIG;

/* ── Label style helper ──────────────────────────────────── */
const labelStyle: React.CSSProperties = { fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "#0A0A0A" };

/* ── Component ───────────────────────────────────────────── */
export default function NetworkApplyForm({ type }: { type: NetworkApplyType }) {
  const cfg = CONFIG[type];
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [otherNiche, setOtherNiche] = useState("");
  const successRef = useRef<HTMLDivElement>(null);

  /* Page-owner specific state */
  const [pageCount, setPageCount]             = useState("");
  const [pageCountCustom, setPageCountCustom] = useState("");
  const [pages, setPages]                     = useState([{ name: "", link: "" }]);
  const [pagesError, setPagesError]           = useState("");

  const isMoreThan5 = pageCount === "More than 5";

  /* Forms */
  const influencerForm = useForm<InfluencerF>({
    resolver: zodResolver(influencerSchema as any),
    mode: "onBlur",
    defaultValues: { name: "", email: "", phone: "", niche: "", handle: "", monthlyViews: "" },
  });
  const pageForm = useForm<PageF>({
    resolver: zodResolver(pageSchema as any),
    mode: "onBlur",
    defaultValues: { name: "", email: "", phone: "", niche: "", monthlyViews: "" },
  });

  const form = type === "influencer" ? influencerForm : pageForm;

  const watchInfluencerNiche = influencerForm.watch("niche");
  const watchPageNiche       = pageForm.watch("niche");
  const watchNiche           = type === "influencer" ? watchInfluencerNiche : watchPageNiche;

  /* Page entry helpers */
  function addPage() { setPages((prev) => [...prev, { name: "", link: "" }]); }
  function removePage(i: number) { setPages((prev) => prev.filter((_, idx) => idx !== i)); }
  function updatePage(i: number, field: "name" | "link", value: string) {
    setPages((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }

  /* Submit */
  const onSubmitInfluencer = async (data: InfluencerF) => {
    const finalNiche = data.niche === "Other" && otherNiche.trim() ? `Other: ${otherNiche.trim()}` : data.niche;
    await doSubmit({ ...data, niche: finalNiche, type });
  };
  const onSubmitPage = async (data: PageF) => {
    const filledPages = pages.filter((p) => p.name.trim() || p.link.trim());
    if (filledPages.length === 0) {
      setPagesError("Add at least one page name or link.");
      return;
    }
    setPagesError("");
    const finalNiche = data.niche === "Other" && otherNiche.trim() ? `Other: ${otherNiche.trim()}` : data.niche;
    const totalPages = isMoreThan5 ? (pageCountCustom.trim() || "More than 5") : (pageCount || "Not specified");
    await doSubmit({ ...data, niche: finalNiche, type, pageCount: totalPages, pages: filledPages });
  };

  async function doSubmit(payload: Record<string, unknown>) {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/forms/${cfg.apiEndpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSubmittedEmail((payload.email as string) || "");
        setSubmitted(true);
        form.reset();
        setOtherNiche("");
        setPages([{ name: "", link: "" }]);
        setPageCount(""); setPageCountCustom("");
        setTimeout(() => successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      } else {
        toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Connection error", description: "Please check your connection and try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Other niche text field ───────────────────────────── */
  const OtherNicheField = (
    <AnimatePresence>
      {watchNiche === "Other" && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: -8 }}
          animate={{ opacity: 1, height: "auto", marginTop: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          style={{ overflow: "hidden" }}
        >
          <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>Please describe your niche</label>
          <input
            className="gb-input"
            type="text"
            placeholder="e.g. Fitness for busy professionals, Crypto trading..."
            value={otherNiche}
            onChange={(e) => setOtherNiche(e.target.value)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  /* Render */
  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif" }}>
      <SEOMeta title={cfg.seoTitle} description={cfg.seoDesc} />

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 80, paddingLeft: 24, paddingRight: 24, borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 16 }}>{cfg.eyebrow}</p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            style={{ fontWeight: 800, fontSize: "clamp(44px, 7vw, 88px)", letterSpacing: "-0.04em", lineHeight: "1.02", color: "#0A0A0A", maxWidth: "18ch", marginBottom: 24 }}
          >
            {cfg.hero}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ fontSize: 18, color: "#5F5F5F", lineHeight: "1.75", maxWidth: "52ch" }}
          >
            {cfg.heroSubtext}
          </motion.p>
        </div>
      </section>

      {/* Benefits + Form */}
      <section style={{ padding: "80px 24px", background: "#FFFFFF" }}>
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

          {/* Left: Benefits */}
          <div>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(24px, 3vw, 40px)", letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 32, lineHeight: 1.15 }}>
              {cfg.sectionTitle}
            </h2>
            <ul style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
              {cfg.benefits.map((benefit, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.5 }}
                  style={{ display: "flex", alignItems: "center", gap: 14 }}
                >
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(30,41,59,0.08)", border: "1px solid rgba(30,41,59,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={13} color="var(--gb-accent)" />
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: "#0A0A0A" }}>{benefit}</span>
                </motion.li>
              ))}
            </ul>
            <div style={{ background: "#F8F8F6", borderRadius: 16, padding: "28px", border: "1px solid #E5E5E0" }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C2A878", marginBottom: 14 }}>{cfg.calloutLabel}</p>
              {cfg.calloutItems.map((item, i) => (
                <p key={i} style={{ fontSize: 14, color: "#5F5F5F", lineHeight: "1.7", marginBottom: 8 }}>{item}</p>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <motion.div ref={successRef} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            {submitted ? (
              <>
                <div style={{ background: "#F8F8F6", border: "1.5px solid #E5E5E0", borderRadius: 20, padding: "48px 36px", textAlign: "center" }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(139,58,26,0.08)", border: "1.5px solid rgba(139,58,26,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <Check size={26} color="var(--gb-accent)" />
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 12 }}>Application received.</h3>
                  <p style={{ fontSize: 15, color: "#5F5F5F", lineHeight: "1.75" }}>{cfg.successMsg}</p>
                </div>
                <EcosystemOptIn
                  context={type === "influencer" ? "creator" : "page-owner"}
                  prefillEmail={submittedEmail}
                />
              </>
            ) : (
              <div style={{ background: "#F8F8F6", border: "1.5px solid #E5E5E0", borderRadius: 20, padding: "40px 32px" }}>
                <h3 style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 8 }}>{cfg.formTitle}</h3>
                <p style={{ fontSize: 14, color: "#7A7A85", marginBottom: 28 }}>{cfg.formSubtitle}</p>

                {/* ── INFLUENCER FORM ─────────────────────────── */}
                {type === "influencer" && (
                  <Form {...influencerForm}>
                    <form onSubmit={influencerForm.handleSubmit(onSubmitInfluencer)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <FormField control={influencerForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel style={labelStyle}>Full Name</FormLabel>
                          <FormControl><input className="gb-input" placeholder="Your full name" {...field} /></FormControl>
                          <FormMessage /></FormItem>
                      )} />
                      <FormField control={influencerForm.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel style={labelStyle}>Email Address</FormLabel>
                          <FormControl><input type="email" className="gb-input" placeholder="you@example.com" {...field} /></FormControl>
                          <FormMessage /></FormItem>
                      )} />
                      <FormField control={influencerForm.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel style={labelStyle}>Contact Number</FormLabel>
                          <FormControl><input type="tel" className="gb-input" placeholder="+1 234 567 8900" {...field} /></FormControl>
                          <FormMessage /></FormItem>
                      )} />
                      <FormField control={influencerForm.control} name="niche" render={({ field }) => (
                        <FormItem><FormLabel style={labelStyle}>Your Niche</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="gb-input" style={{ height: 48 }}><SelectValue placeholder="Select your niche" /></SelectTrigger>
                              <SelectContent>{NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage /></FormItem>
                      )} />
                      {OtherNicheField}
                      <FormField control={influencerForm.control} name="handle" render={({ field }) => (
                        <FormItem><FormLabel style={labelStyle}>Primary Social Handle</FormLabel>
                          <FormControl><input className="gb-input" placeholder="@yourhandle or profile URL" {...field} /></FormControl>
                          <FormMessage /></FormItem>
                      )} />
                      <FormField control={influencerForm.control} name="monthlyViews" render={({ field }) => (
                        <FormItem><FormLabel style={labelStyle}>Monthly Views / Reach</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="gb-input" style={{ height: 48 }}><SelectValue placeholder="Select your range" /></SelectTrigger>
                              <SelectContent>{VIEWS_RANGES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage /></FormItem>
                      )} />
                      <button type="submit" disabled={submitting} className="gb-btn" style={{ justifyContent: "center", marginTop: 8, padding: "14px 0", fontSize: 15 }}>
                        {submitting ? "Submitting..." : cfg.submitLabel}
                        {!submitting && <ArrowRight size={15} style={{ marginLeft: 8 }} />}
                      </button>
                    </form>
                  </Form>
                )}

                {/* ── PAGE OWNER FORM ──────────────────────────── */}
                {type === "page" && (
                  <Form {...pageForm}>
                    <form onSubmit={pageForm.handleSubmit(onSubmitPage)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                      <FormField control={pageForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel style={labelStyle}>Full Name</FormLabel>
                          <FormControl><input className="gb-input" placeholder="Your full name" {...field} /></FormControl>
                          <FormMessage /></FormItem>
                      )} />
                      <FormField control={pageForm.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel style={labelStyle}>Email Address</FormLabel>
                          <FormControl><input type="email" className="gb-input" placeholder="you@example.com" {...field} /></FormControl>
                          <FormMessage /></FormItem>
                      )} />
                      <FormField control={pageForm.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel style={labelStyle}>Contact Number</FormLabel>
                          <FormControl><input type="tel" className="gb-input" placeholder="+1 234 567 8900" {...field} /></FormControl>
                          <FormMessage /></FormItem>
                      )} />
                      <FormField control={pageForm.control} name="niche" render={({ field }) => (
                        <FormItem><FormLabel style={labelStyle}>Your Niche</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="gb-input" style={{ height: 48 }}><SelectValue placeholder="Select your niche" /></SelectTrigger>
                              <SelectContent>{NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage /></FormItem>
                      )} />
                      {OtherNicheField}
                      <FormField control={pageForm.control} name="monthlyViews" render={({ field }) => (
                        <FormItem><FormLabel style={labelStyle}>Monthly Views / Reach</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="gb-input" style={{ height: 48 }}><SelectValue placeholder="Select your range" /></SelectTrigger>
                              <SelectContent>{VIEWS_RANGES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage /></FormItem>
                      )} />

                      {/* How many pages */}
                      <div>
                        <label style={labelStyle}>How Many Pages Do You Own?</label>
                        <Select value={pageCount} onValueChange={(v) => { setPageCount(v); if (v !== "More than 5") setPageCountCustom(""); }}>
                          <SelectTrigger className="gb-input" style={{ height: 48, marginTop: 6 }}>
                            <SelectValue placeholder="Select number of pages" />
                          </SelectTrigger>
                          <SelectContent>
                            {PAGE_COUNT_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <AnimatePresence>
                        {isMoreThan5 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: -8 }}
                            animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: "hidden" }}
                          >
                            <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>How Many Exactly?</label>
                            <input
                              className="gb-input"
                              type="text"
                              placeholder="e.g. 8 pages"
                              value={pageCountCustom}
                              onChange={(e) => setPageCountCustom(e.target.value)}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Page entries */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <label style={labelStyle}>Page Link</label>
                          <span style={{ fontSize: 11, color: "#7A7A85", fontWeight: 500 }}>{pages.length} page{pages.length !== 1 ? "s" : ""}</span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <AnimatePresence initial={false}>
                            {pages.map((p, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                transition={{ duration: 0.18 }}
                              >
                                <div style={{ background: "#FFFFFF", border: "1.5px solid #E5E5E0", borderRadius: 12, padding: "14px", display: "flex", flexDirection: "column", gap: 8 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7A7A85", flex: 1 }}>
                                      Page {i + 1}
                                    </span>
                                    {pages.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removePage(i)}
                                        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#7A7A85", background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", padding: "2px 0" }}
                                      >
                                        <Trash2 style={{ width: 12, height: 12 }} /> Remove
                                      </button>
                                    )}
                                  </div>
                                  <input
                                    className="gb-input"
                                    placeholder="Page name (e.g. Motivation Daily)"
                                    value={p.name}
                                    onChange={(e) => updatePage(i, "name", e.target.value)}
                                  />
                                  <input
                                    className="gb-input"
                                    placeholder="Page link (e.g. @fitnessmemes or URL)"
                                    value={p.link}
                                    onChange={(e) => updatePage(i, "link", e.target.value)}
                                  />
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>

                        {pagesError && (
                          <p style={{ fontSize: 12, color: "#dc2626", marginTop: 6, fontWeight: 500 }}>{pagesError}</p>
                        )}

                        <button
                          type="button"
                          onClick={addPage}
                          style={{
                            display: "flex", alignItems: "center", gap: 6, marginTop: 10,
                            fontSize: 13, fontWeight: 600, color: "#0A0A0A",
                            background: "rgba(10,10,10,0.03)", border: "1.5px dashed rgba(11,11,11,0.15)",
                            borderRadius: 10, padding: "10px 16px", cursor: "pointer",
                            fontFamily: "'Inter', sans-serif", width: "100%", justifyContent: "center",
                            transition: "background 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(11,11,11,0.07)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(11,11,11,0.03)")}
                        >
                          <Plus style={{ width: 14, height: 14 }} />
                          Add Another Page
                        </button>
                      </div>

                      <button type="submit" disabled={submitting} className="gb-btn" style={{ justifyContent: "center", marginTop: 8, padding: "14px 0", fontSize: 15 }}>
                        {submitting ? "Submitting..." : cfg.submitLabel}
                        {!submitting && <ArrowRight size={15} style={{ marginLeft: 8 }} />}
                      </button>
                    </form>
                  </Form>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
