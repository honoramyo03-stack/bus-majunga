"use client";
import { useState } from "react";
import { Bus, Car, Navigation, Filter, RefreshCw } from "lucide-react";
import { useFirebaseList } from "@/lib/firebase-hooks";
import type { Driver, Route } from "@/lib/types";
import { MAHAJANGA_CENTER } from "@/lib/types";
import { byLine } from "@/lib/line";
import MapComponent from "@/components/MapComponent";

export default function LiveMapPage() {
  const [filter, setFilter] = useState<"all" | "bus" | "taxi">("all");
  const { data: drivers } = useFirebaseList<Driver>("drivers");
  const { data: routes } = useFirebaseList<Route>("routes");
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const onlineDrivers = drivers.filter(
    (d) =>
      d.isOnline &&
      d.currentLocation &&
      d.status === "active" &&
      (filter === "all" || d.vehicleType === filter)
  );

  const selectedRouteData = routes.find((r) => r.id === selectedRoute);

  const markers = onlineDrivers.map((driver) => ({
    id: driver.id,
    lat: driver.currentLocation!.lat,
    lng: driver.currentLocation!.lng,
    type: driver.vehicleType as "bus" | "taxi",
    label: driver.vehicleType === "bus" ? driver.lineNumber || "B" : "T",
    popup: `
      <div style="min-width:160px; padding:8px">
        <div style="font-weight:bold; margin-bottom:4px;">${driver.fullName}</div>
        <div style="font-size:12px; color:#666; margin-bottom:4px;">🚌 ${driver.vehicleNumber}</div>
        ${driver.route ? `<div style="font-size:12px; color:#666; margin-bottom:4px;">📍 ${driver.route}</div>` : ""}
        ${driver.phone ? `<a href="tel:${driver.phone}" style="font-size:12px; color:#2563eb; font-weight:500;">📞 ${driver.phone}</a>` : ""}
        <div style="margin-top:4px; font-size:11px; color:#aaa;">
          Mis à jour: ${new Date(driver.currentLocation!.timestamp).toLocaleTimeString("fr-FR")}
        </div>
      </div>
    `,
    color: driver.vehicleType === "bus" ? "#3B82F6" : "#10B981",
  }));

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Carte en direct</h1>
          <p className="text-slate-500 text-sm">
            {onlineDrivers.length} véhicule(s) en ligne
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full status-online"></div>
          <span className="text-green-700 text-xs font-medium">Live</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(["all", "bus", "taxi"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f === "all" ? (
              <Filter className="w-4 h-4" />
            ) : f === "bus" ? (
              <Bus className="w-4 h-4" />
            ) : (
              <Car className="w-4 h-4" />
            )}
            {f === "all" ? "Tous" : f === "bus" ? "Bus" : "Taxi"}
          </button>
        ))}
      </div>

      {/* Route Selector */}
      {routes.filter((r) => r.type === "bus").length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-slate-500 mb-2 flex items-center gap-1">
            <Navigation className="w-4 h-4" />
            Afficher une ligne de bus
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedRoute(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !selectedRoute
                  ? "bg-slate-700 text-white"
                  : "bg-white border border-slate-200 text-slate-600"
              }`}
            >
              Aucune
            </button>
            {routes
              .filter((r) => r.type === "bus")
              .sort(byLine)
              .map((route) => (
                <button
                  key={route.id}
                  onClick={() => setSelectedRoute(route.id === selectedRoute ? null : route.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedRoute === route.id
                      ? "text-white"
                      : "bg-white border border-slate-200 text-slate-600"
                  }`}
                  style={
                    selectedRoute === route.id
                      ? { backgroundColor: route.color || "#3B82F6" }
                      : {}
                  }
                >
                  {route.lineNumber}
                  <span className="hidden sm:inline">{route.startPoint}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Map */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 mb-4">
        <MapComponent
          markers={markers}
          center={MAHAJANGA_CENTER}
          zoom={12}
          className="h-96"
          routeCoords={selectedRouteData?.coordinates || []}
        />
      </div>

      {/* Online Drivers List */}
      <div>
        <h2 className="font-bold text-slate-800 mb-3">
          Véhicules en ligne ({onlineDrivers.length})
        </h2>
        {onlineDrivers.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <Navigation className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500">Aucun véhicule en ligne</p>
          </div>
        ) : (
          <div className="space-y-2">
            {onlineDrivers.map((driver) => (
              <div
                key={driver.id}
                className="bg-white rounded-2xl p-3 border border-slate-200 flex items-center gap-3"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold ${
                    driver.vehicleType === "bus" ? "bg-blue-500" : "bg-emerald-500"
                  }`}
                >
                  {driver.vehicleType === "bus" ? driver.lineNumber || "B" : "T"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm truncate">{driver.fullName}</p>
                  <p className="text-slate-400 text-xs">{driver.vehicleNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  {driver.currentLocation?.speed !== undefined && (
                    <span className="text-slate-400 text-xs">
                      {Math.round(driver.currentLocation.speed)} km/h
                    </span>
                  )}
                  <a
                    href={`tel:${driver.phone}`}
                    className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors"
                  >
                    <span className="text-xs">📞</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 bg-white rounded-2xl p-4 border border-slate-200">
        <p className="text-xs font-medium text-slate-600 mb-2">Légende</p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-slate-500">Bus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
            <span className="text-xs text-slate-500">Taxi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-xs text-slate-500">Votre position</span>
          </div>
        </div>
      </div>
    </div>
  );
}
