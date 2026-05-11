import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { blogPosts as DEFAULT_POSTS, type BlogPost } from "@/data/blogPosts";
import { usePublicContent } from "@/hooks/usePublicContent";
import { useWordPressPosts } from "@/hooks/useWordPressPosts";
import SEOMeta from "@/components/SEOMeta";

export default function Insights() {
  const [activeTag, setActiveTag] = useState("All");
  const { posts: cmsPosts } = usePublicContent<{ posts: BlogPost[] }>("blog", { posts: DEFAULT_POSTS });
  const { posts: wpPosts } = useWordPressPosts();

  const blogPosts = useMemo(() => {
    const base: BlogPost[] = (cmsPosts?.length ? cmsPosts : DEFAULT_POSTS).map((p) => ({ ...p, source: "cms" as const }));
    const combined = [...base, ...wpPosts];
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return combined;
  }, [cmsPosts, wpPosts]);

  const allTags = ["All", ...Array.from(new Set(blogPosts.map(p => p.tag)))];
  const filtered = activeTag === "All" ? blogPosts : blogPosts.filter(p => p.tag === activeTag);

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif" }}>
      <SEOMeta
        title="Insights | Authority Building, Content Strategy & Distribution | GrowitBuddy"
        description="Frameworks, strategies, and strong opinions on content marketing, personal branding, and distribution systems - for founders and creators building inbound authority."
        schema={{
          "@type": "Blog",
          "name": "GrowitBuddy Insights",
          "url": "https://growitbuddy.com/insights",
          "description": "Frameworks, strategies, and strong opinions on content marketing, personal branding, and distribution systems for founders and creators.",
          "publisher": { "@id": "https://growitbuddy.com/#organization" }
        } as Record<string, unknown>}
      />

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 80, paddingLeft: 24, paddingRight: 24, borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 16 }}>Insights</p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ fontWeight: 800, fontSize: "clamp(28px, 7vw, 88px)", letterSpacing: "-0.04em", lineHeight: "1.08", color: "#0A0A0A", maxWidth: "18ch", marginBottom: 24 }}
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
      <section style={{ padding: "60px 24px 100px", background: "#FFFFFF" }}>
        <div className="max-w-[1100px] mx-auto">

          {/* Filter bar */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 40 }}>
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

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
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
                  <Link href={`/insights/${post.slug}`}>
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
                        <div style={{ height: 180, overflow: "hidden", flexShrink: 0 }}>
                          <img
                            src={post.featuredImage}
                            alt={post.title}
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
                          {post.source === "wordpress" && (
                            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: featured ? "rgba(248,248,246,0.4)" : "rgba(11,11,11,0.3)" }}>
                              WordPress
                            </span>
                          )}
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
        </div>
      </section>
    </div>
  );
}
