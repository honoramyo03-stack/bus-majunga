"use client";
import { useEffect, useState } from "react";
import { Link } from "@/lib/router";
import { useRouter } from "@/lib/router";
import { Eye, EyeOff, ArrowRight, ShieldCheck, AlertTriangle, Loader2, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { firebaseOps } from "@/lib/firebase-hooks";
import LiveTicker from "@/components/LiveTicker";

function useClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, logout, user, isAdmin, loading: authLoading } = useAuth();
  const clock = useClock();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Si déjà connecté en tant qu'admin → dashboard
  useEffect(() => {
    if (!authLoading && user && isAdmin) router.replace("/admin/dashboard");
  }, [authLoading, user, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await signIn(form.email, form.password);
      // Vérification explicite du rôle admin (le contexte met isAdmin à jour
      // de façon asynchrone, on lit directement la table admins/ ici).
      const adminData = await firebaseOps.get(`admins/${u.uid}`).catch(() => null);
      if (!adminData) {
        setError("Ce compte n'a pas les droits administrateur. Créez un compte admin via le lien ci-dessous.");
        await logout();
        return;
      }
      router.push("/admin/dashboard");
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found")) {
        setError("Email ou mot de passe incorrect.");
      } else if (msg.includes("too-many-requests")) {
        setError("Trop de tentatives. Réessayez dans quelques minutes.");
      } else if (msg.includes("operation-not-allowed")) {
        setError("Le provider Email/Password n'est pas activé dans Firebase Console → Authentication.");
      } else if (msg.includes("network-request-failed")) {
        setError("Connexion réseau impossible.");
      } else {
        setError("Connexion impossible.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#0b2545] font-body grid lg:grid-cols-[1.1fr_1fr]">
      {/* ============ PANNEAU VISUEL ============ */}
      <aside className="relative hidden lg:flex flex-col bg-[#0b2545] text-[#f4f6f8] overflow-hidden">
        <div className="absolute inset-0 bg-grid-dark" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#ff3b30]/10 to-transparent scanline pointer-events-none" />

        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0%" stopColor="#ff3b30" stopOpacity="0" />
              <stop offset="50%" stopColor="#ff3b30" stopOpacity="1" />
              <stop offset="100%" stopColor="#ff3b30" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="g2" x1="0" x2="1">
              <stop offset="0%" stopColor="#ffd60a" stopOpacity="0" />
              <stop offset="50%" stopColor="#ffd60a" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffd60a" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="g3" x1="0" x2="1">
              <stop offset="0%" stopColor="#06b6a4" stopOpacity="0" />
              <stop offset="50%" stopColor="#06b6a4" stopOpacity="1" />
              <stop offset="100%" stopColor="#06b6a4" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g fill="none" strokeWidth="2">
            <path d="M -50 180 C 180 160, 380 340, 850 300" stroke="url(#g1)" className="route-dash" />
            <path d="M -50 420 C 220 440, 460 260, 850 520" stroke="url(#g2)" className="route-dash" style={{ animationDelay: "1.5s" }} />
            <path d="M -50 660 C 180 680, 500 540, 850 720" stroke="url(#g3)" className="route-dash" style={{ animationDelay: "3s" }} />
            <path d="M -50 820 C 260 800, 540 900, 850 840" stroke="rgba(244,246,248,0.3)" className="route-dash" style={{ animationDelay: "0.7s" }} />
          </g>
          <g fill="#f4f6f8">
            <circle cx="180" cy="170" r="3" />
            <circle cx="420" cy="310" r="3" />
            <circle cx="640" cy="290" r="3" />
            <circle cx="250" cy="440" r="3" />
            <circle cx="520" cy="320" r="3" />
            <circle cx="300" cy="700" r="3" />
            <circle cx="560" cy="580" r="3" />
          </g>
        </svg>

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ff3b30] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#0b2545]" strokeWidth={2.5} />
              </div>
              <div className="leading-tight">
                <div className="font-display text-[15px] font-bold tracking-tight">TransMahajanga</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#457b9d]">admin · v1.0</div>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#06b6a4]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06b6a4] live-dot" />
              online
            </div>
          </header>

          <div className="mt-auto">
            <div className="flex items-end gap-4">
              <div className="font-display font-black text-[180px] leading-[0.8] tracking-[-0.05em]">01</div>
              <div className="pb-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ff3b30] mb-2">module</div>
                <div className="font-display text-2xl font-bold">Contrôle</div>
              </div>
            </div>
            <div className="mt-6 h-[3px] w-full bg-white/10 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1/3 bg-[#ff3b30]" />
            </div>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-white/70">
              Supervision en temps réel du réseau de bus et taxis de Mahajanga. Validation des chauffeurs, diffusion d'alertes, traçabilité anti-fraude.
            </p>

            <div className="mt-8 max-w-md">
              <LiveTicker />
            </div>

            <dl className="mt-8 grid grid-cols-3 gap-4 max-w-md font-mono text-[10px] uppercase tracking-[0.2em]">
              <div>
                <dt className="text-[#457b9d]">node</dt>
                <dd className="text-white text-[13px] mt-1 normal-case tracking-normal">MJG-01</dd>
              </div>
              <div>
                <dt className="text-[#457b9d]">region</dt>
                <dd className="text-white text-[13px] mt-1 normal-case tracking-normal">Boeny · 408</dd>
              </div>
              <div>
                <dt className="text-[#457b9d]">clock</dt>
                <dd className="text-[#ffd60a] text-[13px] mt-1 tabular-nums normal-case tracking-normal">{clock || "——:——:——"}</dd>
              </div>
            </dl>
          </div>

          <footer className="mt-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-[#457b9d]">
            <span>© 2026 · transmahajanga</span>
            <Link href="/" className="hover:text-white transition-colors">accueil ↗</Link>
          </footer>
        </div>
      </aside>

      {/* ============ FORMULAIRE ============ */}
      <main className="relative flex flex-col justify-center px-6 sm:px-10 lg:px-16 xl:px-20 py-12 form-rise bg-grid">
        <div className="lg:hidden mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0b2545] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#ff3b30]" />
            </div>
            <div>
              <div className="font-display text-sm font-bold">TransMahajanga</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#5a6b82]">admin</div>
            </div>
          </div>
          <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#5a6b82] hover:text-[#0b2545]">accueil</Link>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[#ff3b30] mb-5">
            <span className="w-6 h-[2px] bg-[#ff3b30]" />
            auth · admin
          </div>

          <h1 className="font-display font-black text-6xl sm:text-7xl tracking-[-0.04em] leading-[0.9]">
            Panneau
            <br />
            <span className="text-[#ff3b30]">de contrôle</span>
          </h1>
          <p className="mt-5 text-[14px] leading-relaxed text-[#5a6b82] max-w-sm">
            Connectez-vous avec votre compte administrateur, ou créez-en un si vous n'en avez pas encore.
          </p>

          {error && (
            <div className="mt-8 border-l-[3px] border-[#ff3b30] bg-[#ffe5e3] pl-4 pr-3 py-3 flex items-start gap-3 reveal">
              <AlertTriangle className="w-4 h-4 text-[#c92a22] mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-[#c92a22] font-mono flex-1">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-7 reveal">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-[#5a6b82] mb-2">email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="w-full bg-transparent border-b-2 border-[#0b2545]/15 focus:border-[#ff3b30] outline-none py-2.5 text-[15px] font-medium transition-colors placeholder:text-[#5a6b82]/50"
                placeholder="admin@…"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-[#5a6b82] mb-2">mot de passe</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  className="w-full bg-transparent border-b-2 border-[#0b2545]/15 focus:border-[#ff3b30] outline-none py-2.5 pr-10 text-[15px] font-medium transition-colors font-mono"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-0 top-2.5 text-[#5a6b82] hover:text-[#ff3b30] transition-colors"
                  aria-label={showPass ? "Masquer" : "Afficher"}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full mt-2 bg-[#0b2545] text-[#f4f6f8] py-4 flex items-center justify-between px-6 overflow-hidden hover:bg-[#ff3b30] hover:text-[#0b2545] transition-colors disabled:opacity-60"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] font-bold">
                {loading ? "connexion…" : "ouvrir le panneau"}
              </span>
              <span className="relative w-5 h-5 flex items-center justify-center">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                )}
              </span>
            </button>

            {/* CTA inscription */}
            <div className="border-2 border-[#0b2545] bg-white p-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-display font-bold text-[14px]">Pas encore de compte ?</div>
                <div className="text-[11px] text-[#5a6b82] mt-0.5">Créez un compte admin (code d'accès requis).</div>
              </div>
              <Link
                href="/admin/register"
                className="inline-flex items-center gap-2 bg-[#ff3b30] text-[#0b2545] font-mono text-[10px] uppercase tracking-[0.25em] font-bold px-4 py-2.5 hover:bg-[#0b2545] hover:text-[#ffd60a] transition-colors flex-shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                créer
              </Link>
            </div>

            <div className="pt-5 border-t border-[#0b2545]/10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em]">
              <Link href="/driver/login" className="text-[#5a6b82] hover:text-[#0b2545] link-underline">chauffeur →</Link>
              <Link href="/client" className="text-[#5a6b82] hover:text-[#0b2545] link-underline">client →</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
