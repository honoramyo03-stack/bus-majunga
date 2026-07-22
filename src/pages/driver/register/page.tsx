"use client";
import { useMemo, useState } from "react";
import { Link, useRouter } from "@/lib/router";
import {
  Eye, EyeOff, ArrowRight, ArrowLeft, Car, Bus, Zap, Check, Loader2,
  ShieldAlert, WifiOff, User, Mail, Phone, Lock, Hash, Tag, Palette, MapPin,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useFirebaseList, firebaseOps } from "@/lib/firebase-hooks";
import { friendlyAuthError } from "@/lib/auth-errors";
import ImageUpload from "@/components/ImageUpload";
import type { Route } from "@/lib/types";
import RegisterSidePanel from "@/components/RegisterSidePanel";

const STEPS = [
  { n: "01", label: "Identité" },
  { n: "02", label: "Véhicule" },
  { n: "03", label: "Validation" },
];

export default function DriverRegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { data: routes } = useFirebaseList<Route>("routes");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirmPassword: "", phone: "",
    vehicleType: "taxi" as "bus" | "taxi",
    vehicleNumber: "", vehicleColor: "", vehicleBrand: "",
    lineNumber: "", route: "", canDoSpecial: false,
    imageUrl: "", vehicleImageUrl: "",
  });
  const update = (f: string, v: unknown) => setForm((s) => ({ ...s, [f]: v }));

  // Lignes de bus = celles créées par l'admin (temps réel), pas une liste figée.
  const busLines = useMemo(() => routes.filter((r) => r.type === "bus"), [routes]);
  const points = useMemo(
    () => Array.from(new Set(routes.flatMap((r) => [r.startPoint, r.endPoint, ...(r.waypoints || [])]))).filter(Boolean).sort(),
    [routes]
  );

  const next = () => {
    setError("");
    if (step === 1) {
      if (!form.fullName || !form.email || !form.phone || !form.password || !form.confirmPassword) { setError("Tous les champs * sont obligatoires."); return; }
      if (form.password !== form.confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }
      if (form.password.length < 6) { setError("Le mot de passe doit faire au moins 6 caractères."); return; }
    }
    if (step === 2) {
      if (!form.vehicleNumber) { setError("Le numéro du véhicule est obligatoire."); return; }
      if (form.vehicleType === "bus" && !form.lineNumber) { setError("Indiquez une ligne de bus."); return; }
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const submit = async () => {
    setLoading(true); setError("");
    try {
      const u = await signUp(form.email, form.password, form.fullName);
      await firebaseOps.set(`drivers/${u.uid}`, {
        fullName: form.fullName, email: form.email, phone: form.phone,
        vehicleType: form.vehicleType,
        vehicleNumber: form.vehicleNumber.toUpperCase(),
        vehicleColor: form.vehicleColor, vehicleBrand: form.vehicleBrand,
        lineNumber: form.lineNumber, route: form.route,
        canDoSpecial: form.canDoSpecial,
        imageUrl: form.imageUrl || null, vehicleImageUrl: form.vehicleImageUrl || null,
        status: "pending", rating: 0, totalRatings: 0, isOnline: false,
        createdAt: Date.now(), updatedAt: Date.now(),
      });
      router.push("/driver/dashboard");
    } catch (err: any) {
      setError(friendlyAuthError(err?.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#0b2545] font-body grid lg:grid-cols-[1fr_1.1fr]">
      <main className="relative flex flex-col min-h-screen order-2 lg:order-1 form-rise bg-grid">
        <div className="sticky top-0 z-20 bg-[#f4f6f8]/95 backdrop-blur border-b-2 border-[#0b2545]/10">
          <div className="max-w-xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#06b6a4] flex items-center justify-center"><Car className="w-4 h-4 text-[#0b2545]" strokeWidth={2.5} /></div>
              <span className="font-display font-black text-[13px] tracking-tight hidden sm:inline">TransMahajanga</span>
            </Link>
            <div className="flex items-center gap-2.5">
              {STEPS.map((s, i) => {
                const done = step > i + 1; const active = step === i + 1;
                return (
                  <div key={s.n} className="flex items-center gap-2">
                    <div className={`w-7 h-7 flex items-center justify-center font-mono text-[11px] font-bold ${done ? "bg-[#06b6a4] text-[#0b2545]" : active ? "bg-[#0b2545] text-[#ffd60a]" : "bg-[#0b2545]/10 text-[#5a6b82]"}`}>
                      {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : s.n}
                    </div>
                    <span className={`hidden md:inline font-mono text-[10px] uppercase tracking-[0.25em] ${active ? "text-[#0b2545]" : "text-[#5a6b82]"}`}>{s.label}</span>
                    {i < STEPS.length - 1 && <span className="w-4 h-px bg-[#0b2545]/20" />}
                  </div>
                );
              })}
            </div>
            <Link href="/driver/login" className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#5a6b82] hover:text-[#06b6a4] link-underline">connexion</Link>
          </div>
          <div className="h-[3px] bg-[#0b2545]/5"><div className="h-full bg-[#06b6a4] transition-all duration-500" style={{ width: `${(step / STEPS.length) * 100}%` }} /></div>
        </div>

        <div className="flex-1 flex items-start justify-center px-6 lg:px-10 py-10 lg:py-14">
          <div className="w-full max-w-xl">
            <div className="flex items-baseline gap-4 mb-2">
              <span className="font-display font-black text-5xl text-[#048a7c] tabular-nums leading-none">{STEPS[step - 1].n}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#5a6b82]">étape {step} / {STEPS.length}</span>
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl tracking-[-0.03em] leading-[0.95]">
              {step === 1 && <>Qui êtes-<span className="text-[#048a7c]">vous ?</span></>}
              {step === 2 && <>Votre <span className="text-[#048a7c]">véhicule.</span></>}
              {step === 3 && <>Dernière <span className="text-[#048a7c]">vérification.</span></>}
            </h1>

            {error && (
              <div className="mt-7 border-l-[3px] border-[#ff3b30] bg-[#ffe5e3] p-4 flex items-start gap-3 reveal">
                {error.includes("Email/Password") || error.includes("Realtime Database") ? <WifiOff className="w-4 h-4 text-[#c92a22] mt-0.5 flex-shrink-0" /> : <ShieldAlert className="w-4 h-4 text-[#c92a22] mt-0.5 flex-shrink-0" />}
                <div className="flex-1"><div className="font-display font-bold text-[13px] text-[#c92a22]">Erreur</div><p className="text-[12px] text-[#0b2545]/85 mt-0.5 leading-snug">{error}</p></div>
              </div>
            )}

            {step === 1 && (
              <div className="mt-8 space-y-7 reveal">
                <Field idx="01" label="nom complet" required Icon={User}><input type="text" placeholder="Rakoto Jean" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className={inputCls} /></Field>
                <div className="grid sm:grid-cols-2 gap-7">
                  <Field idx="02" label="email" required Icon={Mail}><input type="email" placeholder="prenom@exemple.mg" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputCls} /></Field>
                  <Field idx="03" label="téléphone" required Icon={Phone}><input type="tel" placeholder="034 XX XXX XX" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputCls + " font-mono"} /></Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-7">
                  <Field idx="04" label="mot de passe" required Icon={Lock}>
                    <div className="relative">
                      <input type={showPass ? "text" : "password"} placeholder="min. 6 car." value={form.password} onChange={(e) => update("password", e.target.value)} className={inputCls + " pr-10 font-mono"} />
                      <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-0 top-2.5 text-[#5a6b82] hover:text-[#06b6a4]">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                  </Field>
                  <Field idx="05" label="confirmer" required Icon={Lock}><input type="password" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className={inputCls + " font-mono"} /></Field>
                </div>
                <Field idx="06" label="photo de profil" Icon={User}>
                  <ImageUpload
                    value={form.imageUrl}
                    onChange={(u) => update("imageUrl", u)}
                    label="Choisir la photo de profil"
                    pathPrefix="profiles/pending"
                    theme="light"
                  />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="mt-8 space-y-7 reveal">
                <Field idx="01" label="type de véhicule" required Icon={Car}>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { v: "taxi", Icon: Car, label: "Taxi", sub: "transport individuel", color: "#06b6a4" },
                      { v: "bus", Icon: Bus, label: "Bus", sub: "ligne régulière", color: "#ff3b30" },
                    ] as const).map(({ v, Icon, label, sub, color }) => {
                      const active = form.vehicleType === v;
                      return (
                        <button key={v} type="button" onClick={() => update("vehicleType", v)} className={`relative p-5 text-left border-2 transition-colors ${active ? "border-[#0b2545] bg-[#0b2545] text-[#f4f6f8]" : "border-[#0b2545]/15 hover:border-[#0b2545]/40 bg-white"}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-9 h-9 flex items-center justify-center" style={{ background: active ? color : color + "22" }}><Icon className="w-4 h-4" style={{ color: active ? "#0b2545" : color }} strokeWidth={2.5} /></div>
                            {active && <Check className="w-5 h-5" style={{ color }} />}
                          </div>
                          <div className="font-display font-black text-2xl tracking-tight">{label}</div>
                          <div className={`font-mono text-[9px] uppercase tracking-[0.25em] mt-1.5 ${active ? "text-white/60" : "text-[#5a6b82]"}`}>{sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <div className="grid sm:grid-cols-3 gap-6">
                  <Field idx="02" label="n° immatriculation" required Icon={Hash}><input type="text" placeholder="1234 TM 01" value={form.vehicleNumber} onChange={(e) => update("vehicleNumber", e.target.value.toUpperCase())} className={inputCls + " font-mono uppercase"} /></Field>
                  <Field idx="03" label="marque" Icon={Tag}><input type="text" placeholder="Toyota, Tata…" value={form.vehicleBrand} onChange={(e) => update("vehicleBrand", e.target.value)} className={inputCls} /></Field>
                  <Field idx="04" label="couleur" Icon={Palette}><input type="text" placeholder="Blanc, rouge…" value={form.vehicleColor} onChange={(e) => update("vehicleColor", e.target.value)} className={inputCls} /></Field>
                </div>

                {form.vehicleType === "bus" && (
                  <Field idx="05" label="ligne de bus" required Icon={MapPin}>
                    {busLines.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-3">
                        {busLines.map((line) => {
                          const active = form.lineNumber === line.lineNumber;
                          return (
                            <button key={line.id} type="button" onClick={() => { update("lineNumber", line.lineNumber); update("route", line.name); }} className={`p-3.5 text-left border-2 transition-colors ${active ? "border-[#0b2545] bg-[#0b2545] text-[#f4f6f8]" : "border-[#0b2545]/15 hover:border-[#0b2545]/40 bg-white"}`}>
                              <div className="flex items-center gap-2.5">
                                <span className="w-7 h-7 flex items-center justify-center font-display font-black text-xs" style={{ background: line.color, color: "#0b2545" }}>{line.lineNumber}</span>
                                <div><div className="font-display font-bold text-[13px]">{line.lineNumber}</div><div className={`font-mono text-[8px] uppercase tracking-[0.2em] ${active ? "text-white/50" : "text-[#5a6b82]"}`}>ligne</div></div>
                              </div>
                              <div className={`text-[11px] mt-2 leading-tight ${active ? "text-white/80" : "text-[#5a6b82]"}`}>{line.name}</div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="n° de ligne (ex. L7)" value={form.lineNumber} onChange={(e) => update("lineNumber", e.target.value)} className={inputCls + " font-mono"} />
                      <input type="text" placeholder="nom du trajet" value={form.route} onChange={(e) => update("route", e.target.value)} className={inputCls} />
                    </div>
                    {busLines.length === 0 && <p className="text-[11px] text-[#5a6b82] mt-2">Aucune ligne publiée pour l'instant : saisissez-la manuellement.</p>}
                  </Field>
                )}

                {form.vehicleType === "taxi" && (
                  <Field idx="05" label="zone principale de service" Icon={MapPin}>
                    <datalist id="reg-zones">{points.map((p) => (<option key={p} value={p} />))}</datalist>
                    <input list="reg-zones" type="text" placeholder={points.length ? "saisir ou choisir" : "ex. Centre-ville"} value={form.route} onChange={(e) => update("route", e.target.value)} className={inputCls} />
                  </Field>
                )}

                <Field idx="06" label="photo du véhicule" Icon={Car}>
                  <ImageUpload
                    value={form.vehicleImageUrl}
                    onChange={(u) => update("vehicleImageUrl", u)}
                    label="Choisir la photo du véhicule"
                    pathPrefix="profiles/pending"
                    theme="light"
                  />
                </Field>

                <label className="flex items-start gap-4 p-5 border-2 border-[#0b2545]/15 bg-white hover:border-[#0b2545]/40 cursor-pointer transition-colors">
                  <button type="button" onClick={(e) => { e.preventDefault(); update("canDoSpecial", !form.canDoSpecial); }} className={`mt-0.5 w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${form.canDoSpecial ? "bg-[#ffd60a] border-[#ffd60a]" : "border-[#0b2545]/40"}`}>{form.canDoSpecial && <Check className="w-3.5 h-3.5 text-[#0b2545]" strokeWidth={3} />}</button>
                  <div className="flex-1" onClick={(e) => { e.preventDefault(); update("canDoSpecial", !form.canDoSpecial); }}>
                    <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#ff3b30]" /><span className="font-display font-bold text-[15px]">Trajets spéciaux</span></div>
                    <p className="text-[12px] text-[#5a6b82] mt-1 leading-snug">J'accepte les commandes hors ligne régulière (événements, aéroport, groupes).</p>
                  </div>
                </label>
              </div>
            )}

            {step === 3 && (
              <div className="mt-8 space-y-5 reveal">
                <RecapGroup title="Identité" tone="marine" items={[{ k: "nom", v: form.fullName }, { k: "email", v: form.email, mono: true }, { k: "téléphone", v: form.phone, mono: true }]} />
                <RecapGroup title="Véhicule" tone={form.vehicleType === "bus" ? "coral" : "teal"} items={[
                  { k: "type", v: form.vehicleType === "bus" ? "Bus" : "Taxi" },
                  { k: "immatriculation", v: form.vehicleNumber, mono: true },
                  ...(form.vehicleBrand ? [{ k: "marque", v: form.vehicleBrand }] : []),
                  ...(form.vehicleColor ? [{ k: "couleur", v: form.vehicleColor }] : []),
                  ...(form.lineNumber ? [{ k: "ligne", v: form.lineNumber, mono: true }] : []),
                  ...(form.route ? [{ k: "zone / trajet", v: form.route }] : []),
                ]} />
                <RecapGroup title="Options" tone="sun" items={[{ k: "trajets spéciaux", v: form.canDoSpecial ? "activés" : "non" }, { k: "statut initial", v: "en attente de validation" }]} />
                <div className="flex items-start gap-3 p-4 bg-[#0b2545] text-[#f4f6f8]">
                  <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#ffd60a]" />
                  <p className="text-[12px] leading-relaxed">Votre compte sera placé en <strong className="text-[#ffd60a]">attente de validation</strong> par l'administration. Notification dès l'activation.</p>
                </div>
              </div>
            )}

            <div className="mt-10 flex items-center justify-between gap-4 pt-6 border-t-2 border-[#0b2545]/10">
              {step > 1 ? (
                <button onClick={() => setStep((s) => Math.max(1, s - 1))} className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-[#5a6b82] hover:text-[#0b2545]"><ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> retour</button>
              ) : <span />}
              {step < 3 ? (
                <button onClick={next} className="group inline-flex items-center gap-3 bg-[#0b2545] text-[#f4f6f8] px-6 py-3.5 hover:bg-[#06b6a4] hover:text-[#0b2545] transition-colors"><span className="font-mono text-[11px] uppercase tracking-[0.3em] font-bold">continuer</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></button>
              ) : (
                <button onClick={submit} disabled={loading} className="group inline-flex items-center gap-3 bg-[#ff3b30] text-[#0b2545] px-6 py-3.5 hover:bg-[#0b2545] hover:text-[#ffd60a] transition-colors disabled:opacity-60"><span className="font-mono text-[11px] uppercase tracking-[0.3em] font-bold">{loading ? "création…" : "valider l'inscription"}</span>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={3} />}</button>
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="order-1 lg:order-2">
        <RegisterSidePanel
          tone="teal"
          moduleNumber="02"
          moduleLabel="Inscription chauffeur"
          headline="Rejoignez le réseau officiel TransMahajanga. Réservations, trajets spéciaux, revenus — une seule interface."
          afterSteps={[
            "Compte placé en attente de validation.",
            "Notification dès activation par l'admin.",
            "Partage GPS et réservations en direct.",
          ]}
        />
      </div>
    </div>
  );
}

const inputCls = "w-full bg-transparent border-b-2 border-[#0b2545]/20 focus:border-[#06b6a4] outline-none py-2.5 text-[15px] font-medium transition-colors placeholder:text-[#5a6b82]/50";

function Field({ label, required, idx, Icon, children }: { label: string; required?: boolean; idx: string; Icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="group/field">
      <label className="flex items-center gap-2 mb-2">
        <span className="font-mono text-[10px] text-[#048a7c] tabular-nums">{idx}</span>
        <Icon className="w-3.5 h-3.5 text-[#5a6b82] group-focus-within/field:text-[#06b6a4] transition-colors" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#5a6b82]">{label}</span>
        {required && <span className="text-[#ff3b30] text-[11px]">*</span>}
      </label>
      {children}
    </div>
  );
}

const GROUP_TONES: Record<string, string> = { marine: "bg-[#0b2545] text-[#f4f6f8]", coral: "bg-[#ff3b30] text-[#0b2545]", teal: "bg-[#06b6a4] text-[#0b2545]", sun: "bg-[#ffd60a] text-[#0b2545]" };
function RecapGroup({ title, tone, items }: { title: string; tone: keyof typeof GROUP_TONES; items: Array<{ k: string; v: string; mono?: boolean }> }) {
  return (
    <div>
      <div className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] font-bold ${GROUP_TONES[tone]}`}>{title}</div>
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
