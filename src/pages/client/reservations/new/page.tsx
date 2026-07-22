"use client";
import { Suspense, useMemo, useState } from "react";
import { Link, useRouter, useSearchParams } from "@/lib/router";
import { ArrowLeft, Car, Bus, Zap, Check, Loader2, User, Phone, MapPin } from "lucide-react";
import { useFirebaseList, useFirebaseData, firebaseOps } from "@/lib/firebase-hooks";
import type { Driver, Route } from "@/lib/types";
import { friendlyAuthError } from "@/lib/auth-errors";
import toast from "react-hot-toast";

function NewReservationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initType = (searchParams.get("type") as "taxi" | "special" | "bus") || "taxi";
  const initDriverId = searchParams.get("driverId") || "";

  const { data: drivers } = useFirebaseList<Driver>("drivers");
  const { data: routes } = useFirebaseList<Route>("routes");
  const { data: settings } = useFirebaseData<{ taxiPrice?: number; specialPrice?: number } | null>("settings/general");

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    type: initType,
    clientName: "",
    clientPhone: "",
    driverId: initDriverId,
    selectedLineId: "",
    startPoint: "",
    endPoint: "",
    reservationDate: "",
    reservationTime: "",
    passengerCount: 1,
    notes: "",
  });
  const update = (f: string, v: unknown) => setForm((s) => ({ ...s, [f]: v }));

  const busLines = useMemo(() => routes.filter((r) => r.type === "bus"), [routes]);
  const selectedLine = busLines.find((r) => r.id === form.selectedLineId) || null;
  const stops = selectedLine
    ? [selectedLine.startPoint, ...(selectedLine.waypoints || []), selectedLine.endPoint].filter(Boolean)
    : [];
  const allPoints = useMemo(
    () => Array.from(new Set(routes.flatMap((r) => [r.startPoint, r.endPoint, ...(r.waypoints || [])]))).filter(Boolean).sort(),
    [routes]
  );

  // Prix « normal » enregistré par l'admin (varie selon bus / taxi / spécial).
  // Prix spécial selon le nombre de places : palier le plus élevé dont
  // minSeats <= nombre de passagers ; sinon tarif normal de la ligne.
  const busTier = (selectedLine?.specialTiers || [])
    .filter((t) => t.minSeats <= form.passengerCount)
    .sort((a, b) => b.minSeats - a.minSeats)[0];
  // Tarif bus spécial selon le nombre de personnes (paliers globaux admin).
  const specialTiersGlobal = ((settings as any)?.specialTiers || []) as { minSeats: number; price: number }[];
  const specialTier = specialTiersGlobal
    .filter((t) => t.minSeats <= form.passengerCount)
    .sort((a, b) => b.minSeats - a.minSeats)[0];
  const pricePerPerson =
    form.type === "bus"
      ? busTier?.price ?? selectedLine?.price ?? 0
      : form.type === "special"
      ? specialTier?.price ?? settings?.specialPrice ?? 15000
      : settings?.taxiPrice ?? 5000;
  const totalPrice = pricePerPerson * form.passengerCount;

  // Chauffeurs éligibles : pour un bus, ceux de la ligne choisie ; sinon taxi / spécial.
  // Bus : uniquement les chauffeurs affectés à la ligne choisie (filtrage strict).
  const availableDrivers = drivers.filter((d) => {
    if (d.status !== "active") return false;
    if (form.type === "bus") {
      if (!selectedLine) return false;
      return d.vehicleType === "bus" && d.lineNumber === selectedLine.lineNumber;
    }
    if (form.type === "special") return d.canDoSpecial;
    return d.vehicleType === "taxi";
  });

  const selectedDriver = drivers.find((d) => d.id === form.driverId);

  const handleSubmit = async () => {
    setError("");
    if (!form.clientName || !form.clientPhone || !form.startPoint || !form.endPoint) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (form.type !== "bus" && !form.driverId) {
      setError("Choisissez un chauffeur.");
      return;
    }
    if (form.type === "bus" && !form.driverId) {
      setError("Choisissez le chauffeur de la ligne qui assurera le trajet.");
      return;
    }
    setSubmitting(true);
    try {
      const reservationDate =
        form.reservationDate && form.reservationTime
          ? new Date(`${form.reservationDate}T${form.reservationTime}`).getTime()
          : Date.now();
      const rid = await firebaseOps.push("reservations", {
        clientName: form.clientName,
        clientPhone: form.clientPhone,
        driverId: form.driverId,
        routeId: form.type === "bus" ? selectedLine?.id || null : null,
        type: form.type,
        status: "pending",
        startPoint: form.startPoint,
        endPoint: form.endPoint,
        reservationDate,
        passengerCount: form.passengerCount,
        totalPrice,
        notes: form.notes || null,
      });
      const body = `${form.clientName} · ${form.startPoint} → ${form.endPoint}`;
      await firebaseOps.push(`notifications/${form.driverId}`, {
        title: form.type === "bus" ? `Réservation ligne ${selectedLine?.lineNumber || ""}` : "Nouvelle réservation",
        body,
        type: "reservation",
        isRead: false,
        target: { tab: "reservations", id: rid || undefined },
      });
      toast.success("Réservation envoyée !");
      router.push("/client/reservations");
    } catch (err: any) {
      setError(friendlyAuthError(err?.message));
    } finally {
      setSubmitting(false);
    }
  };

  const lineLocked = form.type === "bus" && !selectedLine;

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/client/reservations" className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display font-black text-xl tracking-tight text-slate-800">Nouvelle réservation</h1>
          <p className="text-slate-500 text-sm">Étape {step} / 3</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? "bg-[#0b2545]" : "bg-slate-200"}`} />
        ))}
      </div>

      {error && (
        <div className="mb-5 border-l-[3px] border-[#ff3b30] bg-[#ffe5e3] pl-4 pr-3 py-3 text-[12px] text-[#c92a22] reveal">{error}</div>
      )}

      {step === 1 && (
        <div className="space-y-3 reveal">
          {([
            { type: "taxi", Icon: Car, label: "Taxi", desc: "Course individuelle, tarif taxi", color: "#06b6a4" },
            { type: "bus", Icon: Bus, label: "Bus (ligne)", desc: "Réservez sur une ligne de bus", color: "#ff3b30" },
            { type: "special", Icon: Zap, label: "Bus / Taxi spécial", desc: "Groupes, événements, aéroport", color: "#457b9d" },
          ] as const).map((opt) => (
            <button key={opt.type} onClick={() => { update("type", opt.type); update("selectedLineId", ""); update("driverId", ""); update("startPoint", ""); update("endPoint", ""); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${form.type === opt.type ? "border-[#0b2545] bg-[#0b2545]/5" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: form.type === opt.type ? opt.color : opt.color + "22" }}>
                <opt.Icon className="w-6 h-6" style={{ color: form.type === opt.type ? "#0b2545" : opt.color }} />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{opt.label}</p>
                <p className="text-sm text-slate-500">{opt.desc}</p>
              </div>
              {form.type === opt.type && <Check className="w-5 h-5 text-[#048a7c] ml-auto" />}
            </button>
          ))}
          <button onClick={() => setStep(2)} className="w-full py-3 bg-[#0b2545] text-white rounded-2xl font-semibold hover:bg-[#1b4079] transition-colors">Continuer</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5 reveal">
          <datalist id="res-zones">
            {allPoints.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>

          {form.type === "bus" && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Ligne de bus *</label>
              {busLines.length === 0 ? (
                <p className="text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-xl p-3">Aucune ligne créée par l'administration pour l'instant.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {busLines.map((line) => {
                    const active = form.selectedLineId === line.id;
                    return (
                      <button key={line.id} type="button" onClick={() => { update("selectedLineId", line.id); update("startPoint", ""); update("endPoint", ""); update("driverId", ""); }} className={`p-3 text-left border-2 rounded-xl transition-all ${active ? "border-[#0b2545] bg-[#0b2545]/5" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-black text-xs text-[#0b2545]" style={{ background: line.color || "#ff3b30" }}>{line.lineNumber}</span>
                          <span className="font-medium text-slate-800 text-sm truncate">{line.name}</span>
                        </div>
                        <div className="text-[#048a7c] font-bold text-sm mt-1 tabular-nums">{line.price?.toLocaleString()} Ar</div>
                        {(line.specialTiers || []).length > 0 && (
                          <div className="text-[10px] text-[#c92a22] mt-0.5">
                            dès {Math.min(...(line.specialTiers || []).map((t) => t.minSeats))} places : tarif spécial
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Départ / Arrivée */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full" /> Départ *</label>
              {form.type === "bus" ? (
                <select value={form.startPoint} onChange={(e) => update("startPoint", e.target.value)} disabled={lineLocked} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#06b6a4] disabled:opacity-50">
                  <option value="">{lineLocked ? "choisir une ligne" : "arrêt de départ"}</option>
                  {stops.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <input list="res-zones" value={form.startPoint} onChange={(e) => update("startPoint", e.target.value)} placeholder="saisir ou choisir" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#06b6a4]" />
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full" /> Destination *</label>
              {form.type === "bus" ? (
                <select value={form.endPoint} onChange={(e) => update("endPoint", e.target.value)} disabled={lineLocked} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#06b6a4] disabled:opacity-50">
                  <option value="">{lineLocked ? "choisir une ligne" : "arrêt d'arrivée"}</option>
                  {stops.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <input list="res-zones" value={form.endPoint} onChange={(e) => update("endPoint", e.target.value)} placeholder="saisir ou choisir" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#06b6a4]" />
              )}
            </div>
          </div>

          {form.type === "special" && ((settings as any)?.specialTiers || []).length > 0 && (
            <div className="bg-[#fff7e6] border border-[#ffd60a]/50 rounded-xl p-3">
              <p className="text-[#b8860b] text-xs font-semibold mb-1.5 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Tarifs spéciaux selon le nombre de personnes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {((settings as any).specialTiers as { minSeats: number; price: number }[]).map((t, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-[#ffd60a]/30 text-[#7a5b00] font-medium tabular-nums">
                    ≥ {t.minSeats} pers → {t.price.toLocaleString()} Ar
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Chauffeur (taxi / spécial, ou chauffeur de la ligne pour un bus) */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              {form.type === "bus" ? "Chauffeur de la ligne *" : "Chauffeur *"}
            </label>
            <div className="space-y-2 max-h-44 overflow-y-auto">
              {availableDrivers.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4 bg-slate-50 border border-slate-200 rounded-xl">
                  {form.type === "bus" ? "Aucun chauffeur affecté à cette ligne." : "Aucun chauffeur disponible pour ce type."}
                </p>
              ) : (
                availableDrivers.map((driver) => (
                  <button key={driver.id} type="button" onClick={() => update("driverId", driver.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${form.driverId === driver.id ? "border-[#0b2545] bg-[#0b2545]/5" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                    {driver.imageUrl ? <img src={driver.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 bg-[#0b2545] rounded-lg flex items-center justify-center text-white font-bold">{driver.fullName.charAt(0)}</div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{driver.fullName}</p>
                      <p className="text-slate-400 text-xs">{driver.vehicleNumber}</p>
                    </div>
                    {driver.isOnline && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                    {form.driverId === driver.id && <Check className="w-4 h-4 text-[#048a7c]" />}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Date</label>
              <input type="date" value={form.reservationDate} onChange={(e) => update("reservationDate", e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#06b6a4]" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Heure</label>
              <input type="time" value={form.reservationTime} onChange={(e) => update("reservationTime", e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#06b6a4]" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Passagers</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => update("passengerCount", Math.max(1, form.passengerCount - 1))} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold">-</button>
              <span className="text-xl font-bold min-w-[2rem] text-center tabular-nums">{form.passengerCount}</span>
              <button type="button" onClick={() => update("passengerCount", Math.min(50, form.passengerCount + 1))} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold">+</button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Notes (optionnel)</label>
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2} placeholder="Instructions spéciales…" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#06b6a4] resize-none" />
          </div>

          <div className="bg-[#d1f1ec] border border-[#06b6a4]/40 rounded-2xl p-4">
            <div className="flex items-center justify-between text-[#048a7c] text-sm">
              <span>Tarif unitaire ({form.type === "bus" ? "ligne" : "admin"})</span>
              <span className="font-bold tabular-nums">{pricePerPerson.toLocaleString()} Ar</span>
            </div>
            <div className="flex items-center justify-between text-[#048a7c] mt-1 pt-1 border-t border-[#06b6a4]/30">
              <span className="font-semibold">Total ({form.passengerCount} passager{form.passengerCount > 1 ? "s" : ""})</span>
              <span className="font-bold text-xl tabular-nums">{totalPrice.toLocaleString()} Ar</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-2xl font-medium hover:bg-slate-50">Retour</button>
            <button onClick={() => setStep(3)} disabled={!form.driverId || !form.startPoint || !form.endPoint || (form.type === "bus" && !selectedLine)} className="flex-1 py-3 bg-[#0b2545] text-white rounded-2xl font-semibold hover:bg-[#1b4079] disabled:opacity-50">Continuer</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5 reveal">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-1"><User className="w-4 h-4" /> Votre nom *</label>
            <input type="text" value={form.clientName} onChange={(e) => update("clientName", e.target.value)} placeholder="Prénom et Nom" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#06b6a4]" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-1"><Phone className="w-4 h-4" /> Votre téléphone *</label>
            <input type="tel" value={form.clientPhone} onChange={(e) => update("clientPhone", e.target.value)} placeholder="034 XX XXX XX" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#06b6a4]" />
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Récapitulatif</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-medium capitalize">{form.type === "special" ? "Bus spécial" : form.type}{form.type === "bus" && selectedLine ? ` · ${selectedLine.lineNumber}` : ""}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Chauffeur</span><span className="font-medium">{selectedDriver?.fullName || "-"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Trajet</span><span className="font-medium">{form.startPoint} → {form.endPoint}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Passagers</span><span className="font-medium tabular-nums">{form.passengerCount}</span></div>
              <div className="flex justify-between pt-2 border-t border-slate-100"><span className="font-semibold">Total</span><span className="font-bold text-[#048a7c] tabular-nums">{totalPrice.toLocaleString()} Ar</span></div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-2xl font-medium hover:bg-slate-50">Retour</button>
            <button onClick={handleSubmit} disabled={submitting || !form.clientName || !form.clientPhone} className="flex-1 py-3 bg-[#ff3b30] text-[#0b2545] rounded-2xl font-semibold hover:bg-[#c92a22] hover:text-white disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={3} />}
              {submitting ? "Envoi…" : "Confirmer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewReservationPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-10 text-center text-slate-500">Chargement…</div>}>
      <NewReservationContent />
    </Suspense>
  );
}
