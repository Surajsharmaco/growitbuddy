import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { PageHeader, Card, SectionTitle, Input, Textarea, SaveBar } from "@/components/admin/AdminField";
import { PageVisibilityCard } from "@/components/admin/PageVisibilityCard";
import { Plus, Trash2, X } from "lucide-react";

import { AUTHORITY_AUDIT_DEFAULTS as DEFAULTS, type AuthorityAuditData, type AuditQuestion } from "@/lib/authorityAuditDefaults";
export default function AdminAuthorityAudit() {
  const { getContent, saveContent } = useAdmin();
  const [data, setData] = useState<AuthorityAuditData>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getContent("authority-audit").then((d) => {
      if (d) setData({ ...DEFAULTS, ...(d as Partial<AuthorityAuditData>) });
    });
  }, [getContent]);

  function set<K extends keyof AuthorityAuditData>(key: K, val: AuthorityAuditData[K]) {
    setSaved(false);
    setData((p) => ({ ...p, [key]: val }));
  }

  function setQuestion(i: number, patch: Partial<AuditQuestion>) {
    setSaved(false);
    const next = [...data.questions];
    next[i] = { ...next[i], ...patch };
    set("questions", next);
  }

  function setOption(qi: number, oi: number, val: string) {
    const opts = [...(data.questions[qi].options ?? [])];
    opts[oi] = val;
    setQuestion(qi, { options: opts });
  }

  function addOption(qi: number) {
    const opts = [...(data.questions[qi].options ?? []), "New option"];
    setQuestion(qi, { options: opts });
  }

  function removeOption(qi: number, oi: number) {
    const opts = (data.questions[qi].options ?? []).filter((_, idx) => idx !== oi);
    setQuestion(qi, { options: opts });
  }

  function addQuestion() {
    setSaved(false);
    set("questions", [
      ...data.questions,
      { id: `q${data.questions.length + 1}`, type: "choice", question: "New question?", options: ["Option A", "Option B"] },
    ]);
  }

  function removeQuestion(i: number) {
    setSaved(false);
    set("questions", data.questions.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    await saveContent("authority-audit", data as unknown as Record<string, unknown>);
    setSaving(false);
    setSaved(true);
  }

  return (
    <div>
      <PageHeader title="Authority Audit Page" description="Edit all text for the Authority Audit quiz page and its intro cards." />

      <Card>
        <SectionTitle>Hero Section</SectionTitle>
        <Input label="Eyebrow Label" value={data.heroEyebrow} onChange={(e) => set("heroEyebrow", e.target.value)} />
        <Input label="Headline" value={data.heroHeadline} onChange={(e) => set("heroHeadline", e.target.value)} />
        <Textarea label="Subtext" value={data.heroSubtext} onChange={(e) => set("heroSubtext", e.target.value)} />
      </Card>

      <Card>
        <SectionTitle>Intro Cards</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-[#0B0B0B]/10 rounded-xl p-4 space-y-2">
            <p className="text-[12px] font-bold text-[#0B0B0B]/40 mb-2">Free Audit Card</p>
            <Input label="Title" value={data.introFreeTitle} onChange={(e) => set("introFreeTitle", e.target.value)} />
            <Textarea label="Description" value={data.introFreeDesc} onChange={(e) => set("introFreeDesc", e.target.value)} />
            <Input label="Button Text" value={data.introFreeButton} onChange={(e) => set("introFreeButton", e.target.value)} />
          </div>
          <div className="border border-[#0B0B0B]/10 rounded-xl p-4 space-y-2">
            <p className="text-[12px] font-bold text-[#0B0B0B]/40 mb-2">Expert Audit Card</p>
            <Input label="Title" value={data.introPaidTitle} onChange={(e) => set("introPaidTitle", e.target.value)} />
            <Textarea label="Description" value={data.introPaidDesc} onChange={(e) => set("introPaidDesc", e.target.value)} />
            <Input label="Button Text" value={data.introPaidButton} onChange={(e) => set("introPaidButton", e.target.value)} />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Quiz Questions</SectionTitle>
        <p className="text-[12px] text-[#0B0B0B]/40 mb-4">
          Edit question text and answer options. The first question should always be a "text" type (name input). All others should be "choice".
          Note: the scoring logic uses the option values exactly as written, so changing option text will affect score calculations.
        </p>
        <div className="space-y-4">
          {data.questions.map((q, i) => (
            <div key={i} className="border border-[#0B0B0B]/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[#0B0B0B]/50">Q{i + 1} ({q.type})</span>
                <button onClick={() => removeQuestion(i)} className="text-[#0B0B0B]/30 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <Input label="ID (unique key, no spaces)" value={q.id} onChange={(e) => setQuestion(i, { id: e.target.value })} />
              <Textarea label="Question Text" value={q.question} onChange={(e) => setQuestion(i, { question: e.target.value })} />
              {q.type === "text" && (
                <Input label="Placeholder Text" value={q.placeholder ?? ""} onChange={(e) => setQuestion(i, { placeholder: e.target.value })} />
              )}
              {q.type === "choice" && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-[#0B0B0B]/40 uppercase tracking-wide">Answer Options</p>
                  {(q.options ?? []).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        value={opt}
                        onChange={(e) => setOption(i, oi, e.target.value)}
                        className="flex-1 text-[13px] border border-[#0B0B0B]/12 rounded-lg px-3 py-2 outline-none focus:border-[#0B0B0B]/40 bg-white"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      />
                      <button onClick={() => removeOption(i, oi)} className="text-[#0B0B0B]/25 hover:text-red-500 transition-colors shrink-0">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addOption(i)} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0B0B0B]/40 hover:text-[#0B0B0B] transition-colors mt-1">
                    <Plus size={13} /> Add Option
                  </button>
                </div>
              )}
            </div>
          ))}
          <button
            onClick={addQuestion}
            className="flex items-center gap-2 text-[13px] font-semibold text-[#0B0B0B]/50 hover:text-[#0B0B0B] transition-colors mt-2"
          >
            <Plus size={15} /> Add Question
          </button>
        </div>
      </Card>

      <Card>
        <SectionTitle>SEO</SectionTitle>
        <Input label="Page Title" value={data.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
        <Textarea label="Meta Description" value={data.seoDesc} onChange={(e) => set("seoDesc", e.target.value)} />
      </Card>

      <PageVisibilityCard slug="authority-audit" />
      <SaveBar saving={saving} saved={saved} onSave={handleSave} />
    </div>
  );
}
