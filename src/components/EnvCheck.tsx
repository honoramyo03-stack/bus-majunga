"use client";
// EnvCheck : deux rôles.
//  1) Si la config Firebase est absente → écran bloquant qui donne le .env.
//  2) Si la config est présente → rend les enfants + un bandeau de diagnostic
//     Realtime Database (connexion + permissions). C'est ce bandeau qui
//     explique immédiatement pourquoi « rien ne s'enregistre » : base non
//     créée, mauvaise URL/région, ou règles de sécurité bloquantes.
import { useEffect, useState, type ReactNode } from "react";
import { ref, onValue } from "firebase/database";
import { hasFirebaseConfig, database } from "@/lib/firebase";
import { AlertTriangle, X, Copy, RefreshCw } from "lucide-react";

const VARS: Array<[string, string]> = [
  ["NEXT_PUBLIC_FIREBASE_API_KEY", process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ""],
  ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ""],
  ["NEXT_PUBLIC_FIREBASE_DATABASE_URL", process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || ""],
  ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ""],
  ["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ""],
  ["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ""],
  ["NEXT_PUBLIC_FIREBASE_APP_ID", process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""],
];

const ENV_TEMPLATE = `# Copiez ce contenu dans un fichier .env à la racine, puis relancez le serveur.
# IMPORTANT : l'application utilise REALTIME DATABASE (pas Firestore).

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC_X6Rf2TWWt6LHVedYyrO-BV2sDw2qPl4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=transport-mahajanga.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://transport-mahajanga-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=transport-mahajanga
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=transport-mahajanga.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=137400122364
NEXT_PUBLIC_FIREBASE_APP_ID=1:137400122364:web:bb8c751ebe5d3d3d16d079

ADMIN_EMAIL=admin@mahajanga-transport.mg
NEXT_PUBLIC_ADMIN_EMAIL=admin@mahajanga-transport.mg
`;

function ConnectionBanner() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [permError, setPermError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!database) return;
    const u1 = onValue(
      ref(database, ".info/connected"),
      (s) => setConnected(!!s.val()),
      () => setConnected(false)
    );
    // Sonde les permissions sur une vraie collection.
    const u2 = onValue(
      ref(database, "drivers"),
      () => setPermError(null),
      (e) => setPermError(e.message)
    );
    return () => {
      u1();
      u2();
    };
  }, []);

  if (dismissed) return null;
  const problem = permError || connected === false;
  if (!problem) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] bg-[#ff3b30] text-[#0b2545] px-4 py-3 shadow-xl">
      <div className="max-w-5xl mx-auto flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
        <div className="flex-1 text-[13px] leading-snug">
          <span className="font-display font-black tracking-tight">Chargement en cours...</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="p-1.5 hover:bg-black/10 rounded flex-shrink-0"
          title="Reconnecter"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 hover:bg-black/10 rounded flex-shrink-0"
          title="Masquer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function EnvCheck({ children }: { children: ReactNode }) {
  if (hasFirebaseConfig) {
    return (
      <>
        {children}
        <ConnectionBanner />
      </>
    );
  }

  const missing = VARS.filter(([, v]) => !v).map(([k]) => k);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0b2545] text-[#f4f6f8] font-body overflow-auto">
      <div className="absolute inset-0 bg-grid-dark pointer-events-none" />
      <div className="relative max-w-3xl mx-auto px-6 py-12 lg:py-16">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[#ff3b30] mb-5">
          <span className="w-8 h-[2px] bg-[#ff3b30]" /> configuration manquante
        </div>
        <h1 className="font-display font-black text-5xl lg:text-7xl tracking-[-0.04em] leading-[0.9]">
          Le moteur<br />n'a pas de <span className="text-[#ff3b30]">carburant.</span>
        </h1>
        <p className="mt-5 text-[14px] leading-relaxed text-white/75 max-w-xl">
          TransMahajanga a besoin des clés Firebase pour fonctionner. Créez un fichier{" "}
          <code className="font-mono bg-white/10 px-1.5 py-0.5">.env</code> à la racine avec le
          contenu ci-dessous, puis relancez le serveur. L'application utilise{" "}
          <b>Realtime Database</b> (et non Firestore).
        </p>

        <div className="mt-8 border-2 border-[#ff3b30] bg-[#ff3b30]/10 p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ff3b30] mb-3">
            variables manquantes ({missing.length})
          </div>
          <ul className="space-y-1 font-mono text-[12px]">
            {missing.map((k) => (
              <li key={k} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#ff3b30]" />
                <span className="text-white/90">{k}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#06b6a4]">
              1 · créer le fichier <span className="text-white">.env</span>
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(ENV_TEMPLATE).catch(() => {})}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] bg-[#06b6a4] text-[#0b2545] px-3 py-1.5 hover:bg-[#ffd60a] transition-colors"
            >
              <Copy className="w-3.5 h-3.5" /> copier
            </button>
          </div>
          <pre className="bg-black/40 border border-white/10 p-4 text-[11px] leading-relaxed text-white/85 font-mono overflow-x-auto whitespace-pre">
            {ENV_TEMPLATE}
          </pre>
        </div>

        <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-[#ffd60a]">
          2 · puis relancer le serveur
        </div>
        <p className="mt-2 text-[12px] text-white/60 leading-relaxed">
          Next/Vite ne lit le <code className="font-mono">.env</code> qu'au démarrage. Après création,
          arrêtez le serveur (Ctrl+C) puis relancez-le ; cette page laissera place à l'application.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mt-8 inline-flex items-center gap-3 bg-[#ff3b30] text-[#0b2545] px-6 py-3.5 hover:bg-[#ffd60a] transition-colors font-mono text-[11px] uppercase tracking-[0.3em] font-bold"
        >
          <RefreshCw className="w-4 h-4" /> j'ai créé mon .env · recharger
        </button>
      </div>
    </div>
  );
}
