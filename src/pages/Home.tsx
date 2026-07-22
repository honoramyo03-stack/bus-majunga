"use client";
import { Link } from "@/lib/router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bus, Car, ArrowRight, Phone, MapPin, Clock, Navigation, Star, ShieldCheck, Zap, Calendar, Route as RouteIcon,
} from "lucide-react";
import { useFirebaseList } from "@/lib/firebase-hooks";
import type { Driver, Route, Reservation } from "@/lib/types";
import { MAHAJANGA_CENTER } from "@/lib/types";
import MapComponent from "@/components/MapComponent";
import { byLine } from "@/lib/line";

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

// Révélation douce au défilement (micro-interaction « vivante »).
function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"} ${className}`}>
      {children}
    </div>
  );
}

function Kicker({ children, tone = "#ff3b30" }: { children: ReactNode; tone?: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: tone }}>
      <span className="w-6 h-[2px]" style={{ background: tone }} />
      {children}
    </div>
  );
}

export default function HomePage() {
  const clock = useClock();
  const { data: drivers } = useFirebaseList<Driver>("drivers");
  const { data: routes } = useFirebaseList<Route>("routes");
  const { data: reservations } = useFirebaseList<Reservation>("reservations");

  const active = drivers.filter((d) => d.status === "active");
  const online = active.filter((d) => d.isOnline && d.currentLocation);
  const busRoutes = routes.filter((r) => r.type === "bus").sort(byLine);
  const taxiDrivers = active.filter((d) => d.vehicleType === "taxi");
  const pendingRes = reservations.filter((r) => r.status === "pending");

  const markers = online.map((d) => ({
    id: d.id,
    lat: d.currentLocation!.lat,
    lng: d.currentLocation!.lng,
    type: d.vehicleType as "bus" | "taxi",
    label: d.vehicleType === "bus" ? d.lineNumber || "B" : "T",
    color: d.vehicleType === "bus" ? "#ff3b30" : "#06b6a4",
    popup: `<div style="min-width:150px;font-family:sans-serif"><b>${d.fullName}</b><br><span style="color:#666;font-size:12px">${d.vehicleNumber}</span></div>`,
  }));

  const marquee =
    active.length === 0 && routes.length === 0
      ? ["réseau en cours d'initialisation", "connexion temps réel active", "aucune ligne pour l'instant"]
      : [
          `${online.length} véhicule${online.length > 1 ? "s" : ""} en ligne`,
          `${busRoutes.length} ligne${busRoutes.length > 1 ? "s" : ""} de bus`,
          `${taxiDrivers.length} taxi${taxiDrivers.length > 1 ? "s" : ""} actif${taxiDrivers.length > 1 ? "s" : ""}`,
          `${pendingRes.length} réservation${pendingRes.length > 1 ? "s" : ""} en attente`,
          "Mahajanga · Boeny · Madagascar",
        ];

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#0b2545] font-body">
      {/* Top bar */}
      <div className="sticky top-0 z-40 shadow-lg">
      <div className="bg-[#0b2545] text-[#f4f6f8] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 pb-3 pt-[calc(0.75rem_+_env(safe-area-inset-top))] flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-[#ff3b30] flex items-center justify-center group-hover:bg-[#ffd60a] transition-colors">
              <Bus className="w-4 h-4 text-[#0b2545]" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <div className="font-display font-black text-[15px] tracking-tight">TransMahajanga</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#457b9d] mt-0.5">réseau · boeny</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.25em]">
            <a href="#lignes" className="text-white/70 hover:text-[#ffd60a] link-underline">lignes</a>
            <a href="#comment" className="text-white/70 hover:text-[#ffd60a] link-underline">comment</a>
            <a href="#rejoindre" className="text-white/70 hover:text-[#ffd60a] link-underline">chauffeurs</a>
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
      </div>

      {/* Ouverture : texte + carte live */}
      <section className="bg-grid">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-12 lg:py-16 grid lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <Kicker>réseau en direct</Kicker>
            <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.05] tracking-tight">
              Les bus et taxis de Mahajanga, en temps réel.
            </h1>
            <p className="mt-4 text-sm lg:text-[15px] leading-relaxed text-[#0b2545]/75 max-w-md">
              Recherchez un trajet, suivez votre véhicule sur la carte, consultez horaires et tarifs,
              réservez en quelques taps — sans compte, sans friction.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/client" className="group inline-flex items-center gap-2 bg-[#0b2545] text-[#f4f6f8] px-5 py-3 hover:bg-[#ff3b30] transition-colors">
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] font-bold">trouver un trajet</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/client/map" className="inline-flex items-center gap-2 border-2 border-[#0b2545] text-[#0b2545] px-5 py-3 hover:bg-[#0b2545] hover:text-[#ffd60a] transition-colors">
                <MapPin className="w-4 h-4" />
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] font-bold">carte live</span>
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              {[
                { n: online.length, l: "en ligne", c: "#06b6a4" },
                { n: busRoutes.length, l: "lignes", c: "#ff3b30" },
                { n: taxiDrivers.length, l: "taxis", c: "#0b2545" },
              ].map((s) => (
                <div key={s.l} className="border-t-2 pt-2" style={{ borderColor: s.c }}>
                  <div className="font-display font-black text-3xl lg:text-4xl tabular-nums leading-none" style={{ color: s.c }}>{s.n}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#0b2545]/60 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="lg:pl-4">
            <div className="bg-[#0b2545] p-3 shadow-xl">
              <div className="flex items-center justify-between px-1 pb-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#06b6a4] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06b6a4] live-dot" /> positions en direct
                </span>
                <span className="font-mono text-[10px] text-white/50 tabular-nums">{online.length} actif(s)</span>
              </div>
              <MapComponent markers={markers} center={MAHAJANGA_CENTER} zoom={12} className="h-64 sm:h-72" />
              <div className="grid grid-cols-3 gap-2 pt-3">
                <Link href="/client/search" className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 hover:text-[#ffd60a] py-1.5 border border-white/10 hover:border-white/30 transition-colors">rechercher</Link>
                <Link href="/client/reservations/new" className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 hover:text-[#ffd60a] py-1.5 border border-white/10 hover:border-white/30 transition-colors">réserver</Link>
                <Link href="/client/reviews" className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 hover:text-[#ffd60a] py-1.5 border border-white/10 hover:border-white/30 transition-colors">avis</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Lignes */}
      <section id="lignes" className="bg-[#0b2545] text-[#f4f6f8]">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-12 lg:py-16">
          <Reveal>
            <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
              <div>
                <Kicker tone="#ff3b30">§ horaires</Kicker>
                <h2 className="font-display font-black text-2xl lg:text-3xl tracking-tight">Le tableau des lignes</h2>
              </div>
              <Link href="/client/search" className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/60 hover:text-[#ffd60a] link-underline">
                tous les trajets →
              </Link>
            </div>
          </Reveal>

          {busRoutes.length === 0 ? (
            <Reveal>
              <div className="border border-dashed border-white/20 py-12 text-center">
                <RouteIcon className="w-8 h-8 text-white/30 mx-auto mb-2" />
                <p className="text-white/70 text-sm">Aucune ligne publiée pour l'instant.</p>
                <p className="text-white/40 text-xs mt-1">L'administration crée les lignes depuis le panneau.</p>
              </div>
            </Reveal>
          ) : (
            <div className="border-t border-white/10">
              {busRoutes.map((r, i) => (
                <Reveal key={r.id}>
                  <Link
                    href={`/client/routes/${r.id}`}
                    className="group grid grid-cols-[auto_1fr_auto] md:grid-cols-[56px_1fr_auto_auto] gap-3 md:gap-6 items-center py-4 border-b border-white/10 hover:bg-white/5 px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-white/40 tabular-nums hidden md:inline">{String(i + 1).padStart(2, "0")}</span>
                      <span className="w-10 h-10 flex items-center justify-center font-display font-black text-sm text-[#0b2545]" style={{ background: r.color || "#ff3b30" }}>{r.lineNumber}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-base lg:text-lg tracking-tight group-hover:text-[#ffd60a] transition-colors truncate">{r.name}</p>
                      <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
                        <span className="truncate">{r.startPoint}</span>
                        <ArrowRight className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{r.endPoint}</span>
                        {r.estimatedTime ? <span className="hidden sm:inline tabular-nums">· {r.estimatedTime} min</span> : null}
                      </div>
                    </div>
                    <div className="hidden md:flex flex-wrap gap-1 max-w-[180px] justify-end">
                      {(r.schedule || []).slice(0, 4).map((t, j) => (
                        <span key={j} className="font-mono text-[10px] px-1.5 py-0.5 border border-white/15 tabular-nums">{t}</span>
                      ))}
                      {(r.schedule || []).length > 4 && <span className="font-mono text-[10px] text-white/40 px-1 py-0.5">+{(r.schedule || []).length - 4}</span>}
                    </div>
                    <div className="text-right">
                      <div className="font-display font-black text-lg lg:text-xl text-[#ffd60a] tabular-nums">{r.price?.toLocaleString()}</div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40">ariary</div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment" className="bg-grid">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-12 lg:py-16">
          <Reveal>
            <Kicker tone="#048a7c">§ mode d'emploi</Kicker>
            <h2 className="font-display font-black text-2xl lg:text-3xl tracking-tight mb-8">Quatre mouvements</h2>
          </Reveal>
          <div className="relative pl-6 md:pl-8">
            <div className="absolute left-[7px] md:left-[9px] top-2 bottom-2 w-[2px] bg-[#0b2545]/15" />
            {[
              { n: "01", Icon: MapPin, t: "Cherchez", d: "Saisissez départ et arrivée, ou parcourez les lignes et taxis.", c: "#ff3b30" },
              { n: "02", Icon: Navigation, t: "Suivez", d: "La carte affiche les véhicules en direct, position mise à jour en continu.", c: "#ffd60a" },
              { n: "03", Icon: Zap, t: "Réservez", d: "Taxi, bus de ligne ou spécial — confirmation immédiate.", c: "#06b6a4" },
              { n: "04", Icon: Star, t: "Échangez", d: "Notez, répondez aux avis, messagez le chauffeur sur la réservation.", c: "#457b9d" },
            ].map((s) => (
              <Reveal key={s.n} className="relative pb-7 last:pb-0">
                <span className="absolute -left-6 md:-left-8 top-1 w-4 h-4 rounded-full border-2 border-[#f4f6f8]" style={{ background: s.c }} />
                <div className="flex items-center gap-3">
                  <s.Icon className="w-5 h-5 flex-shrink-0" style={{ color: s.c }} strokeWidth={2.5} />
                  <h3 className="font-display font-bold text-lg lg:text-xl tracking-tight">{s.t}</h3>
                  <span className="font-mono text-[10px] text-[#0b2545]/40 tabular-nums">{s.n}</span>
                </div>
                <p className="mt-1 text-sm text-[#0b2545]/70 max-w-lg leading-relaxed">{s.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Rejoindre / chauffeurs */}
      <section id="rejoindre" className="bg-[#0b2545] text-[#f4f6f8]">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-12 lg:py-16 grid lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <Kicker tone="#06b6a4">§ rejoindre</Kicker>
            <h2 className="font-display font-black text-2xl lg:text-3xl tracking-tight leading-tight">
              Vous conduisez à Mahajanga ?
            </h2>
            <p className="mt-4 text-sm lg:text-[15px] leading-relaxed text-white/70 max-w-md">
              Créez votre compte en trois étapes. Réservations, trajets spéciaux, position en direct,
              tarifs maîtrisés. Validation par l'administration.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/driver/register" className="inline-flex items-center gap-2 bg-[#06b6a4] text-[#0b2545] px-5 py-3 hover:bg-[#ffd60a] transition-colors">
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] font-bold">s'inscrire</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/driver/login" className="inline-flex items-center gap-2 border-2 border-white/30 text-white px-5 py-3 hover:border-white hover:bg-white/5 transition-colors">
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] font-bold">connexion</span>
              </Link>
            </div>
            <div className="mt-7 flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> validation 24h</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> compte vérifié</span>
            </div>
          </Reveal>

          <Reveal>
            <div className="border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">chauffeurs actifs</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#06b6a4] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06b6a4] live-dot" /> {online.length} en ligne
                </span>
              </div>
              {active.length === 0 ? (
                <div className="py-10 text-center text-white/40 text-sm">Aucun chauffeur pour l'instant.</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {active.slice(0, 4).map((d) => (
                    <Link key={d.id} href={`/client/drivers/${d.id}`} className="group border border-white/10 hover:border-[#ffd60a] p-3 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 flex items-center justify-center font-display font-black text-sm text-[#0b2545] ${d.vehicleType === "bus" ? "bg-[#ff3b30]" : "bg-[#06b6a4]"}`}>{d.fullName.charAt(0)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-bold text-sm truncate group-hover:text-[#ffd60a] transition-colors">{d.fullName}</p>
                          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40 truncate">{d.vehicleType === "bus" ? `bus ${d.lineNumber || ""}` : d.vehicleNumber}</p>
                        </div>
                        {d.isOnline && <span className="w-2 h-2 rounded-full bg-[#06b6a4] live-dot flex-shrink-0" />}
                      </div>
                      <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]">
                        <span className="flex items-center gap-1 text-[#ffd60a] tabular-nums"><Star className="w-3 h-3 fill-[#ffd60a]" />{(d.rating || 0).toFixed(1)}</span>
                        {d.phone && <span className="flex items-center gap-1 text-white/50 group-hover:text-white"><Phone className="w-3 h-3" />appeler</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f4f6f8] border-t-2 border-[#0b2545]">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-10 grid md:grid-cols-3 gap-4">
          <div className="bg-[#0b2545] text-[#f4f6f8] p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-[#ff3b30] flex items-center justify-center"><Bus className="w-4 h-4 text-[#0b2545]" strokeWidth={2.5} /></div>
              <span className="font-display font-black text-base tracking-tight">TransMahajanga</span>
            </div>
            <p className="text-xs leading-relaxed text-white/70 max-w-xs">
              Suivi temps réel et gestion du réseau de bus et taxis de Mahajanga, région Boeny.
            </p>
            <div className="mt-4 font-mono text-[9px] uppercase tracking-[0.25em] text-[#457b9d]">© 2026 · tous droits réservés</div>
          </div>
          <div className="bg-[#ff3b30] text-[#0b2545] p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3 opacity-70">portails</div>
            <ul className="space-y-1.5 font-display font-bold text-base">
              <li><Link href="/client" className="link-underline">Espace client</Link></li>
              <li><Link href="/driver/login" className="link-underline">Espace chauffeur</Link></li>
              <li><Link href="/admin/login" className="link-underline">Administration</Link></li>
            </ul>
          </div>
          <div className="bg-[#ffd60a] text-[#0b2545] p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3 opacity-70">contact</div>
            <div className="space-y-1.5 text-[13px]">
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
