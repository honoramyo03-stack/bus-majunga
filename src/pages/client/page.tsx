"use client";
import { useState } from "react";
import { Link } from "@/lib/router";
import {
  Bus,
  Car,
  MapPin,
  Clock,
  Search,
  Star,
  Phone,
  ChevronRight,
  Navigation,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useFirebaseList } from "@/lib/firebase-hooks";
import type { Driver, Route } from "@/lib/types";
import StarRating from "@/components/StarRating";

export default function ClientHomePage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "bus" | "taxi">("all");

  const { data: drivers, loading: driversLoading } = useFirebaseList<Driver>("drivers");
  const { data: routes } = useFirebaseList<Route>("routes");

  const activeDrivers = drivers.filter((d) => d.status === "active");
  const onlineDrivers = activeDrivers.filter((d) => d.isOnline);

  const filteredDrivers = activeDrivers.filter((d) => {
    const matchesSearch =
      !search ||
      d.fullName.toLowerCase().includes(search.toLowerCase()) ||
      d.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.lineNumber?.toLowerCase().includes(search.toLowerCase()) ||
      d.route?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      activeFilter === "all" || d.vehicleType === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-3xl p-6 mb-6 text-white">
        <p className="text-blue-100 text-sm mb-1">Bienvenue sur</p>
        <h1 className="text-2xl font-bold mb-1">TransMahajanga</h1>
        <p className="text-blue-200 text-sm mb-4">
          Trouvez votre transport facilement
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-1.5">
            <div className="w-2 h-2 bg-green-300 rounded-full status-online"></div>
            <span className="text-sm">{onlineDrivers.length} en ligne</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-1.5">
            <Bus className="w-4 h-4" />
            <span className="text-sm">{routes.filter((r) => r.type === "bus").length} lignes</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          href="/client/reservations/new?type=taxi"
          className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all card-hover"
        >
          <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Car className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Réserver Taxi</p>
            <p className="text-slate-400 text-xs">Maintenant</p>
          </div>
        </Link>
        <Link
          href="/client/reservations/new?type=special"
          className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all card-hover"
        >
          <div className="w-11 h-11 bg-violet-100 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Bus Spécial</p>
            <p className="text-slate-400 text-xs">Sur demande</p>
          </div>
        </Link>
        <Link
          href="/client/map"
          className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all card-hover"
        >
          <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
            <Navigation className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Carte Live</p>
            <p className="text-slate-400 text-xs">Temps réel</p>
          </div>
        </Link>
        <Link
          href="/client/search"
          className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all card-hover"
        >
          <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Horaires</p>
            <p className="text-slate-400 text-xs">Toutes lignes</p>
          </div>
        </Link>
      </div>

      {/* Bus Lines */}
      {routes.filter((r) => r.type === "bus").length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800 text-lg">Lignes de Bus</h2>
            <Link href="/client/search?type=bus" className="text-blue-600 text-sm">
              Voir tout
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {routes
              .filter((r) => r.type === "bus")
              .map((route) => (
                <Link
                  key={route.id}
                  href={`/client/routes/${route.id}`}
                  className="flex-shrink-0 bg-white border border-slate-200 rounded-2xl p-4 w-48 shadow-sm hover:shadow-md transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm mb-3"
                    style={{ backgroundColor: route.color || "#3B82F6" }}
                  >
                    {route.lineNumber}
                  </div>
                  <p className="font-semibold text-slate-800 text-sm mb-1 line-clamp-1">
                    {route.name}
                  </p>
                  <p className="text-slate-400 text-xs mb-2 line-clamp-1">
                    {route.startPoint} → {route.endPoint}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-600 font-bold text-sm">
                      {route.price?.toLocaleString()} Ar
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="mb-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un chauffeur, ligne, trajet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-400 shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "bus", "taxi"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeFilter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f === "all" ? "Tous" : f === "bus" ? "🚌 Bus" : "🚕 Taxi"}
            </button>
          ))}
        </div>
      </div>

      {/* Drivers List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800 text-lg">
            {activeFilter === "bus"
              ? "Chauffeurs de Bus"
              : activeFilter === "taxi"
              ? "Chauffeurs de Taxi"
              : "Tous les Chauffeurs"}
          </h2>
          <span className="text-slate-400 text-sm">{filteredDrivers.length} résultats</span>
        </div>

        {driversLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-slate-200 rounded-2xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">Aucun résultat trouvé</p>
            <p className="text-slate-400 text-sm mt-1">
              Essayez avec d&apos;autres mots-clés
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDrivers.map((driver) => (
              <Link
                key={driver.id}
                href={`/client/drivers/${driver.id}`}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all card-hover block"
              >
                <div className="relative">
                  {driver.imageUrl ? (
                    <img
                      src={driver.imageUrl}
                      alt={driver.fullName}
                      className="w-14 h-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold ${
                        driver.vehicleType === "bus" ? "bg-blue-500" : "bg-emerald-500"
                      }`}
                    >
                      {driver.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {driver.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white status-online"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-slate-800 truncate">{driver.fullName}</p>
                    <span
                      className={`flex-shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        driver.vehicleType === "bus"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {driver.vehicleType === "bus" ? (
                        <Bus className="w-3 h-3" />
                      ) : (
                        <Car className="w-3 h-3" />
                      )}
                      {driver.vehicleType === "bus" ? `Bus ${driver.lineNumber}` : "Taxi"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {driver.route || driver.vehicleNumber}
                    </span>
                    {driver.canDoSpecial && (
                      <span className="flex items-center gap-1 text-violet-600">
                        <Zap className="w-3 h-3" />
                        Spécial
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <StarRating rating={driver.rating || 0} size="sm" />
                      <span className="text-xs text-slate-400">
                        ({driver.totalRatings || 0})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {driver.phone && (
                        <a
                          href={`tel:${driver.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 rounded-lg px-2 py-1 text-xs hover:bg-green-100 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          Appeler
                        </a>
                      )}
                      <TrendingUp className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
