import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { useLocation } from "wouter";
import { Eye, EyeOff, Lock, Users, ArrowLeft, Mail } from "lucide-react";

type LoginMode = "super" | "team";
type View = "login" | "forgot";

export default function AdminLogin() {
  const { login, teamLogin } = useAdmin();
  const [, nav] = useLocation();
  const [mode, setMode] = useState<LoginMode>("super");
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "super") {
        await login(password);
      } else {
        await teamLogin(email, password);
      }
      nav("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(m: LoginMode) {
    setMode(m);
    setEmail("");
    setPassword("");
    setError("");
    setView("login");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#0B0B0B] px-4"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="w-full max-w-sm">

        {/* Forgot Password View */}
        {view === "forgot" && (
          <>
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-4">
                <Mail size={20} className="text-white" />
              </div>
              <h1 className="text-[22px] font-black tracking-tight text-white">Forgot Password?</h1>
              <p className="text-[13px] text-white/40 mt-1">Here's how to get back in</p>
            </div>

            <div className="bg-white/6 border border-white/10 rounded-2xl p-5 space-y-4 mb-5">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[11px] font-bold text-white">1</span>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">Contact your Super Admin</p>
                  <p className="text-[12px] text-white/40 mt-1 leading-relaxed">
                    Ask the Super Admin to reset your password from the Team Members section in the admin panel.
                  </p>
                </div>
              </div>
              <div className="h-px bg-white/8" />
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[11px] font-bold text-white">2</span>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">Use your new password</p>
                  <p className="text-[12px] text-white/40 mt-1 leading-relaxed">
                    Once reset, sign in with your email and the new temporary password.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setView("login")}
              className="w-full flex items-center justify-center gap-2 text-[13px] text-white/50 hover:text-white transition-colors py-2"
            >
              <ArrowLeft size={14} />
              Back to sign in
            </button>
          </>
        )}

        {/* Login View */}
        {view === "login" && (
          <>
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-4">
                <Lock size={20} className="text-white" />
              </div>
              <h1 className="text-[22px] font-black tracking-tight text-white">GrowitBuddy Admin</h1>
              <p className="text-[13px] text-white/40 mt-1">Sign in to your admin panel</p>
            </div>

            <div className="flex rounded-xl bg-white/6 border border-white/10 p-1 mb-6">
              <button
                type="button"
                onClick={() => switchMode("team")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  mode === "team" ? "bg-white text-[#0B0B0B]" : "text-white/40 hover:text-white/60"
                }`}
              >
                <Users size={13} />
                Team Login
              </button>
              <button
                type="button"
                onClick={() => switchMode("super")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  mode === "super" ? "bg-white text-[#0B0B0B]" : "text-white/40 hover:text-white/60"
                }`}
              >
                <Lock size={13} />
                Super Admin
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "team" && (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full bg-white/8 border border-white/12 rounded-xl px-4 py-3 text-[14px] text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors"
                  autoFocus
                />
              )}

              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "super" ? "Admin password" : "Password"}
                  required
                  className="w-full bg-white/8 border border-white/12 rounded-xl px-4 py-3 text-[14px] text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors pr-11"
                  autoFocus={mode === "super"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && (
                <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !password || (mode === "team" && !email)}
                className="w-full bg-white text-[#0B0B0B] font-semibold text-[14px] py-3 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              {mode === "team" && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => { setError(""); setView("forgot"); }}
                    className="text-[12px] text-white/35 hover:text-white/60 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </form>
          </>
        )}

      </div>
    </div>
  );
}
