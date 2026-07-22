"use client";
import { Link } from "@/lib/router";
import { useEffect, useState } from "react";
import {
  Bus, Car, ArrowRight, ArrowUpRight, Phone, MapPin, Clock, Zap, ShieldCheck, Navigation, Star,
} from "lucide-react";
import { useFirebaseList } from "@/lib/firebase-hooks";
import type { Driver, Route, Reservation } from "@/lib/types";

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

export default function HomePage() {
  const clock = useClock();
  const { data: drivers } = useFirebaseList<Driver>("drivers");
  const { data: routes } = useFirebaseList<Route>("routes");
  const { data: reservations } = useFirebaseList<Reservation>("reservations");

  const active = drivers.filter((d) => d.status === "active");
  const online = active.filter((d) => d.isOnline);
  const busRoutes = routes.filter((r) => r.type === "bus");
  const taxiDrivers = active.filter((d) => d.vehicleType === "taxi");
  const pendingRes = reservations.filter((r) => r.status === "pending");

  // Bandeau défilant 100% live (aucune donnée inventée)
  const marquee =
    active.length === 0 && routes.length === 0
      ? [
          "réseau en cours d'initialisation",
          "aucune ligne ni chauffeur — l'administration démarre le réseau",
          "connexion temps réel active",
        ]
      : [
          `${online.length} véhicule${online.length > 1 ? "s" : ""} en ligne`,
          `${busRoutes.length} ligne${busRoutes.length > 1 ? "s" : ""} de bus`,
          `${taxiDrivers.length} taxi${taxiDrivers.length > 1 ? "s" : ""} actif${taxiDrivers.length > 1 ? "s" : ""}`,
          `${pendingRes.length} réservation${pendingRes.length > 1 ? "s" : ""} en attente`,
          `${reservations.length} trajet${reservations.length > 1 ? "s" : ""} réservé${reservations.length > 1 ? "s" : ""}`,
          "Mahajanga · Boeny · Madagascar",
        ];

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#0b2545] font-body">
      {/* Top bar */}
      <div className="bg-[#0b2545] text-[#f4f6f8] border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-[#ff3b30] flex items-center justify-center group-hover:bg-[#ffd60a] transition-colors">
              <Bus className="w-4 h-4 text-[#0b2545]" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <div className="font-display font-black text-[15px] tracking-tight">TransMahajanga</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#457b9d] mt-0.5">réseau · boeny · 408</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.25em]">
            <a href="#reseau" className="text-white/70 hover:text-[#ffd60a] link-underline">réseau</a>
            <a href="#lignes" className="text-white/70 hover:text-[#ffd60a] link-underline">lignes</a>
            <a href="#comment" className="text-white/70 hover:text-[#ffd60a] link-underline">comment</a>
            <a href="#chauffeurs" className="text-white/70 hover:text-[#ffd60a] link-underline">chauffeurs</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/client" className="hidden sm:inline-flex font-mono text-[10px] uppercase tracking-[0.25em] text-white/80 hover:text-white px-3 py-2 border border-white/20 hover:border-white/60 transition-colors">client</Link>
            <Link href="/driver/login" className="hidden sm:inline-flex font-mono text-[10px] uppercase tracking-[0.25em] text-white/80 hover:text-white px-3 py-2 border border-white/20 hover:border-white/60 transition-colors">chauffeur</Link>
            <Link href="/admin/login" className="inline-flex items-center gap-1.5 bg-[#ff3b30] text-[#0b2545] font-mono text-[10px] uppercase tracking-[0.25em] font-bold px-3 py-2 hover:bg-[#ffd60a] transition-colors">
              <ShieldCheck className="w-3 h-3" strokeWidth={3} /> admin
            </Link>
          </div>
        </div>
      </div>

      {/* Marquee live */}
      <div className="bg-[#ffd60a] text-[#0b2545] overflow-hidden border-b-2 border-[#0b2545]">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-[#0b2545] text-[#ffd60a] font-mono text-[10px] uppercase tracking-[0.3em] font-bold px-4 py-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] live-dot" /> live · {clock || "——:——:——"}
          </div>
          <div className="relative flex-1 overflow-hidden py-2">
            <div className="marquee-track flex gap-10 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] font-bold">
              {[...marquee, ...marquee].map((m, i) => (
                <span key={i} className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5" style={{ background: ["#ff3b30", "#0b2545", "#06b6a4"][i % 3] }} />
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ouverture asymétrique */}
      <section id="reseau" className="relative bg-[#f4f6f8] bg-grid">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16">
          <div className="relative">
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[#ff3b30] mb-6">
              <span className="w-8 h-[2px] bg-[#ff3b30]" /> édition en direct
            </div>
            <h1 className="font-display font-black text-[72px] sm:text-[96px] lg:text-[120px] leading-[0.85] tracking-[-0.05em]">
              Mahajanga<br /><span className="text-[#ff3b30]">roule.</span>
            </h1>
            <p className="mt-8 max-w-md text-[15px] leading-relaxed text-[#0b2545]/80">
              Le réseau officiel des bus et taxis, en direct. Réservez un trajet, suivez votre
              chauffeur sur la carte, consultez horaires et tarifs — sans compte, sans friction.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/client" className="group inline-flex items-center gap-3 bg-[#0b2545] text-[#f4f6f8] px-6 py-4 hover:bg-[#ff3b30] hover:text-[#0b2545] transition-colors">
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] font-bold">trouver un trajet</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/client/map" className="group inline-flex items-center gap-3 bg-transparent text-[#0b2545] px-6 py-4 border-2 border-[#0b2545] hover:bg-[#0b2545] hover:text-[#ffd60a] transition-colors">
                <MapPin className="w-4 h-4" />
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] font-bold">carte live</span>
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-0 border-t-2 border-[#0b2545]">
              {[
                { n: online.length, l: "en ligne", c: "#06b6a4" },
                { n: busRoutes.length, l: "lignes bus", c: "#ff3b30" },
                { n: taxiDrivers.length, l: "taxis actifs", c: "#ffd60a", dark: true },
              ].map((s, i) => (
                <div key={i} className="pt-5 pr-4 first:pl-0">
                  <div className="font-display font-black text-5xl lg:text-6xl tracking-tight leading-none tabular-nums" style={{ color: s.dark ? "#0b2545" : s.c }}>{s.n}</div>
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[#0b2545]/60">{s.l}</div>
                  <div className="mt-3 h-[3px] w-10" style={{ background: s.c }} />
                </div>
              ))}
            </div>
          </div>

          {/* Carte réseau animée */}
          <div className="relative bg-[#0b2545] text-[#f4f6f8] overflow-hidden min-h-[440px] lg:min-h-[560px]">
            <div className="absolute inset-0 bg-grid-dark" />
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#ff3b30]/10 to-transparent scanline pointer-events-none" />
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice" aria-hidden>
              <path d="M 0 120 Q 140 90, 240 160 T 500 180 L 600 140 L 600 0 L 0 0 Z" fill="rgba(6,182,164,0.08)" />
              <g fill="none" strokeWidth="2.5" strokeLinecap="round">
                <path d="M -50 180 C 150 160, 320 300, 650 260" stroke="#ff3b30" className="route-dash" />
                <path d="M -50 420 C 200 440, 380 280, 650 480" stroke="#ffd60a" className="route-dash" style={{ animationDelay: "1.4s" }} />
                <path d="M -50 660 C 180 680, 440 560, 650 720" stroke="#06b6a4" className="route-dash" style={{ animationDelay: "2.8s" }} />
              </g>
              <circle r="5" fill="#ff3b30"><animate attributeName="cx" values="-20;620" dur="9s" repeatCount="indefinite" /><animate attributeName="cy" values="170;260" dur="9s" repeatCount="indefinite" /></circle>
              <circle r="5" fill="#ffd60a"><animate attributeName="cx" values="620;-20" dur="12s" repeatCount="indefinite" /><animate attributeName="cy" values="460;300" dur="12s" repeatCount="indefinite" /></circle>
              <circle r="5" fill="#06b6a4"><animate attributeName="cx" values="-20;620" dur="15s" repeatCount="indefinite" /><animate attributeName="cy" values="680;720" dur="15s" repeatCount="indefinite" /></circle>
            </svg>
            <div className="relative z-10 p-6 lg:p-8 flex flex-col h-full">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em]">
                <span className="text-[#06b6a4] flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#06b6a4] live-dot" /> carte · temps réel</span>
                <span className="text-white/50">15.71°S · 46.31°E</span>
              </div>
              <div className="mt-auto">
                <div className="font-display font-black text-5xl lg:text-6xl tracking-tight leading-none tabular-nums">
                  {online.length}<span className="text-[#ff3b30]">/</span>{active.length}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60 mt-2">véhicules en ligne · maintenant</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lignes — tableau horaire */}
      <section id="lignes" className="bg-[#0b2545] text-[#f4f6f8]">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8 py-16 lg:py-24">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ff3b30] mb-3">§ 02 · horaires</div>
              <h2 className="font-display font-black text-5xl lg:text-7xl tracking-[-0.04em] leading-[0.9]">
                Le tableau<br />des <span className="text-[#ffd60a]">lignes.</span>
              </h2>
            </div>
            <Link href="/client/search" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70 hover:text-[#ffd60a] link-underline">
              tous les trajets <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          {busRoutes.length === 0 ? (
            <div className="border border-white/15 p-10 text-center font-mono text-[12px] uppercase tracking-[0.25em] text-white/50">
              aucune ligne publiée · l'administration crée les lignes depuis le panneau
            </div>
          ) : (
            <div className="border-t-2 border-white/20">
              {busRoutes.map((r, i) => (
                <Link key={r.id} href={`/client/routes/${r.id}`} className="group grid grid-cols-[auto_1fr_auto] md:grid-cols-[80px_1fr_1fr_auto] gap-4 md:gap-8 items-center py-6 border-b border-white/10 hover:bg-white/5 transition-colors px-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-white/40 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span className="w-12 h-12 flex items-center justify-center font-display font-black text-sm" style={{ background: r.color || "#ff3b30", color: "#0b2545" }}>{r.lineNumber}</span>
                  </div>
                  <div>
                    <div className="font-display font-bold text-xl lg:text-2xl tracking-tight group-hover:text-[#ffd60a] transition-colors">{r.name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50 mt-1">{r.distance} km · ~{r.estimatedTime} min</div>
                  </div>
                  <div className="hidden md:flex flex-wrap gap-1.5 max-w-xs">
                    {(r.schedule || []).slice(0, 5).map((t, j) => (
                      <span key={j} className="font-mono text-[10px] px-2 py-1 border border-white/15 tabular-nums">{t}</span>
                    ))}
                    {(r.schedule || []).length > 5 && <span className="font-mono text-[10px] text-white/40 px-2 py-1">+{(r.schedule || []).length - 5}</span>}
                  </div>
                  <div className="text-right">
                    <div className="font-display font-black text-2xl lg:text-3xl text-[#ffd60a] tabular-nums">{r.price?.toLocaleString()}</div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/50">ariary</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment" className="bg-[#f4f6f8] bg-dots">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8 py-16 lg:py-24">
          <div className="mb-12 max-w-2xl">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#048a7c] mb-3">§ 03 · mode d'emploi</div>
            <h2 className="font-display font-black text-5xl lg:text-7xl tracking-[-0.04em] leading-[0.9]">
              Quatre<br /><span className="text-[#048a7c]">mouvements.</span>
            </h2>
          </div>
          <div className="relative">
            <div className="absolute left-[27px] md:left-[39px] top-4 bottom-4 w-[2px] bg-[#0b2545]/15" />
            {[
              { n: "01", Icon: MapPin, t: "Cherchez", d: "Saisissez départ et arrivée, ou parcourez les lignes. Pas de compte requis.", c: "#ff3b30" },
              { n: "02", Icon: Navigation, t: "Suivez", d: "La carte affiche les véhicules en direct. Vous voyez votre bus ou taxi approcher.", c: "#ffd60a" },
              { n: "03", Icon: Zap, t: "Réservez", d: "Un taxi, un bus spécial, un trajet planifié. Confirmation immédiate.", c: "#06b6a4" },
              { n: "04", Icon: Star, t: "Échangez", d: "Notez et répondez aux avis : admin, chauffeur et client participent au fil.", c: "#457b9d" },
            ].map((s) => (
              <div key={s.n} className="relative grid grid-cols-[auto_1fr] gap-5 md:gap-8 pb-10 last:pb-0">
                <div className="relative z-10 w-14 h-14 md:w-20 md:h-20 flex items-center justify-center font-display font-black text-xl md:text-2xl" style={{ background: s.c, color: "#0b2545" }}>{s.n}</div>
                <div className="pt-1 md:pt-3">
                  <div className="flex items-center gap-3">
                    <s.Icon className="w-5 h-5" style={{ color: s.c }} strokeWidth={2.5} />
                    <h3 className="font-display font-black text-2xl md:text-3xl tracking-tight">{s.t}</h3>
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#0b2545]/75 max-w-lg">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chauffeurs */}
      <section id="chauffeurs" className="bg-[#0b2545] text-[#f4f6f8]">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#06b6a4] mb-3">§ 04 · rejoindre</div>
            <h2 className="font-display font-black text-5xl lg:text-7xl tracking-[-0.04em] leading-[0.9]">
              Vous<br />conduisez<br /><span className="text-[#06b6a4]">à Mahajanga ?</span>
            </h2>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-white/70">
              Créez votre compte chauffeur en trois étapes. Réservations, trajets spéciaux, position
              en direct. Validation par l'administration.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/driver/register" className="inline-flex items-center gap-3 bg-[#06b6a4] text-[#0b2545] px-6 py-4 hover:bg-[#ffd60a] transition-colors">
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] font-bold">s'inscrire</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/driver/login" className="inline-flex items-center gap-3 border-2 border-white/30 text-white px-6 py-4 hover:border-white hover:bg-white/5 transition-colors">
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] font-bold">connexion</span>
              </Link>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-4 font-mono text-[10px] uppercase tracking-[0.3em]">
              <span className="text-white/60">chauffeurs actifs</span>
              <span className="text-[#06b6a4] flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#06b6a4] live-dot" /> {online.length} en ligne</span>
            </div>
            {active.length === 0 ? (
              <div className="border border-white/15 p-8 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">aucun chauffeur pour l'instant</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {active.slice(0, 4).map((d) => (
                  <Link key={d.id} href={`/client/drivers/${d.id}`} className="group border border-white/15 hover:border-[#ffd60a] p-4 transition-colors bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 flex items-center justify-center font-display font-black text-sm ${d.vehicleType === "bus" ? "bg-[#ff3b30]" : "bg-[#06b6a4]"} text-[#0b2545]`}>{d.fullName.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-[14px] truncate group-hover:text-[#ffd60a] transition-colors">{d.fullName}</div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 truncate">{d.vehicleType === "bus" ? `bus · ${d.lineNumber || "—"}` : `taxi · ${d.vehicleNumber}`}</div>
                      </div>
                      {d.isOnline && <span className="w-2 h-2 rounded-full bg-[#06b6a4] live-dot flex-shrink-0" />}
                    </div>
                    <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]">
                      <span className="flex items-center gap-1 text-[#ffd60a]"><Star className="w-3 h-3 fill-[#ffd60a]" /> {(d.rating || 0).toFixed(1)}</span>
                      {d.phone && <span className="flex items-center gap-1 text-white/60 group-hover:text-white"><Phone className="w-3 h-3" /> appeler</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f4f6f8] border-t-2 border-[#0b2545]">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8 py-12 grid md:grid-cols-[1.4fr_1fr_1fr] gap-6">
          <div className="bg-[#0b2545] text-[#f4f6f8] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#ff3b30] flex items-center justify-center"><Bus className="w-5 h-5 text-[#0b2545]" strokeWidth={2.5} /></div>
              <div className="font-display font-black text-xl tracking-tight">TransMahajanga</div>
            </div>
            <p className="text-[12px] leading-relaxed text-white/70 max-w-sm">Suivi temps réel et gestion du réseau de bus et taxis de Mahajanga, région Boeny, Madagascar.</p>
            <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.25em] text-[#457b9d]">© 2026 · tous droits réservés</div>
          </div>
          <div className="bg-[#ff3b30] text-[#0b2545] p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-4 opacity-70">portails</div>
            <ul className="space-y-2 font-display font-bold text-lg">
              <li><Link href="/client" className="link-underline">Espace client</Link></li>
              <li><Link href="/driver/login" className="link-underline">Espace chauffeur</Link></li>
              <li><Link href="/admin/login" className="link-underline">Administration</Link></li>
            </ul>
          </div>
          <div className="bg-[#ffd60a] text-[#0b2545] p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-4 opacity-70">contact</div>
            <div className="space-y-2 text-[13px]">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Mahajanga I · Boeny</div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> 05:00 — 21:00</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> +261 34 00 000 00</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
