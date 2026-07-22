"use client";
// Bloc central d'entête : horloge live (date + heure + secondes) + bandeau
// défilant dont le texte (et le style) vient de l'admin (settings/general).
// Réutilisable (espace chauffeur ; ton adaptable clair/sombre).
import { useEffect, useState } from "react";
import { useFirebaseData } from "@/lib/firebase-hooks";

const DEFAULT_MARQUEE =
  "TransMahajanga — bus & taxis de Mahajanga en temps réel • Réservation • Suivi live • Avis •";

export default function HeaderCenter({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { data: settings } = useFirebaseData<{ headerMarquee?: string } | null>("settings/general");
  const [t, setT] = useState("");

  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      setT(
        `${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
      );
    };
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);

  const s = settings as any;
  const text = s?.headerMarquee?.trim() || DEFAULT_MARQUEE;
  const clockColor = tone === "dark" ? "#cbd5e1" : "#475569";
  const marqueeColor = s?.headerMarqueeColor || (tone === "dark" ? "#cbd5e1" : "#64748b");
  const marqueeBg = s?.headerMarqueeBg || undefined;
  const size = Number(s?.headerMarqueeSize) || undefined;
  const weight = s?.headerMarqueeWeight || undefined;
  const speed = Number(s?.headerMarqueeSpeed) || undefined;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 min-w-0">
      <span
        className="font-mono tabular-nums whitespace-nowrap text-[10px] sm:text-xs"
        style={{ color: clockColor }}
      >
        {t}
      </span>
      <div className="flex w-full sm:flex-1 min-w-0">
        <div
          className="relative overflow-hidden flex-1 min-w-0 rounded-md"
          style={{ background: marqueeBg || undefined }}
        >
          <div
            className="marquee-phrase whitespace-nowrap text-[11px] px-2 py-0.5"
            style={{
              color: marqueeColor,
              fontSize: size ? `${size}px` : undefined,
              fontWeight: weight ? String(weight) : undefined,
              animationDuration: speed ? `${speed}s` : undefined,
            }}
          >
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}
