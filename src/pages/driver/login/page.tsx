"use client";
import { useEffect, useState } from "react";
import { Link } from "@/lib/router";
import { useRouter } from "@/lib/router";
import { Eye, EyeOff, ArrowRight, Car, Loader2, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
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

export default function DriverLoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const clock = useClock();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(form.email, form.password);
      router.push("/driver/dashboard");
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found")) {
        setError("Email ou mot de passe incorrect.");
      } else if (msg.includes("too-many-requests")) {
        setError("Trop de tentatives. Réessayez plus tard.");
      } else if (msg.includes("operation-not-allowed")) {
        setError("Authentification email désactivée côté Firebase.");
      } else {
        setError("Connexion impossible. Vérifiez votre réseau.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#0b2545] font-body grid lg:grid-cols-[1fr_1.1fr]">
      {/* ============ FORMULAIRE (gauche) ============ */}
      <main className="relative flex flex-col justify-center px-6 sm:px-10 lg:px-16 xl:px-20 py-12 form-rise order-2 lg:order-1 bg-grid">
        <div className="lg:hidden mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0b2545] flex items-center justify-center">
              <Car className="w-4 h-4 text-[#06b6a4]" />
            </div>
            <div>
              <div className="font-display text-sm font-bold">TransMahajanga</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#5a6b82]">chauffeur</div>
            </div>
          </div>
          <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#5a6b82] hover:text-[#0b2545]">accueil</Link>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[#048a7c] mb-5">
            <span className="w-6 h-[2px] bg-[#06b6a4]" />
            auth · chauffeur
          </div>

          <h1 className="font-display font-black text-6xl sm:text-7xl tracking-[-0.04em] leading-[0.9]">
            Reprenez
            <br />
            <span className="text-[#048a7c]">la route.</span>
          </h1>
          <p className="mt-5 text-[14px] leading-relaxed text-[#5a6b82] max-w-sm">
            Recevez vos réservations, partagez votre position en direct, consultez vos avis.
          </p>

          {error && (
            <div className="mt-8 border-l-[3px] border-[#ff3b30] bg-[#ffe5e3] pl-4 pr-3 py-3 text-[12px] text-[#c92a22] font-mono reveal">
              ! {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-7 reveal">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-[#5a6b82] mb-2">email</label>
              <input
                type="email"
                placeholder="prenom@exemple.mg"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="w-full bg-transparent border-b-2 border-[#0b2545]/15 focus:border-[#06b6a4] outline-none py-2.5 text-[15px] font-medium transition-colors placeholder:text-[#5a6b82]/50"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-[#5a6b82] mb-2">mot de passe</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  className="w-full bg-transparent border-b-2 border-[#0b2545]/15 focus:border-[#06b6a4] outline-none py-2.5 pr-10 text-[15px] font-medium transition-colors font-mono"
                />
                <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-0 top-2.5 text-[#5a6b82] hover:text-[#06b6a4] transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full mt-2 bg-[#0b2545] text-[#f4f6f8] py-4 flex items-center justify-between px-6 overflow-hidden hover:bg-[#06b6a4] hover:text-[#0b2545] transition-colors disabled:opacity-60"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] font-bold">
                {loading ? "connexion…" : "se connecter"}
              </span>
              <span className="relative w-5 h-5 flex items-center justify-center">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                )}
              </span>
            </button>

            <div className="pt-5 border-t border-[#0b2545]/10 text-[12px] text-[#5a6b82]">
              Pas encore inscrit ?{" "}
              <Link href="/driver/register" className="text-[#048a7c] font-bold link-underline">
                créer un compte
              </Link>
            </div>
          </form>
        </div>
      </main>

      {/* ============ PANNEAU VISUEL (droite) ============ */}
      <aside className="relative hidden lg:flex flex-col bg-[#0b2545] text-[#f4f6f8] overflow-hidden order-1 lg:order-2">
        <div className="absolute inset-0 bg-grid-dark" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#06b6a4]/15 to-transparent scanline pointer-events-none" />

        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <pattern id="topo" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="22" fill="none" stroke="rgba(244,246,248,0.07)" strokeWidth="0.5" />
              <circle cx="30" cy="30" r="12" fill="none" stroke="rgba(244,246,248,0.05)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="800" height="900" fill="url(#topo)" />
          <g fill="none" strokeWidth="2">
            <path d="M 100 80 Q 300 220, 200 420 T 420 720 T 720 870" stroke="#ffd60a" className="route-dash" />
            <path d="M 720 100 Q 520 260, 620 460 T 320 760" stroke="#06b6a4" className="route-dash" style={{ animationDelay: "2s" }} />
            <path d="M 40 500 Q 260 540, 480 460 T 780 580" stroke="#ff3b30" className="route-dash" style={{ animationDelay: "3.5s" }} />
          </g>
          <g fill="#ffd60a">
            <circle cx="100" cy="80" r="4" />
            <circle cx="200" cy="420" r="4" />
            <circle cx="420" cy="720" r="4" />
            <circle cx="720" cy="870" r="4" />
          </g>
          {/* Silhouette taxi */}
          <g transform="translate(300 420)" opacity="0.85" stroke="#f4f6f8" strokeWidth="1.3" fill="none">
            <rect x="0" y="10" width="160" height="60" rx="3" />
            <circle cx="38" cy="70" r="12" />
            <circle cx="122" cy="70" r="12" />
            <path d="M 12 10 L 32 -18 L 120 -18 L 148 10" />
            <line x1="76" y1="-18" x2="76" y2="10" />
          </g>
          <text x="380" y="460" fontFamily="var(--font-display)" fontSize="22" fontWeight="900" fill="#f4f6f8" letterSpacing="4">TAXI</text>
        </svg>

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#06b6a4] flex items-center justify-center">
                <Car className="w-5 h-5 text-[#0b2545]" strokeWidth={2.5} />
              </div>
              <div className="leading-tight">
                <div className="font-display text-[15px] font-bold">TransMahajanga</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#457b9d]">driver · v1.0</div>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#ffd60a]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffd60a] live-dot" />
              réseau actif
            </div>
          </header>

          <div className="mt-auto">
            <div className="flex items-end gap-4">
              <div className="font-display font-black text-[180px] leading-[0.8] tracking-[-0.05em]">02</div>
              <div className="pb-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#06b6a4] mb-2">module</div>
                <div className="font-display text-2xl font-bold">Conduire</div>
              </div>
            </div>

            <div className="mt-6 h-[3px] w-full bg-white/10 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-2/3 bg-[#06b6a4]" />
            </div>

            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-white/70">
              Rejoignez le réseau officiel TransMahajanga. Réservations, trajets spéciaux, revenus — une seule interface.
            </p>

            <div className="mt-8 max-w-md">
              <LiveTicker />
            </div>

            <dl className="mt-8 grid grid-cols-3 gap-4 max-w-md font-mono text-[10px] uppercase tracking-[0.2em]">
              <div>
                <dt className="text-[#457b9d]">coord</dt>
                <dd className="text-[#ffd60a] text-[12px] mt-1 tabular-nums normal-case tracking-normal">15.7167°S</dd>
              </div>
              <div>
                <dt className="text-[#457b9d]">coord</dt>
                <dd className="text-[#ffd60a] text-[12px] mt-1 tabular-nums normal-case tracking-normal">46.3167°E</dd>
              </div>
              <div>
                <dt className="text-[#457b9d]">clock</dt>
                <dd className="text-white text-[12px] mt-1 tabular-nums normal-case tracking-normal">{clock || "——:——:——"}</dd>
              </div>
            </dl>

            <div className="mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/60">
              <MapPin className="w-3 h-3 text-[#ff3b30]" />
              Mahajanga I · Boeny · Madagascar
            </div>
          </div>

          <footer className="mt-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-[#457b9d]">
            <span>© 2026 · transmahajanga</span>
            <Link href="/admin/login" className="hover:text-white transition-colors">admin ↗</Link>
          </footer>
        </div>
      </aside>
    </div>
  );
}
