"use client";
// Nettoie au chargement tout service worker + cache résiduel enregistré sur
// l'origine (ex. un SW Vite d'un ancien projet sur le même localhost:port),
// qui sinon intercepte les requêtes et provoque des 404 sur /@vite/client,
// /src/main.tsx, /node_modules/.vite/... Inoffensif si aucun SW n'existe.
import { useEffect } from "react";

export default function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister().catch(() => {})))
        .catch(() => {});
    }
    if ("caches" in window) {
      caches
        .keys()
        .then((keys) => keys.forEach((k) => caches.delete(k).catch(() => {})))
        .catch(() => {});
    }
  }, []);
  return null;
}
