"use client";
import { useMemo, useState, useEffect } from "react";
import { Link, useRouter } from "@/lib/router";
import { ArrowLeft, Save, Check, Car, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useFirebaseList, firebaseOps } from "@/lib/firebase-hooks";
import ImageUpload from "@/components/ImageUpload";
import type { Route } from "@/lib/types";
import toast from "react-hot-toast";

export default function DriverProfilePage() {
  const router = useRouter();
  const { user, driver, loading, refresh } = useAuth();
  const { data: routes } = useFirebaseList<Route>("routes");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "", phone: "", vehicleNumber: "", vehicleColor: "", vehicleBrand: "",
    lineNumber: "", route: "", canDoSpecial: false, imageUrl: "", vehicleImageUrl: "",
    vehicleType: "taxi" as "bus" | "taxi",
  });

  const busLines = useMemo(() => routes.filter((r) => r.type === "bus"), [routes]);
  const points = useMemo(
    () => Array.from(new Set(routes.flatMap((r) => [r.startPoint, r.endPoint, ...(r.waypoints || [])]))).filter(Boolean).sort(),
    [routes]
  );

  useEffect(() => {
    if (!loading && !user) router.push("/driver/login");
    if (driver) {
      setForm({
        fullName: driver.fullName || "", phone: driver.phone || "",
        vehicleNumber: driver.vehicleNumber || "", vehicleColor: driver.vehicleColor || "",
        vehicleBrand: driver.vehicleBrand || "", lineNumber: driver.lineNumber || "",
        route: driver.route || "", canDoSpecial: driver.canDoSpecial || false,
        imageUrl: driver.imageUrl || "", vehicleImageUrl: driver.vehicleImageUrl || "",
        vehicleType: driver.vehicleType || "taxi",
      });
    }
  }, [user, driver, loading, router]);

  const update = (f: string, v: unknown) => setForm((s) => ({ ...s, [f]: v }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await firebaseOps.update(`drivers/${user.uid}`, {
        fullName: form.fullName, phone: form.phone,
        vehicleNumber: form.vehicleNumber.toUpperCase(),
        vehicleColor: form.vehicleColor, vehicleBrand: form.vehicleBrand,
        lineNumber: form.lineNumber, route: form.route,
        canDoSpecial: form.canDoSpecial,
        imageUrl: form.imageUrl || null, vehicleImageUrl: form.vehicleImageUrl || null,
      });
      await refresh();
      toast.success("Profil mis à jour (synchronisé en temps réel) !");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0b2545] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#06b6a4]/30 border-t-[#06b6a4] rounded-full spinner" /></div>;

  return (
    <div className="min-h-screen bg-[#0b2545] py-6 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/driver/dashboard" className="w-10 h-10 bg-[#1b4079] border border-white/10 rounded-xl flex items-center justify-center text-white/70 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-white font-display font-black text-xl tracking-tight">Modifier le profil</h1>
            <p className="text-white/50 text-sm">Les changements se propagent en temps réel.</p>
          </div>
        </div>

        <div className="space-y-6">
          <Section title="Informations personnelles">
            <Row label="Nom complet"><input type="text" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className={inp} /></Row>
            <Row label="Téléphone"><input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inp + " font-mono"} /></Row>
            <Row label="Photo de profil">
              <ImageUpload
                value={form.imageUrl}
                onChange={(u) => update("imageUrl", u)}
                label="Choisir la photo de profil"
                pathPrefix={`profiles/${user?.uid || "pending"}`}
                theme="dark"
              />
            </Row>
          </Section>

          <Section title="Informations du véhicule">
            <Row label="Numéro du véhicule"><input type="text" value={form.vehicleNumber} onChange={(e) => update("vehicleNumber", e.target.value.toUpperCase())} className={inp + " font-mono uppercase"} /></Row>
            <div className="grid grid-cols-2 gap-4">
              <Row label="Marque"><input type="text" value={form.vehicleBrand} onChange={(e) => update("vehicleBrand", e.target.value)} className={inp} /></Row>
              <Row label="Couleur"><input type="text" value={form.vehicleColor} onChange={(e) => update("vehicleColor", e.target.value)} className={inp} /></Row>
            </div>

            {form.vehicleType === "bus" && (
              <Row label="Ligne de bus">
                {busLines.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {busLines.map((line) => {
                      const active = form.lineNumber === line.lineNumber;
                      return (
                        <button key={line.id} type="button" onClick={() => { update("lineNumber", line.lineNumber); update("route", line.name); }} className={`px-3 py-1.5 text-xs font-bold border transition-colors ${active ? "border-[#06b6a4] bg-[#06b6a4] text-[#0b2545]" : "border-white/20 text-white/70 hover:border-white/50"}`}>{line.lineNumber}</button>
                      );
                    })}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="n° ligne" value={form.lineNumber} onChange={(e) => update("lineNumber", e.target.value)} className={inp + " font-mono"} />
                  <input type="text" placeholder="nom trajet" value={form.route} onChange={(e) => update("route", e.target.value)} className={inp} />
                </div>
              </Row>
            )}

            {form.vehicleType === "taxi" && (
              <Row label="Zone principale">
                <datalist id="prof-zones">{points.map((p) => (<option key={p} value={p} />))}</datalist>
                <input list="prof-zones" type="text" value={form.route} onChange={(e) => update("route", e.target.value)} placeholder={points.length ? "saisir ou choisir" : "ex. Centre-ville"} className={inp} />
              </Row>
            )}

            <Row label="Photo du véhicule">
              <ImageUpload
                value={form.vehicleImageUrl}
                onChange={(u) => update("vehicleImageUrl", u)}
                label="Choisir la photo du véhicule"
                pathPrefix={`profiles/${user?.uid || "pending"}`}
                theme="dark"
              />
            </Row>

            <div onClick={() => update("canDoSpecial", !form.canDoSpecial)} className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${form.canDoSpecial ? "border-[#ffd60a] bg-[#ffd60a]/10" : "border-white/15 bg-white/5"}`}>
              <Zap className="w-4 h-4 text-[#ffd60a]" />
              <div className="flex-1"><div className="text-white text-sm font-medium">Trajets spéciaux</div><div className="text-white/50 text-xs">Disponible pour des demandes spéciales</div></div>
              <div className={`w-10 h-5 rounded-full transition-colors ${form.canDoSpecial ? "bg-[#ffd60a]" : "bg-white/20"}`}><div className={`w-3.5 h-3.5 bg-[#0b2545] rounded-full m-0.5 transition-transform ${form.canDoSpecial ? "translate-x-5" : "translate-x-0"}`} /></div>
            </div>
          </Section>

          <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 py-3 bg-[#06b6a4] text-[#0b2545] font-bold hover:bg-[#ffd60a] transition-colors disabled:opacity-60">
            {saving ? <div className="w-5 h-5 border-2 border-[#0b2545]/30 border-t-[#0b2545] rounded-full spinner" /> : <Save className="w-5 h-5" />}
            {saving ? "Sauvegarde…" : "Enregistrer les modifications"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full px-3 py-2.5 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#06b6a4] transition-colors";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#06b6a4] mb-4 flex items-center gap-2"><Car className="w-3.5 h-3.5" />{title}</div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1.5">{label}</label>
      {children}
    </div>
  );
}
