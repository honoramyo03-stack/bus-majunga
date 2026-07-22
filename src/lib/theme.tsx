"use client";
// Thème clair / sombre de l'espace client. Persisté (localStorage), appliqué
// via la classe `dark-client` sur le conteneur (les règles de surcharge de
// palette vivent dans index.css). Le bouton respecte la préférence système au
// premier chargement.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface ThemeCtxValue {
  dark: boolean;
  toggle: () => void;
}

const ThemeCtx = createContext<ThemeCtxValue>({ dark: false, toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let initial = false;
    try {
      const saved = localStorage.getItem("tm-theme");
      if (saved === "dark") initial = true;
      else if (saved === null && window.matchMedia?.("(prefers-color-scheme: dark)").matches)
        initial = true;
    } catch {
      /* localStorage indisponible */
    }
    setDark(initial);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("tm-theme", dark ? "dark" : "light");
    } catch {
      /* ignoré */
    }
  }, [dark]);

  return (
    <ThemeCtx.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
      <div
        className={`${
          dark ? "dark-client bg-[#0b1220]" : "bg-slate-50"
        } min-h-screen pb-20 transition-colors`}
      >
        {children}
      </div>
    </ThemeCtx.Provider>
  );
}

export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={dark ? "Mode clair" : "Mode sombre"}
      className={`relative w-12 h-7 rounded-full flex items-center px-1 transition-colors ${
        dark ? "bg-[#1e293b] border border-slate-600" : "bg-slate-200 border border-slate-300"
      }`}
    >
      <span
        className={`w-5 h-5 rounded-full bg-white shadow flex items-center justify-center text-[11px] leading-none transition-transform ${
          dark ? "translate-x-5" : "translate-x-0"
        }`}
      >
        {dark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
