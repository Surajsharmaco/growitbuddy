import { useEffect, useState } from "react";
import { ExternalLink, Pencil, Loader2, AlertCircle, RefreshCw, Calendar } from "lucide-react";
import { Card } from "@/components/admin/AdminField";

const WP_SITE = "https://blog.growitbuddy.com";
const WP_API = `${WP_SITE}/wp-json/wp/v2`;

interface WPPostRaw {
  id: number;
  link: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url: string }>;
  };
}

interface WPRow {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  link: string;
  editUrl: string;
  image?: string;
}

function decodeHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/gi, (m) => {
      const map: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#039;": "'", "&nbsp;": " " };
      return map[m] ?? m;
    })
    .trim();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function WordPressPostsCard() {
  const [rows, setRows] = useState<WPRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${WP_API}/posts?_embed=1&per_page=100&status=publish`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: WPPostRaw[]) => {
        if (cancelled) return;
        if (!Array.isArray(data)) throw new Error("Unexpected response");
        setRows(
          data.map((p) => ({
            id: p.id,
            title: decodeHtml(p.title?.rendered ?? ""),
            excerpt: decodeHtml(p.excerpt?.rendered ?? "").slice(0, 160),
            date: formatDate(p.date),
            link: p.link,
            editUrl: `${WP_SITE}/wp-admin/post.php?post=${p.id}&action=edit`,
            image: p._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setError("Could not load WordPress posts. Check the connection or try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [reloadKey]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#21759b]/10 text-[#21759b]">
            {/* WordPress mark */}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zM3.5 12a8.5 8.5 0 011.2-4.35l4.06 11.12A8.5 8.5 0 013.5 12zm8.5 8.5c-.83 0-1.63-.12-2.39-.34l2.54-7.38 2.6 7.12c.02.04.04.08.06.12a8.49 8.49 0 01-2.81.48zm1.17-12.5c.51-.03.97-.08.97-.08.46-.05.4-.73-.05-.7 0 0-1.37.1-2.26.1-.83 0-2.23-.1-2.23-.1-.46-.03-.51.67-.06.7 0 0 .43.05.89.08l1.32 3.62-1.86 5.57L8.4 8.08c.51-.03.97-.08.97-.08.46-.05.4-.73-.05-.7 0 0-1.37.1-2.25.1l-.27-.01A8.5 8.5 0 0112 3.5c2.21 0 4.22.84 5.73 2.22l-.11-.01c-.83 0-1.42.73-1.42 1.51 0 .7.4 1.29.83 1.99.32.57.7 1.29.7 2.34 0 .73-.28 1.57-.65 2.74l-.85 2.85-3.06-9.07zm5.4 1.1A8.5 8.5 0 0120.5 12a8.49 8.49 0 01-4.3 7.38l2.6-7.52c.49-1.22.65-2.19.65-3.06 0-.31-.02-.6-.06-.87z" />
            </svg>
          </span>
          <div>
            <h2 className="text-[15px] font-bold text-[#0B0B0B]">WordPress Posts</h2>
            <p className="text-[12px] text-[#0B0B0B]/40">
              Live from blog.growitbuddy.com {rows.length > 0 && `· ${rows.length} post${rows.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0B0B0B]/60 hover:text-[#0B0B0B] bg-[#0B0B0B]/5 hover:bg-[#0B0B0B]/10 px-3 py-1.5 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <a
            href={`${WP_SITE}/wp-admin/edit.php`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white bg-[#21759b] hover:bg-[#1d6688] px-3 py-1.5 rounded-lg transition-colors"
          >
            Open WordPress <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-[#0B0B0B]/40">
            <Loader2 size={15} className="animate-spin" /> Loading WordPress posts…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-[13px] text-[#0B0B0B]/50 max-w-sm">{error}</p>
            <button onClick={() => setReloadKey((k) => k + 1)} className="text-[12px] font-semibold text-[#21759b] hover:underline mt-1">Try again</button>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-[#0B0B0B]/30">No WordPress posts found.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#0B0B0B]/6 bg-[#fafafa]">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest">Title</th>
                <th className="text-left px-3 py-3 text-[10px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest w-32">Date</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold text-[#0B0B0B]/40 uppercase tracking-widest w-44">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#0B0B0B]/5 hover:bg-[#0B0B0B]/[0.02] transition-colors last:border-0">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-14 h-10 rounded-lg overflow-hidden bg-[#0B0B0B]/6 flex items-center justify-center">
                        {row.image ? (
                          <img src={row.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-bold text-[#0B0B0B]/20 uppercase tracking-widest">No img</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#0B0B0B]">{row.title || "(no title)"}</p>
                        {row.excerpt && <p className="text-[11px] text-[#0B0B0B]/38 truncate max-w-[320px] mt-0.5">{row.excerpt}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1.5 text-[12px] text-[#0B0B0B]/45"><Calendar size={11} />{row.date}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <a href={row.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B0B0B]/55 hover:text-[#0B0B0B] px-2.5 py-1.5 rounded-lg hover:bg-[#0B0B0B]/6 transition-colors" title="View post">
                        View <ExternalLink size={11} />
                      </a>
                      <a href={row.editUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-[#21759b] hover:bg-[#1d6688] px-2.5 py-1.5 rounded-lg transition-colors" title="Edit in WordPress">
                        <Pencil size={11} /> Edit in WordPress
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
