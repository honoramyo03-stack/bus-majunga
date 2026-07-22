"use client";
import { useEffect, useState } from "react";
import { Link } from "@/lib/router";
import { useRouter } from "@/lib/router";
import {
  Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck, Check, Loader2,
  ShieldAlert, WifiOff, KeyRound, Terminal, User, Mail, Phone, Lock,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { firebaseOps } from "@/lib/firebase-hooks";
import { friendlyAuthError, isDatabaseError } from "@/lib/auth-errors";
import RegisterSidePanel from "@/components/RegisterSidePanel";

const STEPS = [
  { n: "01", label: "Identité + accès" },
  { n: "02", label: "Validation" },
];

export default function AdminRegisterPage() {
  const router = useRouter();
  const { signUp, user, isAdmin, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [codeStatus, setCodeStatus] = useState<"idle" | "ok" | "ko">("idle");
  const [codeRequired, setCodeRequired] = useState<boolean | null>(null);

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", password: "", confirmPassword: "", adminCode: "",
  });
  const update = (f: string, v: unknown) => setForm((s) => ({ ...s, [f]: v }));

  // Détection du code requis (côté serveur, via env)
  useEffect(() => {
    fetch("/api/verify-admin-code")
      .then((r) => r.json())
      .then((d) => setCodeRequired(!!d.required))
      .catch(() => setCodeRequired(false));
  }, []);

  // Redirect si déjà admin
  useEffect(() => {
    if (!authLoading && user && isAdmin) router.replace("/admin/dashboard");
  }, [authLoading, user, isAdmin, router]);

  const verifyCode = async (): Promise<boolean> => {
    if (!codeRequired) { setCodeStatus("ok"); return true; }
    setVerifyingCode(true); setError("");
    try {
      const r = await fetch("/api/verify-admin-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: form.adminCode }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) {
        setCodeStatus("ko");
        setError(data.error || "Code d'accès invalide.");
        return false;
      }
      setCodeStatus("ok");
      return true;
    } catch {
      setCodeStatus("ko");
      setError("Service de vérification injoignable. Réessayez.");
      return false;
    } finally {
      setVerifyingCode(false);
    }
  };

  const next = async () => {
    setError("");
    if (!form.fullName || !form.email || !form.password || !form.confirmPassword) {
      setError("Tous les champs * sont obligatoires."); return;
    }
    if (form.password !== form.confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }
    if (form.password.length < 6) { setError("Le mot de passe doit faire au moins 6 caractères."); return; }
    if (codeRequired && !form.adminCode) { setError("Le code d'accès administrateur est requis."); return; }
    const ok = await verifyCode();
    if (ok) setStep(2);
  };

  const submit = async () => {
    setLoading(true); setError("");
    let createdUid: string | null = null;
    try {
      const u = await signUp(form.email, form.password, form.fullName);
      createdUid = u.uid;
      try {
        await firebaseOps.set(`admins/${u.uid}`, {
          fullName: form.fullName, email: form.email, phone: form.phone || null,
          role: "admin", status: "active",
          createdAt: Date.now(), updatedAt: Date.now(),
        });
        router.push("/admin/dashboard");
      } catch (dbErr: any) {
        // Rollback du compte Auth pour éviter un orphelin sans profil
        await u.delete().catch(() => {});
        const msg = dbErr?.message || "";
        setError(
          isDatabaseError(msg)
            ? "Compte Auth créé puis supprimé : la Realtime Database Firebase est inaccessible. Créez-la dans la console Firebase (Realtime Database → Créer la base), puis réessayez."
            : "Profil non enregistré : " + friendlyAuthError(msg)
        );
      }
    } catch (authErr: any) {
      setError(friendlyAuthError(authErr?.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#0b2545] font-body grid lg:grid-cols-[1.1fr_1fr]">
      <RegisterSidePanel
        tone="coral"
        moduleNumber="01"
        moduleLabel="Création admin"
        headline="Un nouvel administrateur rejoint le panneau de contrôle. Toutes ses actions seront journalisées et traçables."
        afterSteps={[
          "Compte actif immédiatement après création.",
          "Accès complet : chauffeurs, lignes, alertes, avis.",
          "Journalisation de chaque action sensible.",
        ]}
      />

      <main className="relative flex flex-col min-h-screen form-rise bg-grid">
        {/* Stepper sticky */}
        <div className="sticky top-0 z-20 bg-[#f4f6f8]/95 backdrop-blur border-b-2 border-[#0b2545]/10">
          <div className="max-w-xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#ff3b30] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-[#0b2545]" strokeWidth={2.5} />
              </div>
              <span className="font-display font-black text-[13px] tracking-tight hidden sm:inline">TransMahajanga</span>
            </Link>
            <div className="flex items-center gap-3">
              {STEPS.map((s, i) => {
                const done = step > i + 1;
                const active = step === i + 1;
                return (
                  <div key={s.n} className="flex items-center gap-2">
                    <div className={`w-7 h-7 flex items-center justify-center font-mono text-[11px] font-bold transition-colors ${
                      done ? "bg-[#06b6a4] text-[#0b2545]" :
                      active ? "bg-[#0b2545] text-[#ffd60a]" :
                      "bg-[#0b2545]/10 text-[#5a6b82]"
                    }`}>
                      {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : s.n}
                    </div>
                    <span className={`hidden md:inline font-mono text-[10px] uppercase tracking-[0.25em] ${active ? "text-[#0b2545]" : "text-[#5a6b82]"}`}>
                      {s.label}
                    </span>
                    {i < STEPS.length - 1 && <span className="w-6 h-px bg-[#0b2545]/20" />}
                  </div>
                );
              })}
            </div>
            <Link href="/admin/login" className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#5a6b82] hover:text-[#ff3b30] link-underline">
              connexion
            </Link>
          </div>
          <div className="h-[3px] bg-[#0b2545]/5">
            <div className="h-full bg-[#ff3b30] transition-all duration-500" style={{ width: `${(step / STEPS.length) * 100}%` }} />
          </div>
        </div>

        <div className="flex-1 flex items-start justify-center px-6 lg:px-10 py-10 lg:py-14">
          <div className="w-full max-w-xl">
            {/* Titre */}
            <div className="flex items-baseline gap-4 mb-2">
              <span className="font-display font-black text-5xl text-[#ff3b30] tabular-nums leading-none">{STEPS[step - 1].n}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#5a6b82]">étape {step} / {STEPS.length}</span>
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl tracking-[-0.03em] leading-[0.95]">
              {step === 1 && <>Créer un <span className="text-[#ff3b30]">compte admin.</span></>}
              {step === 2 && <>Confirmer la <span className="text-[#ff3b30]">création.</span></>}
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-[#5a6b82]">
              {step === 1
                ? (codeRequired ? "Un code d'accès restreint la création de comptes administrateurs." : "Renseignez vos informations. Le compte sera actif immédiatement.")
                : "Vérifiez les informations puis validez. Vous serez connecté automatiquement."}
            </p>

            {error && (
              <div className="mt-7 border-l-[3px] border-[#ff3b30] bg-[#ffe5e3] p-4 flex items-start gap-3 reveal">
                {error.includes("Email/Password") || error.includes("Realtime Database")
                  ? <WifiOff className="w-4 h-4 text-[#c92a22] mt-0.5 flex-shrink-0" />
                  : <ShieldAlert className="w-4 h-4 text-[#c92a22] mt-0.5 flex-shrink-0" />}
                <div className="flex-1">
                  <div className="font-display font-bold text-[13px] text-[#c92a22]">Erreur</div>
                  <p className="text-[12px] text-[#0b2545]/85 mt-0.5 leading-snug">{error}</p>
                </div>
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <div className="mt-8 space-y-7 reveal">
                <Field idx="01" label="nom complet" required Icon={User}>
                  <input type="text" placeholder="Prénom Nom" value={form.fullName}
                    onChange={(e) => update("fullName", e.target.value)} className={inputCls} />
                </Field>
                <div className="grid sm:grid-cols-2 gap-7">
                  <Field idx="02" label="email" required Icon={Mail}>
                    <input type="email" placeholder="admin@exemple.mg" value={form.email}
                      onChange={(e) => update("email", e.target.value)} className={inputCls} />
                  </Field>
                  <Field idx="03" label="téléphone" Icon={Phone}>
                    <input type="tel" placeholder="034 XX XXX XX" value={form.phone}
                      onChange={(e) => update("phone", e.target.value)} className={inputCls + " font-mono"} />
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-7">
                  <Field idx="04" label="mot de passe" required Icon={Lock}>
                    <div className="relative">
                      <input type={showPass ? "text" : "password"} placeholder="min. 6 car." value={form.password}
                        onChange={(e) => update("password", e.target.value)} className={inputCls + " pr-10 font-mono"} />
                      <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-0 top-2.5 text-[#5a6b82] hover:text-[#ff3b30]">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>
                  <Field idx="05" label="confirmer" required Icon={Lock}>
                    <input type="password" placeholder="••••••••" value={form.confirmPassword}
                      onChange={(e) => update("confirmPassword", e.target.value)} className={inputCls + " font-mono"} />
                  </Field>
                </div>

                {codeRequired && (
                  <div className="border-2 border-[#0b2545] bg-white p-5 reveal">
                    <div className="flex items-center gap-2 mb-2">
                      <KeyRound className="w-4 h-4 text-[#ff3b30]" />
                      <span className="font-display font-bold text-[14px]">Code d'accès administrateur *</span>
                    </div>
                    <p className="text-[12px] text-[#5a6b82] leading-snug mb-4">
                      Ce code vous est communiqué par l'équipe TransMahajanga.
                    </p>
                    <div className="flex gap-3">
                      <input type="text" placeholder="••••••••••••" value={form.adminCode}
                        onChange={(e) => { update("adminCode", e.target.value); setCodeStatus("idle"); }}
                        className={`flex-1 bg-transparent border-b-2 outline-none py-2.5 font-mono uppercase tracking-[0.2em] text-[15px] font-bold transition-colors ${
                          codeStatus === "ok" ? "border-[#06b6a4]" : codeStatus === "ko" ? "border-[#ff3b30]" : "border-[#0b2545]/20 focus:border-[#ff3b30]"
                        }`} />
                      <button type="button" onClick={verifyCode} disabled={verifyingCode || !form.adminCode}
                        className="inline-flex items-center gap-2 bg-[#0b2545] text-[#f4f6f8] font-mono text-[10px] uppercase tracking-[0.25em] px-4 hover:bg-[#ff3b30] hover:text-[#0b2545] transition-colors disabled:opacity-50">
                        {verifyingCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
                        vérifier
                      </button>
                    </div>
                    {codeStatus === "ok" && (
                      <div className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#048a7c] reveal">
                        <Check className="w-3.5 h-3.5" /> code valide
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2 — récap groupé */}
            {step === 2 && (
              <div className="mt-8 space-y-5 reveal">
                <RecapGroup title="Identité" tone="marine" items={[
                  { k: "nom", v: form.fullName },
                  { k: "email", v: form.email, mono: true },
                  ...(form.phone ? [{ k: "téléphone", v: form.phone, mono: true }] : []),
                ]} />
                <RecapGroup title="Accès" tone="coral" items={[
                  { k: "rôle", v: "administrateur" },
                  { k: "statut", v: "actif dès création" },
                  { k: "code d'accès", v: codeRequired ? "vérifié ✓" : "non requis", mono: true },
                ]} />
                <div className="flex items-start gap-3 p-4 bg-[#0b2545] text-[#f4f6f8]">
                  <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#ffd60a]" />
                  <p className="text-[12px] leading-relaxed">
                    En créant ce compte, vous obtenez un <strong className="text-[#ffd60a]">accès complet</strong> au panneau
                    d'administration. Toutes vos actions seront journalisées.
                  </p>
                </div>
              </div>
            )}

            {/* NAV */}
            <div className="mt-10 flex items-center justify-between gap-4 pt-6 border-t-2 border-[#0b2545]/10">
              {step > 1 ? (
                <button onClick={() => setStep(1)} className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-[#5a6b82] hover:text-[#0b2545]">
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> retour
                </button>
              ) : <span />}
              {step < 2 ? (
                <button onClick={next} className="group inline-flex items-center gap-3 bg-[#0b2545] text-[#f4f6f8] px-6 py-3.5 hover:bg-[#ff3b30] hover:text-[#0b2545] transition-colors">
                  <span className="font-mono text-[11px] uppercase tracking-[0.3em] font-bold">continuer</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button onClick={submit} disabled={loading}
                  className="group inline-flex items-center gap-3 bg-[#ff3b30] text-[#0b2545] px-6 py-3.5 hover:bg-[#0b2545] hover:text-[#ffd60a] transition-colors disabled:opacity-60">
                  <span className="font-mono text-[11px] uppercase tracking-[0.3em] font-bold">{loading ? "création…" : "créer le compte"}</span>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={3} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const inputCls =
  "w-full bg-transparent border-b-2 border-[#0b2545]/20 focus:border-[#ff3b30] outline-none py-2.5 text-[15px] font-medium transition-colors placeholder:text-[#5a6b82]/50";

function Field({ label, required, idx, Icon, children }: { label: string; required?: boolean; idx: string; Icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="group/field">
      <label className="flex items-center gap-2 mb-2">
        <span className="font-mono text-[10px] text-[#ff3b30] tabular-nums">{idx}</span>
        <Icon className="w-3.5 h-3.5 text-[#5a6b82] group-focus-within/field:text-[#ff3b30] transition-colors" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#5a6b82]">{label}</span>
        {required && <span className="text-[#ff3b30] text-[11px]">*</span>}
      </label>
      {children}
    </div>
  );
}

const GROUP_TONES: Record<string, string> = {
  marine: "bg-[#0b2545] text-[#f4f6f8]",
  coral:  "bg-[#ff3b30] text-[#0b2545]",
};

function RecapGroup({ title, tone, items }: { title: string; tone: keyof typeof GROUP_TONES; items: Array<{ k: string; v: string; mono?: boolean }> }) {
  return (
    <div>
      <div className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] font-bold ${GROUP_TONES[tone]}`}>
        {title}
      </div>
      <div className="border-2 border-t-0 border-[#0b2545]/15 bg-white divide-y divide-[#0b2545]/10">
        {items.map((it, i) => (
          <div key={i} className="flex items-baseline justify-between gap-4 px-4 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#5a6b82]">{it.k}</span>
            <span className={`text-[14px] font-bold text-right break-words ${it.mono ? "font-mono" : "font-display"}`}>{it.v || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
