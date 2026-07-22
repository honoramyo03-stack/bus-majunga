"use client";
import { Suspense, useState, useMemo } from "react";
import { Link, useSearchParams } from "@/lib/router";
import {
  Search, Bus, Car, MapPin, Clock, ChevronRight, Navigation, ArrowRight, Filter, Map,
} from "lucide-react";
import { useFirebaseList } from "@/lib/firebase-hooks";
import type { Driver, Route } from "@/lib/types";
import { byLine } from "@/lib/line";

function SearchContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "bus" | "taxi">(
    (searchParams.get("type") as "bus" | "taxi") || "all"
  );
  const [fromZone, setFromZone] = useState("");
  const [toZone, setToZone] = useState("");

  const { data: routes, loading: lr } = useFirebaseList<Route>("routes");
  const { data: drivers, loading: ld } = useFirebaseList<Driver>("drivers");
  const loading = lr || ld;

  const activeDrivers = drivers.filter((d) => d.status === "active");

  // Autocomplétion = tous les points connus (départs, arrivées, arrêts des lignes).
  const points = useMemo(
    () =>
      Array.from(
        new Set(routes.flatMap((r) => [r.startPoint, r.endPoint, ...(r.waypoints || [])]))
      )
        .filter(Boolean)
        .sort(),
    [routes]
  );

  const matchRoute = (r: Route) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.lineNumber.toLowerCase().includes(q) ||
      r.startPoint.toLowerCase().includes(q) ||
      r.endPoint.toLowerCase().includes(q) ||
      (r.waypoints || []).some((w) => w.toLowerCase().includes(q));
    const matchesType = filterType === "all" || r.type === filterType;
    const matchesFrom = !fromZone || r.startPoint.toLowerCase().includes(fromZone.toLowerCase()) || (r.waypoints || []).some((w) => w.toLowerCase().includes(fromZone.toLowerCase()));
    const matchesTo = !toZone || r.endPoint.toLowerCase().includes(toZone.toLowerCase()) || (r.waypoints || []).some((w) => w.toLowerCase().includes(toZone.toLowerCase()));
    return matchesSearch && matchesType && matchesFrom && matchesTo;
  };

  const matchDriver = (d: Driver) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      d.fullName.toLowerCase().includes(q) ||
      d.vehicleNumber.toLowerCase().includes(q) ||
      (d.lineNumber || "").toLowerCase().includes(q) ||
      (d.route || "").toLowerCase().includes(q);
    const matchesType = filterType === "all" || d.vehicleType === filterType;
    return matchesSearch && matchesType;
  };

  const filteredRoutes = routes.filter(matchRoute);
  const filteredBus = filteredRoutes.filter((r) => r.type === "bus").sort(byLine);
  const filteredTaxi = activeDrivers.filter((d) => d.vehicleType === "taxi" && matchDriver(d));
  const filteredBusDrivers = activeDrivers.filter((d) => d.vehicleType === "bus" && matchDriver(d));

  const hasQuery = search.trim() !== "" || fromZone !== "" || toZone !== "" || filterType !== "all";
  const networkEmpty = routes.length === 0 && activeDrivers.length === 0;
  const noMatch = !loading && !networkEmpty && filteredRoutes.length === 0 && filteredTaxi.length === 0 && filteredBusDrivers.length === 0;

  const reset = () => {
    setSearch("");
    setFromZone("");
    setToZone("");
    setFilterType("all");
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#048a7c] mb-1">§ rechercher</div>
        <h1 className="font-display font-black text-3xl tracking-tight text-slate-800">Trouver un trajet</h1>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Ligne, arrêt, chauffeur, lieu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#06b6a4] shadow-sm transition-colors"
        />
      </div>

      <datalist id="zone-suggestions">
        {points.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" /> Départ
          </label>
          <input
            list="zone-suggestions"
            value={fromZone}
            onChange={(e) => setFromZone(e.target.value)}
            placeholder={points.length ? "ex. Centre-ville" : "saisir un lieu"}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#06b6a4]"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full" /> Destination
          </label>
          <input
            list="zone-suggestions"
            value={toZone}
            onChange={(e) => setToZone(e.target.value)}
            placeholder={points.length ? "ex. Mahavoky" : "saisir un lieu"}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#06b6a4]"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(["all", "bus", "taxi"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterType === f ? "bg-[#0b2545] text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f === "all" ? <Filter className="w-4 h-4" /> : f === "bus" ? <Bus className="w-4 h-4" /> : <Car className="w-4 h-4" />}
            {f === "all" ? "Tous" : f === "bus" ? "Bus" : "Taxi"}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Réseau vide */}
      {!loading && networkEmpty && (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <Map className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">Le réseau est encore vide</p>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
            Aucune ligne ni chauffeur actif pour l'instant. L'administration doit créer les lignes et
            valider les chauffeurs (et la Realtime Database doit être connectée).
          </p>
          <Link href="/client/map" className="inline-flex items-center gap-1.5 mt-4 text-[#048a7c] text-sm font-medium">
            <MapPin className="w-4 h-4" /> Voir la carte
          </Link>
        </div>
      )}

      {/* Aucun résultat pour la requête */}
      {!loading && noMatch && (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">Aucun résultat</p>
          <p className="text-slate-400 text-sm mt-1">Essayez d'autres mots-clés ou élargissez les filtres.</p>
          <button onClick={reset} className="mt-4 text-[#048a7c] text-sm font-medium">Réinitialiser la recherche</button>
        </div>
      )}

      {/* Résultats */}
      {!loading && !networkEmpty && !noMatch && (
        <>
          {(filterType === "all" || filterType === "bus") && filteredBus.length > 0 && (
            <div className="mb-6">
              <h2 className="font-display font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Bus className="w-5 h-5 text-[#ff3b30]" /> Lignes de bus ({filteredBus.length})
              </h2>
              <div className="space-y-3">
                {filteredBus.map((route) => (
                  <Link key={route.id} href={`/client/routes/${route.id}`} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all block">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#0b2545] font-display font-black flex-shrink-0" style={{ background: route.color || "#ff3b30" }}>{route.lineNumber}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 mb-1">{route.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" /><span className="truncate">{route.startPoint}</span>
                        <ArrowRight className="w-3 h-3 flex-shrink-0" />
                        <div className="w-2 h-2 bg-red-500 rounded-full" /><span className="truncate">{route.endPoint}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {route.distance ? <span className="text-xs text-slate-400"><Navigation className="w-3 h-3 inline mr-0.5" />{route.distance} km</span> : null}
                        {route.estimatedTime ? <span className="text-xs text-slate-400"><Clock className="w-3 h-3 inline mr-0.5" />{route.estimatedTime} min</span> : null}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[#048a7c] font-bold tabular-nums">{route.price?.toLocaleString()} Ar</p>
                      <ChevronRight className="w-4 h-4 text-slate-300 ml-auto mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(filterType === "all" || filterType === "bus") && filteredBusDrivers.length > 0 && (
            <div className="mb-6">
              <h2 className="font-display font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Bus className="w-5 h-5 text-[#0b2545]" /> Chauffeurs de bus ({filteredBusDrivers.length})
              </h2>
              <div className="space-y-2">
                {filteredBusDrivers.map((driver) => (
                  <DriverRow key={driver.id} driver={driver} />
                ))}
              </div>
            </div>
          )}

          {(filterType === "all" || filterType === "taxi") && filteredTaxi.length > 0 && (
            <div className="mb-6">
              <h2 className="font-display font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Car className="w-5 h-5 text-[#06b6a4]" /> Taxis disponibles ({filteredTaxi.length})
              </h2>
              <div className="space-y-2">
                {filteredTaxi.map((driver) => (
                  <DriverRow key={driver.id} driver={driver} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DriverRow({ driver }: { driver: Driver }) {
  return (
    <Link href={`/client/drivers/${driver.id}`} className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all block">
      {driver.imageUrl ? (
        <img src={driver.imageUrl} alt={driver.fullName} className="w-12 h-12 rounded-xl object-cover" />
      ) : (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-[#0b2545] font-display font-black ${driver.vehicleType === "bus" ? "bg-[#ff3b30]" : "bg-[#06b6a4]"}`}>
          {driver.fullName.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 text-sm truncate">{driver.fullName}</p>
        <p className="text-slate-400 text-xs truncate">
          {driver.vehicleType === "bus" ? `Bus ${driver.lineNumber || ""}` : driver.vehicleNumber}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {driver.isOnline && <div className="w-2 h-2 bg-green-500 rounded-full status-online" />}
        <a href={`tel:${driver.phone}`} onClick={(e) => e.stopPropagation()} className="text-[#048a7c] text-sm font-medium bg-[#d1f1ec] px-2 py-1 rounded-lg hover:bg-[#06b6a4] hover:text-[#0b2545] transition-colors">📞</a>
        <ChevronRight className="w-4 h-4 text-slate-300" />
      </div>
    </Link>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-10 text-center text-slate-500">Chargement…</div>}>
      <SearchContent />
    </Suspense>
  );
}
