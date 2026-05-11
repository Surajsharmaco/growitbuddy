import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "@/context/AdminContext";
import { ALL_PERMISSIONS } from "@/context/adminPermissions";
import { UserPlus, Trash2, Edit2, Check, X, Eye, EyeOff, Shield, Users, ChevronDown, ChevronUp } from "lucide-react";

import { API_BASE } from "@/lib/api";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PERMISSION_GROUPS = [
  {
    label: "Overview",
    keys: ["leads", "certificates"],
  },
  {
    label: "Content",
    keys: ["home", "services", "framework", "work", "blog", "resources", "about", "contact"],
  },
  {
    label: "Network & Hiring",
    keys: ["influencers", "influencer-explore", "distribution-network", "distribution-pages", "authority-audit", "join-network", "freelancers", "full-time"],
  },
  {
    label: "Assets & Site",
    keys: ["media", "navbar", "footer", "settings"],
  },
];

function labelFor(key: string): string {
  return ALL_PERMISSIONS.find((p) => p.key === key)?.label ?? key;
}

function PermissionPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(key: string) {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  }

  function toggleGroup(keys: string[]) {
    const allSelected = keys.every((k) => selected.includes(k));
    if (allSelected) {
      onChange(selected.filter((k) => !keys.includes(k)));
    } else {
      const merged = [...new Set([...selected, ...keys])];
      onChange(merged);
    }
  }

  function selectAll() {
    onChange(ALL_PERMISSIONS.map((p) => p.key));
  }
  function clearAll() {
    onChange([]);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 mb-1">
        <button
          type="button"
          onClick={selectAll}
          className="text-[11px] text-white/50 hover:text-white transition-colors underline underline-offset-2"
        >
          Select all
        </button>
        <span className="text-white/20">|</span>
        <button
          type="button"
          onClick={clearAll}
          className="text-[11px] text-white/50 hover:text-white transition-colors underline underline-offset-2"
        >
          Clear all
        </button>
      </div>
      {PERMISSION_GROUPS.map((group) => {
        const groupSelected = group.keys.filter((k) => selected.includes(k));
        const allChecked = groupSelected.length === group.keys.length;
        const someChecked = groupSelected.length > 0 && !allChecked;
        return (
          <div key={group.label}>
            <button
              type="button"
              onClick={() => toggleGroup(group.keys)}
              className="flex items-center gap-2 mb-1.5 w-full text-left"
            >
              <span
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  allChecked
                    ? "bg-white border-white"
                    : someChecked
                    ? "bg-white/40 border-white/40"
                    : "border-white/20"
                }`}
              >
                {(allChecked || someChecked) && <Check size={9} className="text-[#0B0B0B]" />}
              </span>
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">{group.label}</span>
            </button>
            <div className="grid grid-cols-2 gap-1 ml-5">
              {group.keys.map((key) => {
                const on = selected.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] text-left transition-colors ${
                      on ? "bg-white/15 text-white" : "text-white/40 hover:text-white/60 hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                        on ? "bg-white border-white" : "border-white/20"
                      }`}
                    >
                      {on && <Check size={8} className="text-[#0B0B0B]" />}
                    </span>
                    {labelFor(key)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface MemberFormData {
  name: string;
  email: string;
  password: string;
  permissions: string[];
  isActive: boolean;
}

const BLANK: MemberFormData = {
  name: "",
  email: "",
  password: "",
  permissions: [],
  isActive: true,
};

export default function AdminTeamMembers() {
  const { authFetch, isSuperAdmin } = useAdmin();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<MemberFormData>(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await authFetch(`${API_BASE}/admin/team`);
      if (r.ok) setMembers(await r.json());
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditId(null);
    setForm(BLANK);
    setError("");
    setShowPw(false);
    setShowForm(true);
  }

  function openEdit(m: TeamMember) {
    setEditId(m.id);
    setForm({
      name: m.name,
      email: m.email,
      password: "",
      permissions: m.permissions,
      isActive: m.isActive,
    });
    setError("");
    setShowPw(false);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setForm(BLANK);
    setError("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required");
      return;
    }
    if (!editId && !form.password) {
      setError("Password is required for new members");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim(),
        permissions: form.permissions,
        isActive: form.isActive,
      };
      if (form.password) body.password = form.password;

      let r: Response;
      if (editId) {
        r = await authFetch(`${API_BASE}/admin/team/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        r = await authFetch(`${API_BASE}/admin/team`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        const msg = (body as { error?: string } | null)?.error;
        throw new Error(msg ?? (r.status === 401 ? "Session expired — please log in again" : `Request failed (${r.status})`));
      }
      await load();
      cancelForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const r = await authFetch(`${API_BASE}/admin/team/${id}`, { method: "DELETE" });
    if (r.ok) {
      setDeleteId(null);
      await load();
    }
  }

  async function toggleActive(m: TeamMember) {
    await authFetch(`${API_BASE}/admin/team/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !m.isActive }),
    });
    await load();
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <Shield size={36} className="text-white/20 mb-4" />
        <p className="text-[15px] text-[#0B0B0B]/50 font-medium">Super admin access required</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-black tracking-tight text-[#0B0B0B]">Team Members</h1>
          <p className="text-[13px] text-[#0B0B0B]/40 mt-1">
            Create accounts and control what each person can access.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#0B0B0B] text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#222] transition-colors"
        >
          <UserPlus size={14} />
          Add Member
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div
            className="w-full max-w-lg rounded-2xl bg-[#0B0B0B] p-6 overflow-y-auto"
            style={{ maxHeight: "90vh" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-black text-white">
                {editId ? "Edit Member" : "New Team Member"}
              </h2>
              <button onClick={cancelForm} className="text-white/30 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full bg-white/8 border border-white/12 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Email address"
                  disabled={!!editId}
                  className="w-full bg-white/8 border border-white/12 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                  {editId ? "New Password (leave blank to keep)" : "Password"}
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder={editId ? "Leave blank to keep current" : "Set a password"}
                    className="w-full bg-white/8 border border-white/12 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest block mb-3">
                  Access Permissions
                </label>
                <PermissionPicker
                  selected={form.permissions}
                  onChange={(v) => setForm((f) => ({ ...f, permissions: v }))}
                />
              </div>

              <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                <div>
                  <p className="text-[13px] font-semibold text-white">Account Active</p>
                  <p className="text-[11px] text-white/35">Disabled accounts cannot sign in</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={`w-10 h-6 rounded-full transition-colors relative ${form.isActive ? "bg-white" : "bg-white/20"}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-[#0B0B0B] transition-all ${form.isActive ? "left-5" : "left-1"}`}
                  />
                </button>
              </div>

              {error && (
                <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="flex-1 border border-white/15 text-white/60 text-[13px] font-semibold py-2.5 rounded-xl hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-white text-[#0B0B0B] text-[13px] font-semibold py-2.5 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editId ? "Save Changes" : "Create Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm bg-[#0B0B0B] rounded-2xl p-6 text-center">
            <p className="text-[16px] font-black text-white mb-2">Delete this member?</p>
            <p className="text-[13px] text-white/40 mb-6">This will permanently remove their account and access.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-white/15 text-white/60 text-[13px] font-semibold py-2.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-500 text-white text-[13px] font-semibold py-2.5 rounded-xl hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-[#0B0B0B]/30 text-[13px]">Loading...</div>
      ) : members.length === 0 ? (
        <div className="text-center py-20">
          <Users size={36} className="mx-auto mb-3 text-[#0B0B0B]/15" />
          <p className="text-[15px] font-bold text-[#0B0B0B]/30">No team members yet</p>
          <p className="text-[13px] text-[#0B0B0B]/25 mt-1">
            Click "Add Member" to create an account for your team.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => {
            const expanded = expandedId === m.id;
            return (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-black/5 overflow-hidden"
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-full bg-[#0B0B0B] flex items-center justify-center text-white text-[13px] font-black flex-shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-[#0B0B0B] truncate">{m.name}</span>
                      {!m.isActive && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#0B0B0B]/40 truncate">{m.email}</p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-[11px] text-[#0B0B0B]/35 mr-1">
                      {m.permissions.length} permission{m.permissions.length !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => setExpandedId(expanded ? null : m.id)}
                      className="p-1.5 rounded-lg text-[#0B0B0B]/35 hover:text-[#0B0B0B] hover:bg-black/5 transition-colors"
                      title="View permissions"
                    >
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                      onClick={() => openEdit(m)}
                      className="p-1.5 rounded-lg text-[#0B0B0B]/35 hover:text-[#0B0B0B] hover:bg-black/5 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => toggleActive(m)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        m.isActive
                          ? "text-green-600 hover:bg-green-50"
                          : "text-[#0B0B0B]/25 hover:text-[#0B0B0B] hover:bg-black/5"
                      }`}
                      title={m.isActive ? "Disable account" : "Enable account"}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(m.id)}
                      className="p-1.5 rounded-lg text-[#0B0B0B]/25 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-black/5 px-5 py-4 bg-[#F7F7F5]">
                    <p className="text-[11px] font-bold text-[#0B0B0B]/30 uppercase tracking-widest mb-3">
                      Permissions
                    </p>
                    {m.permissions.length === 0 ? (
                      <p className="text-[12px] text-[#0B0B0B]/30">No permissions assigned</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {m.permissions.map((p) => (
                          <span
                            key={p}
                            className="text-[11px] font-medium text-[#0B0B0B]/60 bg-white border border-black/8 rounded-full px-2.5 py-1"
                          >
                            {labelFor(p)}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-[#0B0B0B]/25 mt-3">
                      Joined {new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
