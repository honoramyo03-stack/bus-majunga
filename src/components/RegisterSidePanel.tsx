"use client";
import { useEffect, useState } from "react";
import { ShieldCheck, Car, Check } from "lucide-react";
import { useFirebaseList } from "@/lib/firebase-hooks";
import type { Driver } from "@/lib/types";
import LiveTicker from "./LiveTicker";

type Tone = "coral" | "teal";

const TONES: Record<Tone, { accent: string; soft: string; Icon: typeof ShieldCheck; tag: string }> = {
  coral: { accent: "#ff3b30", soft: "rgba(255,59,48,0.15)", Icon: ShieldCheck, tag: "admin" },
  teal:  { accent: "#06b6a4", soft: "rgba(6,182,164,0.15)", Icon: Car, tag: "driver" },
};

function useClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

interface Props {
  tone: Tone;
  moduleNumber: string;
  moduleLabel: string;
  headline: string;
  afterSteps: string[];
}

export default function RegisterSidePanel({ tone, moduleNumber, moduleLabel, headline, afterSteps }: Props) {
  const clock = useClock();
  const t = TONES[tone];
  const { data: drivers } = useFirebaseList<Driver>("drivers");
  // admins/ peut ne pas exister → useFirebaseList renvoie [] sans erreur
  const { data: admins } = useFirebaseList<{ role?: string }>("admins");

  const active = drivers.filter((d) => d.status === "active");
  const online = active.filter((d) => d.isOnline);

  const stats =
    tone === "coral"
      ? [
          { v: admins.length, l: "admins", c: "#ff3b30" },
          { v: active.length, l: "chauffeurs", c: "#06b6a4" },
          { v: online.length, l: "en ligne", c: "#ffd60a" },
        ]
      : [
          { v: active.length, l: "actifs", c: "#06b6a4" },
          { v: online.length, l: "en ligne", c: "#ffd60a" },
          { v: drivers.filter((d) => d.status === "pending").length, l: "en attente", c: "#ff3b30" },
        ];

  return (
    <aside className="relative hidden lg:flex flex-col bg-[#0b2545] text-[#f4f6f8] overflow-hidden">
      <div className="absolute inset-0 bg-grid-dark" />
      <div
        className="absolute inset-x-0 top-0 h-24 pointer-events-none scanline"
        style={{ background: `linear-gradient(to bottom, ${t.soft}, transparent)` }}
      />

      {/* SVG réseau animé */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id="rsp-g1" x1="0" x2="1">
            <stop offset="0%" stopColor={t.accent} stopOpacity="0" />
            <stop offset="50%" stopColor={t.accent} stopOpacity="1" />
            <stop offset="100%" stopColor={t.accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <g fill="none" strokeWidth="2">
          <path d="M -50 160 C 150 140, 320 300, 650 260" stroke="url(#rsp-g1)" className="route-dash" />
          <path d="M -50 420 C 200 440, 380 280, 650 480" stroke="rgba(255,214,10,0.6)" className="route-dash" style={{ animationDelay: "1.4s" }} />
          <path d="M -50 680 C 180 700, 440 560, 650 740" stroke="rgba(244,246,248,0.25)" className="route-dash" style={{ animationDelay: "2.8s" }} />
        </g>
        <g fill="#f4f6f8">
          {[[150, 150], [320, 280], [520, 250], [200, 440], [420, 320], [300, 680], [500, 600]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" />
          ))}
        </g>
        {/* Véhicules mobiles */}
        <circle r="4" fill={t.accent}>
          <animate attributeName="cx" values="-20;620" dur="10s" repeatCount="indefinite" />
          <animate attributeName="cy" values="150;260" dur="10s" repeatCount="indefinite" />
        </circle>
        <circle r="4" fill="#ffd60a">
          <animate attributeName="cx" values="620;-20" dur="13s" repeatCount="indefinite" />
          <animate attributeName="cy" values="460;300" dur="13s" repeatCount="indefinite" />
        </circle>
      </svg>

      <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center" style={{ background: t.accent }}>
              <t.Icon className="w-5 h-5 text-[#0b2545]" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="font-display text-[15px] font-bold">TransMahajanga</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#457b9d]">{t.tag} · v1.0</div>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#06b6a4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06b6a4] live-dot" />
            online
          </div>
        </header>

        <div className="mt-auto">
          <div className="flex items-end gap-4">
            <div className="font-display font-black text-[150px] leading-[0.8] tracking-[-0.05em]">{moduleNumber}</div>
            <div className="pb-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: t.accent }}>module</div>
              <div className="font-display text-xl font-bold">{moduleLabel}</div>
            </div>
          </div>
          <div className="mt-5 h-[3px] w-full bg-white/10 relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1/2" style={{ background: t.accent }} />
          </div>
          <p className="mt-5 text-[14px] leading-relaxed text-white/70 max-w-sm">{headline}</p>

          {/* Stats live */}
          <div className="mt-7 grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div key={s.l} className="border border-white/15 p-3">
                <div className="font-display font-black text-3xl tabular-nums leading-none" style={{ color: s.c }}>{s.v}</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 mt-1.5">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Ticker */}
          <div className="mt-6">
            <LiveTicker />
          </div>

          {/* Ce qui se passe après */}
          <div className="mt-6 border border-white/15 p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 mb-3">après validation</div>
            <ul className="space-y-2">
              {afterSteps.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[12px] text-white/80">
                  <span className="mt-0.5 w-4 h-4 flex items-center justify-center flex-shrink-0" style={{ background: t.accent }}>
                    <Check className="w-3 h-3 text-[#0b2545]" strokeWidth={3} />
                  </span>
                  <span className="leading-snug">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 font-mono text-[10px] uppercase tracking-[0.2em]">
            <div>
              <dt className="text-[#457b9d]">clock</dt>
              <dd className="text-[#ffd60a] text-[12px] mt-1 tabular-nums normal-case tracking-normal">{clock || "——:——:——"}</dd>
            </div>
            <div>
              <dt className="text-[#457b9d]">coord</dt>
              <dd className="text-white text-[12px] mt-1 tabular-nums normal-case tracking-normal">15.71°S 46.31°E</dd>
            </div>
          </dl>
        </div>

        <footer className="mt-8 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-[#457b9d]">
          <span>© 2026 · transmahajanga</span>
          <span>Mahajanga I · Boeny</span>
        </footer>
      </div>
    </aside>
  );
}
