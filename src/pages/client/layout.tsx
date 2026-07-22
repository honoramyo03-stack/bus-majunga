"use client";
import { useEffect, useState } from "react";
import { Link, Outlet, usePathname } from "@/lib/router";
import { Bus, MapPin, Calendar, Star, Home, Search } from "lucide-react";
import { ThemeProvider, ThemeToggle } from "@/lib/theme";
import { useFirebaseData } from "@/lib/firebase-hooks";

const navItems = [
  { href: "/client", label: "Accueil", icon: Home },
  { href: "/client/search", label: "Recherche", icon: Search },
  { href: "/client/map", label: "Carte", icon: MapPin },
  { href: "/client/reservations", label: "Réservations", icon: Calendar },
  { href: "/client/reviews", label: "Avis", icon: Star },
];

const DEFAULT_MARQUEE =
  "TransMahajanga — bus & taxis de Mahajanga en temps réel • Réservation • Suivi live • Avis •";

function ClientClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const date = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
      const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setT(`${date} ${time}`);
    };
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono tabular-nums text-slate-600 whitespace-nowrap text-[10px] sm:text-xs">
      {t}
    </span>
  );
}

function Marquee({
  text,
  style,
}: {
  text: string;
  style?: { color?: string; bg?: string; speed?: number; size?: number; weight?: string | number };
}) {
  return (
    <div
      className="relative overflow-hidden flex-1 min-w-0 rounded-md"
      style={{ background: style?.bg || undefined }}
    >
      <div
        className="marquee-phrase whitespace-nowrap text-[11px] text-slate-500 px-2 py-0.5"
        style={{
          color: style?.color || undefined,
          fontSize: style?.size ? `${style.size}px` : undefined,
          fontWeight: style?.weight ? String(style.weight) : undefined,
          animationDuration: style?.speed ? `${style.speed}s` : undefined,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function ClientShell() {
  const pathname = usePathname();
  const { data: settings } = useFirebaseData<{ headerMarquee?: string } | null>("settings/general");
  const s = settings as any;
  const marqueeText = s?.headerMarquee?.trim() || DEFAULT_MARQUEE;
  const marqueeStyle = {
    color: s?.headerMarqueeColor || undefined,
    bg: s?.headerMarqueeBg || undefined,
    speed: Number(s?.headerMarqueeSpeed) || undefined,
    size: Number(s?.headerMarqueeSize) || undefined,
    weight: s?.headerMarqueeWeight || undefined,
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-3 pt-[calc(0.75rem_+_env(safe-area-inset-top))] grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bus className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block min-w-0">
              <span className="font-bold text-slate-800 text-sm block leading-tight">TransMahajanga</span>
              <p className="text-slate-400 text-xs leading-tight">Espace Client</p>
            </div>
          </Link>

          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 min-w-0">
            <ClientClock />
            <div className="flex w-full sm:flex-1 min-w-0">
              <Marquee text={marqueeText} style={marqueeStyle} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full status-online" />
              <span className="text-green-700 text-xs font-medium">Service actif</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="pt-3">
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-xl mx-auto flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/client" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                  isActive ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-blue-600" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default function ClientLayout() {
  return (
    <ThemeProvider>
      <ClientShell />
    </ThemeProvider>
  );
}
