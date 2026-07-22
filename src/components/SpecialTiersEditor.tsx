"use client";
// Éditeur de paliers « tarif spécial selon le nombre de personnes », réutilisé
// à l'inscription chauffeur, dans l'édition admin, etc. Thème clair/sombre.
import { Plus, X } from "lucide-react";

export interface Tier {
  minSeats: number;
  price: number;
}

export default function SpecialTiersEditor({
  value,
  onChange,
  theme = "light",
  hint,
}: {
  value?: Tier[];
  onChange: (v: Tier[]) => void;
  theme?: "light" | "dark";
  hint?: string;
}) {
  const tiers = value || [];
  const set = (i: number, patch: Partial<Tier>) =>
    onChange(tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const add = () => onChange([...tiers, { minSeats: 4, price: 0 }]);
  const remove = (i: number) => onChange(tiers.filter((_, j) => j !== i));

  const t =
    theme === "dark"
      ? {
          inp: "bg-slate-700 border-slate-600 text-white focus:border-blue-400",
          add: "text-blue-300 hover:text-blue-200",
          row: "border-slate-700",
          label: "text-slate-300",
          sub: "text-slate-400",
        }
      : {
          inp: "bg-white border-slate-200 text-slate-800 focus:border-[#06b6a4]",
          add: "text-[#048a7c] hover:text-[#0b2545]",
          row: "border-slate-200",
          label: "text-slate-600",
          sub: "text-slate-400",
        };

  return (
    <div className={`border ${t.row} rounded-xl p-3`}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className={`text-[12px] font-semibold ${t.label}`}>
          Tarif spécial selon le nombre de personnes
        </p>
        <button type="button" onClick={add} className={`flex items-center gap-1 text-[11px] font-medium ${t.add}`}>
          <Plus className="w-3.5 h-3.5" /> palier
        </button>
      </div>
      {hint && <p className={`text-[11px] ${t.sub} mb-2`}>{hint}</p>}
      {tiers.length === 0 ? (
        <p className={`text-[11px] ${t.sub}`}>Aucun palier : aucun tarif spécial proposé.</p>
      ) : (
        <div className="space-y-2">
          {tiers.map((tier, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] ${t.sub}`}>dès</span>
              <input
                type="number"
                min={1}
                value={tier.minSeats}
                onChange={(e) => set(i, { minSeats: Number(e.target.value) || 0 })}
                className={`w-20 px-2 py-1.5 border rounded-lg text-sm tabular-nums focus:outline-none ${t.inp}`}
              />
              <span className={`text-[11px] ${t.sub}`}>pers →</span>
              <input
                type="number"
                min={0}
                value={tier.price}
                onChange={(e) => set(i, { price: Number(e.target.value) || 0 })}
                className={`w-24 px-2 py-1.5 border rounded-lg text-sm tabular-nums focus:outline-none ${t.inp}`}
              />
              <span className={`text-[11px] ${t.sub}`}>Ar / pers</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-auto p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Retirer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
