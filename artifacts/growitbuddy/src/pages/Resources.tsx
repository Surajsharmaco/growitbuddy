import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import SEOMeta from "@/components/SEOMeta";
import { usePublicContent } from "@/hooks/usePublicContent";

interface ResourceItem {
  title: string;
  desc: string;
  tag: string;
  link: string;
}

interface ResourcesData {
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtext: string;
  items: ResourceItem[];
  seoTitle: string;
  seoDesc: string;
}

const DEFAULTS: ResourcesData = {
  heroEyebrow: "Resources",
  heroHeadline: "Open-source frameworks.",
  heroSubtext: "Free templates, guides and playbooks from our internal agency toolkit.",
  items: [],
  seoTitle: "Resources - GrowitBuddy",
  seoDesc: "Free templates, guides and playbooks from our internal agency toolkit.",
};

export default function Resources() {
  const cms = usePublicContent<ResourcesData>("resources", DEFAULTS);

  return (
    <div style={{ background: "#F8F8F6", fontFamily: "'Inter', sans-serif" }}>
      <SEOMeta title={cms.seoTitle} description={cms.seoDesc} />

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 80, paddingLeft: 24, paddingRight: 24, borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-[1100px] mx-auto">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7A7A85", marginBottom: 16 }}>
            {cms.heroEyebrow}
          </p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ fontWeight: 800, fontSize: "clamp(28px, 7vw, 88px)", letterSpacing: "-0.04em", lineHeight: "1.08", color: "#0A0A0A", maxWidth: "18ch", marginBottom: 24 }}
          >
            {cms.heroHeadline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: "clamp(15px, 4.5vw, 18px)", color: "#5F5F5F", lineHeight: "1.75", maxWidth: "52ch" }}
          >
            {cms.heroSubtext}
          </motion.p>
        </div>
      </section>

      {/* Resources grid */}
      <section style={{ padding: "60px 24px 100px", background: "#FFFFFF" }}>
        <div className="max-w-[1100px] mx-auto">
          {cms.items.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#F8F8F6",
                borderRadius: 12,
                height: 320,
                border: "1px solid #E5E5E0",
              }}
            >
              <span style={{ fontSize: 14, color: "#7A7A85" }}>Content coming soon</span>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 20,
              }}
            >
              {cms.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.45 }}
                >
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", height: "100%" }}>
                      <ResourceCard item={item} />
                    </a>
                  ) : (
                    <ResourceCard item={item} />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ResourceCard({ item }: { item: ResourceItem }) {
  return (
    <div
      style={{
        background: "#F8F8F6",
        border: "1.5px solid #E5E5E0",
        borderRadius: 20,
        padding: "28px 28px 24px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: item.link ? "pointer" : "default",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      className={item.link ? "hover:-translate-y-1 hover:shadow-md" : ""}
    >
      <span style={{
        display: "inline-block",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        padding: "4px 12px",
        borderRadius: 100,
        background: "#EFEFEA",
        color: "#0A0A0A",
        marginBottom: 20,
        alignSelf: "flex-start",
      }}>
        {item.tag}
      </span>
      <h3 style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 10, lineHeight: 1.3 }}>
        {item.title}
      </h3>
      <p style={{ fontSize: 14, color: "#5F5F5F", lineHeight: 1.7, flex: 1 }}>
        {item.desc}
      </p>
      {item.link && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 20, fontSize: 13, fontWeight: 700, color: "#0A0A0A" }}>
          Download <ArrowRight style={{ width: 14, height: 14 }} />
        </span>
      )}
    </div>
  );
}
