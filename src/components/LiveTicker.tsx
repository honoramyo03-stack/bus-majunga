"use client";
// Ticker « vivant » : au lieu d'événements simulés, il affiche en boucle des
// métriques calculées en temps réel depuis la base (chauffeurs actifs / en
// ligne, lignes, réservations en attente…). Quand la base est vide, il le
// dit honnêtement au lieu d'inventer des données.
import { useEffect, useState } from "react";
import { useFirebaseList } from "@/lib/firebase-hooks";
import type { Driver, Route, Reservation } from "@/lib/types";

export default function LiveTicker() {
  const { data: drivers } = useFirebaseList<Driver>("drivers");
  const { data: routes } = useFirebaseList<Route>("routes");
  const { data: reservations } = useFirebaseList<Reservation>("reservations");
  const [i, setI] = useState(0);

  const active = drivers.filter((d) => d.status === "active");
  const online = active.filter((d) => d.isOnline);
  const pendingDrivers = drivers.filter((d) => d.status === "pending");
  const pendingRes = reservations.filter((r) => r.status === "pending");
  const busLines = routes.filter((r) => r.type === "bus");

  const facts: Array<{ tag: string; text: string; tone: string }> =
    active.length === 0 && routes.length === 0
      ? [
          { tag: "SYS", text: "Réseau en cours d'initialisation", tone: "#457b9d" },
          { tag: "SYS", text: "Aucune donnée — l'administration crée les lignes et valide les chauffeurs", tone: "#457b9d" },
          { tag: "LIVE", text: "Connexion temps réel active", tone: "#06b6a4" },
        ]
      : [
          { tag: "LIVE", text: `${online.length} véhicule${online.length > 1 ? "s" : ""} en ligne maintenant`, tone: "#06b6a4" },
          { tag: "FLOTTE", text: `${active.length} chauffeur${active.length > 1 ? "s" : ""} actif${active.length > 1 ? "s" : ""} sur le réseau`, tone: "#ff3b30" },
          { tag: "LIGNES", text: `${busLines.length} ligne${busLines.length > 1 ? "s" : ""} de bus configurée${busLines.length > 1 ? "s" : ""}`, tone: "#ffd60a" },
          { tag: "RÉSA", text: `${pendingRes.length} réservation${pendingRes.length > 1 ? "s" : ""} en attente de confirmation`, tone: "#ff3b30" },
          { tag: "VALID", text: `${pendingDrivers.length} inscription${pendingDrivers.length > 1 ? "s" : ""} à valider`, tone: "#457b9d" },
        ];

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % facts.length), 2600);
    return () => clearInterval(id);
  }, [facts.length]);

  const ev = facts[i % facts.length];

  return (
    <div className="border border-white/15 bg-black/20">
      <div className="flex items-center gap-3 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]">
        <span className="flex items-center gap-2 text-[#06b6a4]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#06b6a4] live-dot" />
          live
        </span>
        <span className="text-white/40">/</span>
        <span className="text-white/60">réseau temps réel</span>
      </div>
      <div key={i} className="ticker-in px-4 pb-4 pt-1 flex items-start gap-3 min-h-[64px]">
        <span
          className="font-mono text-[10px] font-bold px-2 py-1 leading-none flex-shrink-0"
          style={{ background: ev.tone, color: ev.tone === "#ffd60a" || ev.tone === "#06b6a4" ? "#0b2545" : "#f4f6f8" }}
        >
          {ev.tag}
        </span>
        <p className="text-[13px] leading-snug text-white/90 font-body">{ev.text}</p>
      </div>
      <div className="flex gap-1 px-4 pb-3">
        {facts.map((_, idx) => (
          <span
            key={idx}
            className={`h-[2px] flex-1 transition-colors ${idx === i % facts.length ? "bg-[#ff3b30]" : "bg-white/15"}`}
          />
        ))}
      </div>
    </div>
  );
}
