import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { type BlogPost } from "@/data/blogPosts";
import { usePublicContent } from "@/hooks/usePublicContent";
import { useWordPressPosts } from "@/hooks/useWordPressPosts";
import SEOMeta from "@/components/SEOMeta";

export default function Insights() {
  const [activeTag, setActiveTag] = useState("All");
  // CMS is the source of truth, merged with any WordPress posts. If both are
  // empty the page shows an honest empty state — we never fall back to the
  // bundled seed posts, because that resurrected deleted posts on every refresh.
  const { posts: cmsPosts } = usePublicContent<{ posts: BlogPost[] }>("blog", { posts: [] });
  const { posts: wpPosts } = useWordPressPosts();

  const blogPosts = useMemo(() => {
    const base: BlogPost[] = (cmsPosts ?? []).map((p) => ({ ...p, source: "cms" as const }));
    const combined = [...base, ...wpPosts];
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return combined;
  }, [cmsPosts, wpPosts]);

  // Always show the core brand categories so the filter bar stays consistent
  // even before CMS posts have loaded or if a category is temporarily empty.
  const FIXED_TAGS = ["Founder", "Brand", "Creator"];
  const allTags = ["All", ...Array.from(new Set([...FIXED_TAGS, ...blogPosts.map(p => p.tag)]))];
  const filtered = activeTag === "All" ? blogPosts : blogPosts.filter(p => p.tag === activeTag);

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif" }}>
      <SEOMeta
        title="Blog | Authority Building, Content Strategy & Distribution | GrowitBuddy"
        description="Frameworks, strategies, and strong opinions on content marketing, personal branding, and distribution systems - for founders and creators building inbound authority."
        canonical="https://growitbuddy.com/blog"
        schema={{
          "@type": "Blog",
          "name": "GrowitBuddy Blog",
          "url": "https://growitbuddy.com/blog",
          "description": "Frameworks, strategies, and strong opinions on content marketing, personal branding, and distribution systems for founders and creators.",
          "publisher": { "@id": "https://growitbuddy.com/#organization" }
        } as Record<string, unknown>}
      />

      {/* Hero — tightened vertical rhythm */}
      <section style={{ paddingTop: "clamp(56px, 11vw, 88px)", paddingBottom: "clamp(28px, 6vw, 48px)", paddingLeft: 18, paddingRight: 18, borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 16 }}>The Blog</p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ fontWeight: 800, fontSize: "clamp(28px, 7vw, 88px)", letterSpacing: "-0.04em", lineHeight: "1.08", color: "#0A0A0A", maxWidth: "18ch", marginBottom: 16 }}
          >
            Thoughts on building authority.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: "clamp(15px, 4.5vw, 18px)", color: "#5F5F5F", lineHeight: "1.75", maxWidth: "52ch" }}
          >
            Frameworks, strategies, and strong opinions on building unignorable influence as a founder or creator.
          </motion.p>
        </div>
      </section>

      {/* Tag filter + Posts grid */}
      <section style={{ padding: "clamp(20px, 4vw, 36px) 18px clamp(48px, 9vw, 80px)", background: "#FFFFFF" }}>
        <div className="max-w-[1100px] mx-auto">

          {/* Filter bar — horizontally scrollable on mobile */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "1.5px solid",
                  borderColor: activeTag === tag ? "var(--gb-accent)" : "rgba(11,11,11,0.12)",
                  background: activeTag === tag ? "var(--gb-accent)" : "transparent",
                  color: activeTag === tag ? "#fff" : "rgba(11,11,11,0.55)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Grid — single column on mobile, multi-column on tablet/desktop */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 14 }}>
            {filtered.map((post, i) => {
              const featured = i === 0 && activeTag === "All";
              return (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.45 }}
                >
                  <Link href={`/blog/${post.slug}`}>
                    <div
                      style={{
                        background: featured ? "#1E293B" : "#F8F8F6",
                        border: featured ? "none" : "1.5px solid #E5E5E0",
                        borderRadius: 20,
                        overflow: "hidden",
                        cursor: "pointer",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                      className="hover:-translate-y-1 hover:shadow-lg"
                    >
                      {post.featuredImage && (
                        <div style={{ aspectRatio: "16/10", overflow: "hidden", flexShrink: 0, background: "#e8e8e6" }}>
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            loading={i < 3 ? "eager" : "lazy"}
                            decoding="async"
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </div>
                      )}
                      <div style={{ padding: "28px 28px 28px", flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                            padding: "5px 12px", borderRadius: 100,
                            background: featured ? "rgba(255,255,255,0.12)" : "#EFEFEA",
                            color: featured ? "#F8F8F6" : "#0A0A0A",
                          }}>
                            {post.tag}
                          </span>
                        </div>
                        <h2 style={{
                          fontWeight: 800, fontSize: "clamp(20px, 2.5vw, 26px)", letterSpacing: "-0.03em",
                          lineHeight: 1.2, color: featured ? "#fff" : "#0A0A0A", marginBottom: 16, flex: 1,
                        }}>
                          {post.title}
                        </h2>
                        <p style={{
                          fontSize: 14, color: featured ? "#8A8A8A" : "rgba(11,11,11,0.55)",
                          lineHeight: "1.75", marginBottom: 20,
                        }}>
                          {post.excerpt}
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: `1px solid ${featured ? "rgba(248,248,246,0.12)" : "rgba(11,11,11,0.08)"}` }}>
                          <span style={{ fontSize: 12, color: featured ? "rgba(248,248,246,0.5)" : "rgba(11,11,11,0.45)" }}>{post.date}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: featured ? "#F8F8F6" : "#0A0A0A" }}>
                            Read <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "64px 0", color: "rgba(11,11,11,0.45)" }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#0A0A0A", marginBottom: 6 }}>No posts yet</p>
              <p style={{ fontSize: 14 }}>New articles will appear here once published.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
