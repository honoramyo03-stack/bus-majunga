"use client";
// Page « arrêt » : liste toutes les lignes qui passent par un arrêt donné
// (départ, arrêt intermédiaire ou destination). Accessible en cliquant sur un
// arrêt depuis les fiches ligne / chauffeur.
import { useMemo } from "react";
import { Link, useParams } from "@/lib/router";
import { ArrowLeft, Bus, MapPin, Clock, ChevronRight } from "lucide-react";
import { useFirebaseList } from "@/lib/firebase-hooks";
import type { Route } from "@/lib/types";
import { byLine } from "@/lib/line";

export default function StopPage() {
  const { name } = useParams<{ name: string }>();
  const stop = decodeURIComponent(name || "");
  const { data: routes, loading } = useFirebaseList<Route>("routes");

  const passing = useMemo(
    () =>
      routes.filter(
        (r) =>
          r.startPoint === stop ||
          r.endPoint === stop ||
          (r.waypoints || []).includes(stop)
      ).sort(byLine),
    [routes, stop]
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <Link
        href="/client/search"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-[#048a7c] text-sm mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#048a7c] mb-1 flex items-center gap-2">
          <span className="w-6 h-[2px] bg-[#048a7c]" /> arrêt
        </div>
        <h1 className="font-display font-black text-2xl lg:text-3xl tracking-tight text-slate-800 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-[#ff3b30] flex-shrink-0" />
          <span className="truncate">{stop || "—"}</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {loading
            ? "chargement…"
            : `${passing.length} ligne${passing.length > 1 ? "s" : ""} passe${
                passing.length > 1 ? "nt" : ""
              } par cet arrêt`}
        </p>
      </div>

      {passing.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
          <Bus className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Aucune ligne ne dessert cet arrêt</p>
          <p className="text-slate-400 text-sm mt-1">
            Les lignes créées par l'administration apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {passing.map((r) => (
            <Link
              key={r.id}
              href={`/client/routes/${r.id}`}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all block"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#0b2545] font-display font-black flex-shrink-0"
                style={{ background: r.color || "#ff3b30" }}
              >
                {r.lineNumber}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{r.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="truncate">{r.startPoint}</span>
                  <span>→</span>
                  <span className="truncate">{r.endPoint}</span>
                  {r.estimatedTime ? (
                    <span className="hidden sm:inline tabular-nums">· {r.estimatedTime} min</span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(r.schedule || []).slice(0, 4).map((t, i) => (
                    <span key={i} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 tabular-nums">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[#048a7c] font-bold tabular-nums">{r.price?.toLocaleString()} Ar</p>
                <ChevronRight className="w-4 h-4 text-slate-300 ml-auto mt-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
