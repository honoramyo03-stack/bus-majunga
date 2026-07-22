"use client";
import { Link, Outlet, usePathname } from "@/lib/router";
import { Bus, MapPin, Calendar, Star, Home, Search } from "lucide-react";

const navItems = [
  { href: "/client", label: "Accueil", icon: Home },
  { href: "/client/search", label: "Recherche", icon: Search },
  { href: "/client/map", label: "Carte", icon: MapPin },
  { href: "/client/reservations", label: "Réservations", icon: Calendar },
  { href: "/client/reviews", label: "Avis", icon: Star },
];

export default function ClientLayout() {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 pb-3 pt-[calc(0.75rem_+_env(safe-area-inset-top))] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
              <Bus className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm">TransMahajanga</span>
              <p className="text-slate-400 text-xs">Espace Client</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full status-online"></div>
              <span className="text-green-700 text-xs font-medium">Service actif</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu de la route enfant */}
      <main className="pt-[calc(4rem_+_env(safe-area-inset-top))]">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="max-w-xl mx-auto flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/client" && pathname.startsWith(item.href));
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
    </div>
  );
}
