"use client";
import { useState } from "react";
import { Link } from "@/lib/router";
import {
  Calendar, Plus, Car, Bus, Zap, CheckCircle, XCircle, AlertCircle, Phone, Search, MessageSquare,
} from "lucide-react";
import { useFirebaseList, firebaseOps } from "@/lib/firebase-hooks";
import type { Reservation, Driver } from "@/lib/types";
import ReservationThread from "@/components/ReservationThread";
import toast from "react-hot-toast";

const statusMeta: Record<string, { label: string; pill: string; bar: string }> = {
  pending: { label: "En attente", pill: "bg-yellow-100 text-yellow-700", bar: "border-l-yellow-400" },
  confirmed: { label: "Confirmé", pill: "bg-green-100 text-green-700", bar: "border-l-green-500" },
  completed: { label: "Terminé", pill: "bg-slate-200 text-slate-600", bar: "border-l-slate-400" },
  cancelled: { label: "Annulé", pill: "bg-red-100 text-red-700", bar: "border-l-red-500" },
};

export default function ReservationsPage() {
  const [clientPhone, setClientPhone] = useState("");
  const [searched, setSearched] = useState("");
  const { data: reservations } = useFirebaseList<Reservation>("reservations");
  const { data: drivers } = useFirebaseList<Driver>("drivers");
  const getDriver = (id: string) => drivers.find((d) => d.id === id);

  const mine = reservations.filter((r) => r.clientPhone === searched);

  const handleCancel = async (id: string) => {
    if (!confirm("Annuler cette réservation ?")) return;
    try {
      await firebaseOps.update(`reservations/${id}`, { status: "cancelled" });
      toast.success("Réservation annulée");
    } catch {
      toast.error("Erreur lors de l'annulation");
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#048a7c] mb-1">§ mes trajets</div>
          <h1 className="font-display font-black text-3xl tracking-tight text-slate-800">Réservations</h1>
        </div>
        <Link href="/client/reservations/new" className="flex items-center gap-1.5 bg-[#0b2545] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#1b4079] transition-colors">
          <Plus className="w-4 h-4" /> Nouvelle
        </Link>
      </div>

      {/* Recherche par téléphone */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 mb-6">
        <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" /> Retrouvez vos réservations
        </p>
        <div className="flex gap-2">
          <input
            type="tel"
            placeholder="Votre numéro (034 XX XXX XX)"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setSearched(clientPhone.trim()); } }}
            className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#06b6a4]"
          />
          <button onClick={() => setSearched(clientPhone.trim())} className="bg-[#0b2545] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#1b4079] transition-colors">
            Voir
          </button>
        </div>
      </div>

      {/* CTA */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/client/reservations/new?type=taxi" className="bg-gradient-to-br from-[#06b6a4] to-[#048a7c] rounded-2xl p-4 text-white hover:-translate-y-0.5 transition-transform">
          <Car className="w-6 h-6 mb-2" />
          <p className="font-semibold">Réserver un taxi</p>
          <p className="text-[#d1f1ec] text-xs mt-1">Tarif taxi admin</p>
        </Link>
        <Link href="/client/reservations/new?type=bus" className="bg-gradient-to-br from-[#ff3b30] to-[#c92a22] rounded-2xl p-4 text-white hover:-translate-y-0.5 transition-transform">
          <Bus className="w-6 h-6 mb-2" />
          <p className="font-semibold">Réserver un bus</p>
          <p className="text-[#ffd9d6] text-xs mt-1">Arrêts de la ligne</p>
        </Link>
      </div>

      {!searched && (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Entrez votre numéro</p>
          <p className="text-slate-400 text-sm mt-1">pour afficher vos réservations et échanger avec le chauffeur.</p>
        </div>
      )}

      {searched && mine.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <Search className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Aucune réservation pour {searched}</p>
          <p className="text-slate-400 text-sm mt-1">Vérifiez le numéro ou créez une nouvelle réservation.</p>
        </div>
      )}

      {searched && mine.length > 0 && (
        <div className="space-y-3">
          {mine.sort((a, b) => b.createdAt - a.createdAt).map((res) => {
            const driver = getDriver(res.driverId);
            const meta = statusMeta[res.status] || statusMeta.pending;
            return (
              <div key={res.id} className={`bg-white border border-slate-200 border-l-4 ${meta.bar} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${res.type === "taxi" ? "bg-[#06b6a4]" : res.type === "special" ? "bg-[#457b9d]" : "bg-[#ff3b30]"}`}>
                      {res.type === "taxi" ? <Car className="w-4 h-4 text-[#0b2545]" /> : res.type === "special" ? <Zap className="w-4 h-4 text-white" /> : <Bus className="w-4 h-4 text-[#0b2545]" />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm capitalize">{res.type === "special" ? "Bus spécial" : res.type}</p>
                      <p className="text-slate-400 text-xs">
                        {new Date(res.reservationDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${meta.pill}`}>
                    {res.status === "pending" ? <AlertCircle className="w-3 h-3" /> : res.status === "confirmed" ? <CheckCircle className="w-3 h-3" /> : res.status === "cancelled" ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    {meta.label}
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                    <span className="text-slate-600 truncate">{res.startPoint}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                    <span className="text-slate-600 truncate">{res.endPoint}</span>
                  </div>
                </div>

                {driver && (
                  <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 bg-[#0b2545] rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{driver.fullName.charAt(0)}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{driver.fullName}</p>
                        <p className="text-xs text-slate-400 truncate">{driver.vehicleNumber}</p>
                      </div>
                    </div>
                    <a href={`tel:${driver.phone}`} className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0">
                      <Phone className="w-3 h-3" /> Appeler
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{res.passengerCount} passager(s)</span>
                    <span className="font-semibold text-[#048a7c] tabular-nums">{res.totalPrice?.toLocaleString()} Ar</span>
                  </div>
                  {res.status === "pending" && (
                    <button onClick={() => handleCancel(res.id)} className="text-xs text-red-600 hover:text-red-700 font-medium">Annuler</button>
                  )}
                </div>

                {res.notes && <p className="text-xs text-slate-400 mt-2 italic">« {res.notes} »</p>}

                {/* Échange de messages sur la réservation */}
                <ReservationThread resId={res.id} mode="client" authorName={res.clientName} theme="light" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
