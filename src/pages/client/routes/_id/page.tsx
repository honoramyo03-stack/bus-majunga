"use client";
import { useState } from "react";
import { Link } from "@/lib/router";
import { useParams } from "@/lib/router";
import {
  ArrowLeft,
  Bus,
  MapPin,
  Clock,
  Navigation,
  ArrowRight,
  Phone,
  ChevronRight,
} from "lucide-react";
import { useFirebaseData, useFirebaseList } from "@/lib/firebase-hooks";
import type { Route, Driver } from "@/lib/types";
import MapComponent from "@/components/MapComponent";

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: route } = useFirebaseData<Route>(`routes/${id}`);
  const { data: drivers } = useFirebaseList<Driver>("drivers");

  const [activeTab, setActiveTab] = useState<"info" | "map" | "drivers">("info");

  const routeDrivers = drivers.filter(
    (d) => d.lineNumber === route?.lineNumber && d.vehicleType === "bus" && d.status === "active"
  );

  const onlineDriversOnRoute = routeDrivers.filter((d) => d.isOnline && d.currentLocation);

  const markers = [
    ...onlineDriversOnRoute.map((driver) => ({
      lat: driver.currentLocation!.lat,
      lng: driver.currentLocation!.lng,
      type: "bus" as const,
      label: route?.lineNumber || "B",
      popup: `<div style="padding:8px"><b>${driver.fullName}</b><br><small>${driver.vehicleNumber}</small></div>`,
      color: route?.color || "#3B82F6",
    })),
  ];

  if (!route) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-slate-500">Ligne non trouvée</p>
        <Link href="/client" className="text-blue-600 text-sm mt-2 block">
          Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div
        className="relative p-6 pt-16 pb-8"
        style={{
          background: `linear-gradient(135deg, ${route.color || "#3B82F6"}, ${route.color ? route.color + "99" : "#6366F1"})`,
        }}
      >
        <Link
          href="/client/search"
          className="absolute top-4 left-4 w-10 h-10 bg-black/20 backdrop-blur rounded-xl flex items-center justify-center text-white hover:bg-black/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-white text-2xl font-bold border border-white/30">
            {route.lineNumber}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white mb-1">{route.name}</h1>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>{route.startPoint}</span>
              <ArrowRight className="w-3 h-3" />
              <div className="w-2 h-2 bg-white/60 rounded-full"></div>
              <span>{route.endPoint}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-center border border-white/20">
            <p className="text-white font-bold text-xl">{route.price?.toLocaleString()} Ar</p>
            <p className="text-white/70 text-xs">Prix</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-center border border-white/20">
            <p className="text-white font-bold text-xl">{route.distance} km</p>
            <p className="text-white/70 text-xs">Distance</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-center border border-white/20">
            <p className="text-white font-bold text-xl">{route.estimatedTime} min</p>
            <p className="text-white/70 text-xs">Durée</p>
          </div>
        </div>

        {/* Online count */}
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-300 rounded-full status-online"></div>
          <span className="text-white/80 text-sm">
            {onlineDriversOnRoute.length} bus en service maintenant
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4">
        <div className="flex bg-slate-100 rounded-2xl p-1 mb-5">
          {(["info", "map", "drivers"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "info" ? "Infos" : tab === "map" ? "Carte" : "Chauffeurs"}
            </button>
          ))}
        </div>

        {activeTab === "info" && (
          <div className="space-y-4">
            {/* Stops */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" style={{ color: route.color || "#3B82F6" }} />
                Arrêts sur la ligne
              </h3>
              <div className="relative pl-5">
                <div className="absolute left-2 top-3 bottom-3 w-0.5 bg-slate-200"></div>

                {/* Start */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="absolute left-0.5 w-3 h-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: route.color || "#3B82F6" }}
                  ></div>
                  <div className="pl-2">
                    <p className="font-medium text-slate-800">{route.startPoint}</p>
                    <p className="text-xs text-slate-400">Départ</p>
                  </div>
                </div>

                {/* Waypoints */}
                {route.waypoints?.map((wp, i) => (
                  <div key={i} className="flex items-center gap-3 mb-4">
                    <div className="absolute left-0.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white"></div>
                    <div className="pl-2">
                      <p className="text-slate-600">{wp}</p>
                      <p className="text-xs text-slate-400">Arrêt {i + 1}</p>
                    </div>
                  </div>
                ))}

                {/* End */}
                <div className="flex items-center gap-3">
                  <div className="absolute left-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
                  <div className="pl-2">
                    <p className="font-medium text-slate-800">{route.endPoint}</p>
                    <p className="text-xs text-slate-400">Destination finale</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule */}
            {route.schedule && route.schedule.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Horaires de départ
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {route.schedule.map((time, i) => (
                    <div
                      key={i}
                      className="text-center py-2 rounded-xl text-sm font-medium"
                      style={{
                        backgroundColor: `${route.color || "#3B82F6"}15`,
                        color: route.color || "#3B82F6",
                      }}
                    >
                      {time}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "map" && (
          <div>
            <MapComponent
              markers={markers}
              className="h-96 rounded-2xl border border-slate-100"
              routeCoords={route.coordinates || []}
            />
            <p className="text-slate-400 text-xs text-center mt-2">
              Les bus en ligne s&apos;affichent en temps réel
            </p>
          </div>
        )}

        {activeTab === "drivers" && (
          <div className="space-y-3">
            {routeDrivers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                <Bus className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">Aucun chauffeur sur cette ligne</p>
              </div>
            ) : (
              routeDrivers.map((driver) => (
                <Link
                  key={driver.id}
                  href={`/client/drivers/${driver.id}`}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all block"
                >
                  <div className="relative">
                    {driver.imageUrl ? (
                      <img
                        src={driver.imageUrl}
                        alt={driver.fullName}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: route.color || "#3B82F6" }}
                      >
                        {driver.fullName.charAt(0)}
                      </div>
                    )}
                    {driver.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800">{driver.fullName}</p>
                    <p className="text-slate-400 text-xs">{driver.vehicleNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${driver.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      Appeler
                    </a>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
