"use client";
// Bannière d'installation PWA + enregistrement du service worker.
// - beforeinstallprompt (Android/Chrome/desktop) → bouton « Installer ».
// - iOS (pas de prompt natif) → consigne « Partager ▸ Sur l'écran d'accueil ».
// - Le service worker n'est enregistré qu'en build de production pour ne pas
//   perturber le HMR en développement.
import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPWA() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    const isProd = (import.meta as unknown as { env?: { PROD?: boolean } }).env?.PROD;
    if (isProd && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    }
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    const ua = navigator.userAgent || "";
    const ios = /iphone|ipad|ipod/i.test(ua);
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches === true ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (ios && !standalone) setIosHint(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* ignoré */
    }
    setDeferred(null);
  };

  if (installed) return null;
  if (!deferred && !iosHint) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(5.5rem_+_env(safe-area-inset-bottom))] z-[60] w-[min(92vw,420px)] px-2 animate-slide-up">
      <div className="bg-[#0b2545] text-[#f4f6f8] border border-white/10 shadow-2xl p-3.5 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#ff3b30] flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-[#0b2545]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm leading-tight">Installer TransMahajanga</p>
          <p className="text-[11px] text-white/60 leading-snug mt-0.5">
            {deferred
              ? "Ajoutez l'app à l'écran d'accueil pour un mode plein écran."
              : "iOS : Partager ▸ « Sur l'écran d'accueil »."}
          </p>
        </div>
        {deferred && (
          <button
            onClick={install}
            className="flex-shrink-0 bg-[#06b6a4] text-[#0b2545] font-mono text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-2 hover:bg-[#ffd60a] transition-colors flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Installer
          </button>
        )}
        <button
          onClick={() => {
            setDeferred(null);
            setIosHint(false);
          }}
          className="p-1 text-white/50 hover:text-white flex-shrink-0"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
