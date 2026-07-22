"use client";
// « Studio » de la phrase défilante de l'entête client : l'admin règle texte,
// couleur du texte, couleur de fond, vitesse, taille et graisse, avec un aperçu
// animé en direct. Écriture en base au blur / changement de sélection.
import { useState } from "react";
import { firebaseOps } from "@/lib/firebase-hooks";

export interface MarqueeStyle {
  text: string;
  color: string;
  bg: string;
  speed: string;
  size: string;
  weight: string;
}

const PREVIEW_FALLBACK =
  "TransMahajanga — bus & taxis de Mahajanga en temps réel • Réservation • Suivi live • Avis •";

const lbl = "text-slate-400 text-[10px] uppercase tracking-[0.2em] mb-1 block";
const inp =
  "w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 tabular-nums";

const dbKey = (k: keyof MarqueeStyle) =>
  k === "text" ? "headerMarquee" : "headerMarquee" + k.charAt(0).toUpperCase() + k.slice(1);

export default function MarqueeStudio({ initial }: { initial: MarqueeStyle }) {
  const [s, setS] = useState<MarqueeStyle>(initial);
  const set = (k: keyof MarqueeStyle, v: string) => setS((p) => ({ ...p, [k]: v }));
  const commit = (k: keyof MarqueeStyle) => {
    const raw = s[k];
    const val = k === "speed" || k === "size" ? Number(raw) || 0 : (raw || "").trim();
    firebaseOps.update("settings/general", { [dbKey(k)]: val });
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-6">
      <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-[#ffd60a] rounded-full" />
        Phrase défilante (entête client)
      </h3>

      {/* Aperçu en direct */}
      <div
        className="rounded-lg overflow-hidden mb-4 border border-slate-700"
        style={{ background: s.bg || "#0b1220" }}
      >
        <div
          className="marquee-phrase whitespace-nowrap text-[11px] px-2 py-2"
          style={{
            color: s.color || undefined,
            fontSize: s.size ? `${s.size}px` : undefined,
            fontWeight: s.weight || undefined,
            animationDuration: s.speed ? `${s.speed}s` : undefined,
          }}
        >
          {s.text || PREVIEW_FALLBACK}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={lbl}>Texte</label>
          <input
            type="text"
            value={s.text}
            onChange={(e) => set("text", e.target.value)}
            onBlur={() => commit("text")}
            placeholder="Laisser vide = phrase par défaut"
            className={inp}
          />
        </div>

        <div>
          <label className={lbl}>Couleur du texte</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={s.color || "#94a3b8"}
              onChange={(e) => set("color", e.target.value)}
              onBlur={() => commit("color")}
              className="w-10 h-9 rounded-lg bg-slate-700 border border-slate-600 cursor-pointer flex-shrink-0"
            />
            <input
              type="text"
              value={s.color}
              onChange={(e) => set("color", e.target.value)}
              onBlur={() => commit("color")}
              placeholder="#94a3b8"
              className={inp}
            />
          </div>
        </div>

        <div>
          <label className={lbl}>Couleur de fond</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={s.bg || "#0b1220"}
              onChange={(e) => set("bg", e.target.value)}
              onBlur={() => commit("bg")}
              className="w-10 h-9 rounded-lg bg-slate-700 border border-slate-600 cursor-pointer flex-shrink-0"
            />
            <input
              type="text"
              value={s.bg}
              onChange={(e) => set("bg", e.target.value)}
              onBlur={() => commit("bg")}
              placeholder="vide / transparent / #…"
              className={inp}
            />
          </div>
        </div>

        <div>
          <label className={lbl}>Vitesse (s / cycle)</label>
          <input
            type="number"
            min={1}
            value={s.speed}
            onChange={(e) => set("speed", e.target.value)}
            onBlur={() => commit("speed")}
            placeholder="22 (plus petit = plus rapide)"
            className={inp}
          />
        </div>

        <div>
          <label className={lbl}>Taille (px)</label>
          <input
            type="number"
            min={8}
            max={48}
            value={s.size}
            onChange={(e) => set("size", e.target.value)}
            onBlur={() => commit("size")}
            placeholder="11"
            className={inp}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={lbl}>Graisse</label>
          <select
            value={s.weight || "500"}
            onChange={(e) => {
              set("weight", e.target.value);
              firebaseOps.update("settings/general", { headerMarqueeWeight: e.target.value });
            }}
            className={inp}
          >
            <option value="400">Normal (400)</option>
            <option value="500">Moyen (500)</option>
            <option value="600">Semi-gras (600)</option>
            <option value="700">Gras (700)</option>
            <option value="800">Extra-gras (800)</option>
          </select>
        </div>
      </div>

      <p className="text-slate-500 text-[11px] mt-3">
        Aperçu animé en direct ci-dessus. La vitesse indique la durée d'un cycle : plus la valeur
        est petite, plus le défilement est rapide. Laissez un champ vide pour la valeur par défaut.
      </p>
    </div>
  );
}
