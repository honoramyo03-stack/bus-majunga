"use client";
import { useEffect, useRef, useState } from "react";
import { MAHAJANGA_CENTER } from "@/lib/types";

export interface MapMarker {
  id?: string;
  lat: number;
  lng: number;
  type: "bus" | "taxi" | "stop" | "user" | "destination";
  label?: string;
  popup?: string;
  color?: string;
}

interface MapComponentProps {
  markers?: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  routeCoords?: { lat: number; lng: number }[];
  onMarkerClick?: (marker: MapMarker) => void;
}

type L = typeof import("leaflet");

function pinHtml(color: string, label: string, live: boolean) {
  const halo = live
    ? `<div class="status-online" style="position:absolute;inset:-4px;border-radius:9999px;background:${color};opacity:.35;"></div>`
    : "";
  return `<div style="position:relative;width:38px;height:38px;">${halo}<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:9999px;border:2px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.35);background:${color};color:#fff;font-weight:800;font-size:12px;letter-spacing:.02em;">${label}</div></div>`;
}

export default function MapComponent({
  markers = [],
  center = MAHAJANGA_CENTER,
  zoom = 13,
  className = "h-96",
  routeCoords = [],
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const LRef = useRef<L | null>(null);
  const byIdRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const noIdRef = useRef<import("leaflet").Marker[]>([]);
  const polylineRef = useRef<import("leaflet").Polyline | null>(null);
  const [ready, setReady] = useState(false);

  // Init map (une seule fois)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      const Lmod = (await import("leaflet")).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (Lmod.Icon.Default.prototype as any)._getIconUrl;
      Lmod.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      if (cancelled || !mapRef.current) return;
      if (mapInstanceRef.current) mapInstanceRef.current.remove();
      const map = Lmod.map(mapRef.current, { center: [center.lat, center.lng], zoom, zoomControl: true });
      Lmod.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      mapInstanceRef.current = map;
      LRef.current = Lmod;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      byIdRef.current.clear();
      noIdRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers (mouvement fluide pour les marqueurs avec id)
  useEffect(() => {
    if (!ready || !mapInstanceRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapInstanceRef.current;

    const incomingById = markers.filter((m) => m.id);
    const incomingNoId = markers.filter((m) => !m.id);
    const seen = new Set<string>();

    for (const marker of incomingById) {
      const key = marker.id as string;
      seen.add(key);
      const color =
        marker.type === "bus" ? marker.color || "#3B82F6" : marker.type === "taxi" ? marker.color || "#10B981" : "#8B5CF6";
      const label = (marker.label || "•").substring(0, 3).toUpperCase();
      const live = marker.type === "bus" || marker.type === "taxi";
      const existing = byIdRef.current.get(key);
      if (existing) {
        existing.setLatLng([marker.lat, marker.lng]);
        if (marker.popup) existing.setPopupContent(marker.popup);
      } else {
        const icon = L.divIcon({
          html: pinHtml(color, label, live),
          className: "",
          iconSize: [38, 38],
          iconAnchor: [19, 19],
          popupAnchor: [0, -18],
        });
        const lm = L.marker([marker.lat, marker.lng], { icon }).addTo(map);
        if (marker.popup) lm.bindPopup(marker.popup);
        byIdRef.current.set(key, lm);
      }
    }
    // Remove stale id markers
    for (const [key, lm] of byIdRef.current) {
      if (!seen.has(key)) {
        lm.remove();
        byIdRef.current.delete(key);
      }
    }
    // Recreate no-id markers (stops, user, etc.)
    noIdRef.current.forEach((m) => m.remove());
    noIdRef.current = incomingNoId.map((marker) => {
      const color =
        marker.type === "stop" ? marker.color || "#F59E0B" : marker.type === "user" ? "#EF4444" : "#8B5CF6";
      const icon = L.divIcon({
        html: `<div style="width:16px;height:16px;border-radius:9999px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);background:${color};"></div>`,
        className: "",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const lm = L.marker([marker.lat, marker.lng], { icon }).addTo(map);
      if (marker.popup) lm.bindPopup(marker.popup);
      return lm;
    });
  }, [markers, ready]);

  // Polyline (trajet de ligne)
  useEffect(() => {
    if (!ready || !mapInstanceRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapInstanceRef.current;
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    if (routeCoords.length > 1) {
      const latlngs = routeCoords.map((c) => [c.lat, c.lng] as [number, number]);
      const pl = L.polyline(latlngs, { color: "#3B82F6", weight: 4, opacity: 0.85 }).addTo(map);
      polylineRef.current = pl;
      map.fitBounds(pl.getBounds(), { padding: [30, 30] });
    }
  }, [routeCoords, ready]);

  return (
    <div className={`relative ${className} rounded-2xl overflow-hidden`}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
