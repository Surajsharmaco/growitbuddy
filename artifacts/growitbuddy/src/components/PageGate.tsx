import { type ReactNode } from "react";
import { usePublicContent } from "@/hooks/usePublicContent";
import { Wrench, Clock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface PageVisConfig {
  hidden?: boolean;
  mode?: "maintenance" | "coming_soon";
  headline?: string;
  message?: string;
}

function MaintenancePage({ headline, message }: { headline: string; message: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F8F6] px-6 relative">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1E293B] flex items-center justify-center mx-auto mb-8">
          <Wrench size={28} className="text-[#C2A878]" />
        </div>
        <p
          className="mb-3 text-[11px] font-bold tracking-[0.2em] uppercase"
          style={{ color: "var(--gb-gold, #C2A878)" }}
        >
          Maintenance
        </p>
        <h1 className="text-[34px] font-black tracking-tight text-[#0A0A0A] mb-4 leading-tight">
          {headline || "We'll be back soon."}
        </h1>
        <p className="text-[16px] text-[#5F5F5F] leading-relaxed mb-8">
          {message ||
            "We're making some improvements to give you a better experience. Check back shortly."}
        </p>
        <div className="w-10 h-0.5 bg-[#C2A878] mx-auto mb-8" />
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#1E293B] hover:text-[#8B3A1A] transition-colors"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>
      </div>
      <p className="absolute bottom-6 text-[11px] text-[#8A8A8A]">
        © {new Date().getFullYear()} GrowitBuddy
      </p>
    </div>
  );
}

function ComingSoonPage({ headline, message }: { headline: string; message: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1E293B] px-6 relative">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-8">
          <Clock size={28} className="text-[#C2A878]" />
        </div>
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#C2A878] mb-3">
          Coming Soon
        </p>
        <h1 className="text-[34px] font-black tracking-tight text-white mb-4 leading-tight">
          {headline || "Something exciting is coming."}
        </h1>
        <p className="text-[16px] text-white/55 leading-relaxed mb-8">
          {message ||
            "We're working on something great. Be the first to know when we launch."}
        </p>
        <div className="w-10 h-0.5 bg-[#C2A878] mx-auto mb-8" />
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>
      </div>
      <p className="absolute bottom-6 text-[11px] text-white/25">
        © {new Date().getFullYear()} GrowitBuddy
      </p>
    </div>
  );
}

export function PageGate({ slug, children }: { slug: string; children: ReactNode }) {
  const allVis = usePublicContent<Record<string, PageVisConfig>>("page_visibility", {});
  const config = allVis[slug];

  if (!config?.hidden) return <>{children}</>;

  const { mode = "coming_soon", headline = "", message = "" } = config;

  if (mode === "maintenance") {
    return <MaintenancePage headline={headline} message={message} />;
  }
  return <ComingSoonPage headline={headline} message={message} />;
}
