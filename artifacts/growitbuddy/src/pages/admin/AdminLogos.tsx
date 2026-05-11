import { useState, useEffect, useRef } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Card, PageHeader, SectionTitle } from "@/components/admin/AdminField";
import { Plus, Trash2, Edit2, X, Save, Upload, Image } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { API_BASE } from "@/lib/api";

interface ClientLogo {
  id: number;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  link: string;
  enabled: boolean;
  createdAt: string;
}

interface LogoFormState {
  imageUrl: string;
  altText: string;
  sortOrder: number;
  link: string;
  enabled: boolean;
}

const EMPTY_FORM: LogoFormState = { imageUrl: "", altText: "", sortOrder: 0, link: "", enabled: true };

function LogoForm({
  initial,
  onSave,
  onCancel,
  token,
}: {
  initial?: LogoFormState;
  onSave: (logo: ClientLogo) => void;
  onCancel: () => void;
  token: string;
}) {
  const [form, setForm] = useState<LogoFormState>(initial ?? EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(initial?.imageUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setForm((p) => ({ ...p, imageUrl: "" }));
  }

  async function handleSubmit() {
    if (!file && !form.imageUrl) { setErr("Provide an image URL or upload a file."); return; }
    setSaving(true);
    setErr("");
    try {
      const fd = new FormData();
      if (file) fd.append("image", file);
      else fd.append("imageUrl", form.imageUrl);
      fd.append("altText", form.altText);
      fd.append("sortOrder", String(form.sortOrder));
      fd.append("link", form.link || "");
      fd.append("enabled", String(form.enabled));

      const isEdit = initial !== undefined && (initial as LogoFormState & { id?: number }).id !== undefined;
      const id = (initial as LogoFormState & { id?: number }).id;
      const url = isEdit ? `${API_BASE}/admin/logos/${id}` : `${API_BASE}/admin/logos`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Failed to save (${res.status})`);
      }
      const data = await res.json();
      onSave(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "24px", background: "#F8F8F6", borderRadius: 12, border: "1.5px solid #E5E5E0" }}>
      <div style={{ display: "flex", gap: 20 }}>
        {/* Image preview / upload zone */}
        <div
          style={{ flexShrink: 0, width: 120, height: 80, background: "#FFFFFF", border: "1.5px dashed #E5E5E0", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", position: "relative" }}
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            <>
              <Upload size={18} style={{ color: "#8A8A8A", marginBottom: 4 }} />
              <span style={{ fontSize: 11, color: "#8A8A8A" }}>Upload</span>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#0B0B0B", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
              Image URL (or upload above)
            </label>
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => { setForm((p) => ({ ...p, imageUrl: e.target.value })); setPreview(e.target.value); setFile(null); }}
              placeholder="https://example.com/logo.png"
              style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E5E0", borderRadius: 8, fontSize: 13, outline: "none", background: "#FFFFFF" }}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#0B0B0B", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>Brand Name</label>
              <input
                type="text"
                value={form.altText}
                onChange={(e) => setForm((p) => ({ ...p, altText: e.target.value }))}
                placeholder="Company name"
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E5E0", borderRadius: 8, fontSize: 13, outline: "none", background: "#FFFFFF" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#0B0B0B", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E5E0", borderRadius: 8, fontSize: 13, outline: "none", background: "#FFFFFF" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#0B0B0B", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>Website Link (optional)</label>
              <input
                type="text"
                value={form.link}
                onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
                placeholder="https://brandwebsite.com"
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E5E0", borderRadius: 8, fontSize: 13, outline: "none", background: "#FFFFFF" }}
              />
            </div>
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#0B0B0B", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>Visible</label>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, enabled: !p.enabled }))}
                style={{
                  padding: "8px 14px", borderRadius: 8, border: "1.5px solid",
                  borderColor: form.enabled ? "#1E293B" : "#E5E5E0",
                  background: form.enabled ? "#1E293B" : "#FFFFFF",
                  color: form.enabled ? "#FFFFFF" : "#8A8A8A",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {form.enabled ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {err && <p style={{ marginTop: 10, fontSize: 12, color: "#DC2626" }}>{err}</p>}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
        <button
          onClick={onCancel}
          style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #E5E5E0", background: "transparent", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <X size={13} /> Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{ padding: "8px 16px", borderRadius: 8, background: "#0B0B0B", color: "#FFFFFF", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: saving ? 0.6 : 1 }}
        >
          <Save size={13} /> {saving ? "Saving…" : "Save Logo"}
        </button>
      </div>
    </div>
  );
}

export default function AdminLogos() {
  const { token } = useAdmin();
  const [logos, setLogos] = useState<ClientLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  async function fetchLogos() {
    try {
      const res = await fetch(`${API_BASE}/admin/logos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setLogos(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { if (token) fetchLogos(); }, [token]);

  async function deleteLogo(id: number) {
    try {
      await fetch(`${API_BASE}/admin/logos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogos((prev) => prev.filter((l) => l.id !== id));
      setDeleteConfirm(null);
    } catch { /* ignore */ }
  }

  return (
    <div>
      <PageHeader
        title="Client Logos"
        description="Manage logos shown on the Work page. Add up to 24 logos in grayscale - hover reveals full color."
      />

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button
          onClick={() => { setShowAdd(true); setEditId(null); }}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "#0B0B0B", color: "#FFFFFF", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          <Plus size={15} /> Add Logo
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{ marginBottom: 20 }}
          >
            <LogoForm
              token={token ?? ""}
              onSave={(logo) => {
                setLogos((prev) => [...prev, logo]);
                setShowAdd(false);
              }}
              onCancel={() => setShowAdd(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <Card><p style={{ color: "#8A8A8A", fontSize: 13 }}>Loading logos…</p></Card>
      ) : logos.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <Image size={36} style={{ color: "#E5E5E0", marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: "#8A8A8A", marginBottom: 4 }}>No logos yet</p>
            <p style={{ fontSize: 12, color: "#B0B0B0" }}>Add your first client logo above. The Work page will display them in a grayscale grid.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <SectionTitle>{logos.length} logo{logos.length !== 1 ? "s" : ""} - target 24</SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 12,
              marginTop: 16,
            }}
          >
            <AnimatePresence>
              {logos.map((logo) => (
                <motion.div
                  key={logo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{ border: "1.5px solid #E5E5E0", borderRadius: 10, overflow: "hidden", background: "#FAFAFA" }}
                >
                  {editId === logo.id ? (
                    <div style={{ padding: 10 }}>
                      <LogoForm
                        token={token ?? ""}
                        initial={{ ...logo, id: logo.id } as LogoFormState & { id: number }}
                        onSave={(updated) => {
                          setLogos((prev) => prev.map((l) => l.id === updated.id ? updated : l));
                          setEditId(null);
                        }}
                        onCancel={() => setEditId(null)}
                      />
                    </div>
                  ) : (
                    <>
                      <div style={{ padding: "16px 12px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 64, background: logo.enabled ? "#FFFFFF" : "#F8F8F6", position: "relative", opacity: logo.enabled ? 1 : 0.5 }}>
                        <img
                          src={logo.imageUrl}
                          alt={logo.altText || "Logo"}
                          style={{ maxWidth: "100%", maxHeight: 40, objectFit: "contain" }}
                        />
                        {!logo.enabled && (
                          <span style={{ position: "absolute", top: 6, right: 6, fontSize: 9, fontWeight: 700, background: "#F0F0F0", color: "#8A8A8A", borderRadius: 4, padding: "2px 5px", letterSpacing: "0.05em" }}>
                            HIDDEN
                          </span>
                        )}
                      </div>
                      <div style={{ padding: "8px 10px", borderTop: "1px solid #F0F0F0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 11, color: "#5F5F5F", fontWeight: 600, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {logo.altText || "No label"}
                          </span>
                          {logo.link && (
                            <span style={{ fontSize: 10, color: "#C2A878", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                              ↗ link
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={async () => {
                              const fd = new FormData();
                              fd.append("enabled", String(!logo.enabled));
                              const res = await fetch(`${API_BASE}/admin/logos/${logo.id}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: fd });
                              if (res.ok) { const updated = await res.json(); setLogos(prev => prev.map(l => l.id === updated.id ? updated : l)); }
                            }}
                            style={{ padding: 4, border: "none", background: "transparent", cursor: "pointer", color: logo.enabled ? "#16A34A" : "#8A8A8A", borderRadius: 4 }}
                            title={logo.enabled ? "Visible - click to hide" : "Hidden - click to show"}
                          >
                            <span style={{ fontSize: 10, fontWeight: 700 }}>{logo.enabled ? "ON" : "OFF"}</span>
                          </button>
                          <button
                            onClick={() => setEditId(logo.id)}
                            style={{ padding: 4, border: "none", background: "transparent", cursor: "pointer", color: "#8A8A8A", borderRadius: 4 }}
                          >
                            <Edit2 size={12} />
                          </button>
                          {deleteConfirm === logo.id ? (
                            <button
                              onClick={() => deleteLogo(logo.id)}
                              style={{ padding: "3px 6px", border: "none", background: "#FEF2F2", cursor: "pointer", color: "#DC2626", borderRadius: 4, fontSize: 10, fontWeight: 600 }}
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(logo.id)}
                              style={{ padding: 4, border: "none", background: "transparent", cursor: "pointer", color: "#8A8A8A", borderRadius: 4 }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      )}
    </div>
  );
}
