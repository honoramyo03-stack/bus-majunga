"use client";
// Page de maintenance. Le réseau démarre VIDE : aucune donnée n'est
// pré-chargée. Cette page permet à l'administration de purger manuellement
// les collections (par ex. pour repartir de zéro). Les comptes admin ne sont
// jamais supprimés ici.
import { useEffect, useState } from "react";
import { Link, useRouter } from "@/lib/router";
import { useAuth } from "@/lib/auth-context";
import { useFirebaseList, firebaseOps } from "@/lib/firebase-hooks";
import type { Driver, Route, Reservation, Review, Message } from "@/lib/types";
import { ArrowLeft, Trash2, ShieldAlert, Database } from "lucide-react";
import toast from "react-hot-toast";

const COLLECTIONS = [
  "drivers",
  "routes",
  "reservations",
  "reviews",
  "messages",
  "notifications",
  "locations",
] as const;

export default function AdminSetup() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const { data: drivers } = useFirebaseList<Driver>("drivers");
  const { data: routes } = useFirebaseList<Route>("routes");
  const { data: reservations } = useFirebaseList<Reservation>("reservations");
  const { data: reviews } = useFirebaseList<Review>("reviews");
  const { data: messages } = useFirebaseList<Message>("messages");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.push("/admin/login");
  }, [loading, user, isAdmin, router]);

  const counts: Record<string, number> = {
    drivers: drivers.length,
    routes: routes.length,
    reservations: reservations.length,
    reviews: reviews.length,
    messages: messages.length,
  };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const wipe = async (c: string) => {
    if (!confirm(`Supprimer TOUTES les données de « ${c} » ? Action irréversible.`)) return;
    setBusy(c);
    try {
      await firebaseOps.remove(c);
      toast.success(`« ${c} » vidé`);
    } catch {
      toast.error(`Erreur sur « ${c} »`);
    } finally {
      setBusy(null);
    }
  };

  const wipeAll = async () => {
    if (
      !confirm(
        "Vider TOUTES les collections (chauffeurs, lignes, réservations, avis, messages…) ?\n\nLes comptes administrateurs sont conservés. Action irréversible."
      )
    )
      return;
    setBusy("all");
    try {
      for (const c of COLLECTIONS) await firebaseOps.remove(c).catch(() => {});
      toast.success("Base vidée (admins conservés)");
    } finally {
      setBusy(null);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-500/30 border-t-red-500 rounded-full spinner" />
      </div>
    );
  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-5 py-10">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Tableau de bord
        </Link>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 bg-red-600/20 border border-red-500/30 rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Maintenance</h1>
            <p className="text-slate-400 text-sm">Le réseau démarre vide — aucune donnée par défaut.</p>
          </div>
        </div>

        <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xl">
          TransMahajanga ne contient aucune donnée pré-remplie : les lignes sont créées par
          l'administration, les chauffeurs par inscription, les avis par les clients. Utilisez
          cette page uniquement pour purger manuellement une collection.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {Object.entries(counts).map(([k, v]) => (
            <div key={k} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-2xl font-bold tabular-nums">{v}</div>
              <div className="text-slate-400 text-xs uppercase tracking-wider mt-1">{k}</div>
            </div>
          ))}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-2xl font-bold tabular-nums text-red-400">{total}</div>
            <div className="text-slate-400 text-xs uppercase tracking-wider mt-1">total</div>
          </div>
        </div>

        <h2 className="font-semibold mb-3">Purger une collection</h2>
        <div className="space-y-2 mb-8">
          {COLLECTIONS.map((c) => (
            <div
              key={c}
              className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3"
            >
              <div>
                <span className="font-mono text-sm">{c}</span>
                <span className="text-slate-500 text-xs ml-3">
                  {counts[c] !== undefined ? `${counts[c]} élément(s)` : "—"}
                </span>
              </div>
              <button
                onClick={() => wipe(c)}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 text-xs bg-red-600/20 text-red-400 border border-red-600/30 px-3 py-1.5 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {busy === c ? "…" : "vider"}
              </button>
            </div>
          ))}
        </div>

        <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-red-300">Tout vider (sauf les admins)</div>
              <p className="text-slate-400 text-sm mt-1">
                Supprime chauffeurs, lignes, réservations, avis, messages, positions. Vos comptes
                administrateurs restent intacts.
              </p>
              <button
                onClick={wipeAll}
                disabled={busy !== null}
                className="mt-3 inline-flex items-center gap-2 bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {busy === "all" ? "Suppression…" : "Vider toute la base"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
