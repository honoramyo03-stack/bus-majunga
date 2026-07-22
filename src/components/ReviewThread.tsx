"use client";
// Fil de discussion d'un avis : affiche l'avis + ses réponses, et permet d'y
// répondre. L'identité du répondeur dépend du visiteur connecté :
//  - admin connecté        → réponse en tant qu'« Administration »
//  - chauffeur propriétaire de l'avis → réponse en tant que chauffeur
//  - sinon (client)        → saisie libre du nom, réponse en tant que client
// Tout est synchronisé en temps réel via Realtime Database.
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFirebaseList, firebaseOps } from "@/lib/firebase-hooks";
import type { Review } from "@/lib/types";
import StarRating from "@/components/StarRating";

interface Reply {
  id: string;
  authorName: string;
  authorRole: "admin" | "driver" | "client";
  authorId?: string | null;
  content: string;
  createdAt: number;
}

const ROLE_STYLE: Record<string, string> = {
  admin: "bg-[#ff3b30] text-[#0b2545]",
  driver: "bg-[#06b6a4] text-[#0b2545]",
  client: "bg-[#457b9d] text-[#f4f6f8]",
};
const ROLE_LABEL: Record<string, string> = {
  admin: "Administration",
  driver: "Chauffeur",
  client: "Client",
};

export default function ReviewThread({
  review,
  driverName,
}: {
  review: Review;
  driverName?: string;
}) {
  const { user, isAdmin, driver } = useAuth();
  const { data: replies } = useFirebaseList<Reply>(`reviews/${review.id}/replies`);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);

  const isAdminViewer = !!isAdmin;
  const isDriverOwner = !!driver && !!user && review.driverId === user.uid;
  const viewerRole: "admin" | "driver" | "client" = isAdminViewer
    ? "admin"
    : isDriverOwner
    ? "driver"
    : "client";
  const viewerName = isAdminViewer
    ? "Administration"
    : isDriverOwner
    ? driver!.fullName
    : name.trim();

  const submit = async () => {
    if (!content.trim()) return;
    if (viewerRole === "client" && !name.trim()) return;
    setSending(true);
    try {
      await firebaseOps.push(`reviews/${review.id}/replies`, {
        authorName: viewerName || "Anonyme",
        authorRole: viewerRole,
        authorId: user?.uid || null,
        content: content.trim(),
        createdAt: Date.now(),
      });
      setContent("");
      setOpen(false);
    } finally {
      setSending(false);
    }
  };

  const sorted = [...replies].sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#0b2545] to-[#1b4079] rounded-xl flex items-center justify-center text-white text-xs font-bold">
            {review.clientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-medium text-slate-800 text-sm">{review.clientName}</span>
            {driverName && (
              <span className="text-slate-400 text-xs ml-2">→ {driverName}</span>
            )}
          </div>
        </div>
        <span className="text-slate-400 text-xs">
          {new Date(review.createdAt).toLocaleDateString("fr-FR")}
        </span>
      </div>

      <StarRating rating={review.rating} size="sm" />
      <p className="text-slate-600 text-sm mt-2 leading-relaxed">{review.comment}</p>

      {sorted.length > 0 && (
        <div className="mt-3 space-y-2 pl-3 border-l-2 border-slate-100">
          {sorted.map((r) => (
            <div key={r.id} className="bg-slate-50 rounded-lg p-2.5">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    ROLE_STYLE[r.authorRole] || ROLE_STYLE.client
                  }`}
                >
                  {ROLE_LABEL[r.authorRole] || "Client"}
                </span>
                <span className="text-slate-700 text-xs font-medium">{r.authorName}</span>
                <span className="text-slate-400 text-[10px] ml-auto">
                  {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <p className="text-slate-600 text-[13px] leading-snug">{r.content}</p>
            </div>
          ))}
        </div>
      )}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-3 text-[12px] font-medium text-[#048a7c] hover:underline"
        >
          ↩ Répondre{sorted.length > 0 ? ` (${sorted.length})` : ""}
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          {viewerRole === "client" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#06b6a4]"
            />
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            placeholder={`Répondre en tant que ${ROLE_LABEL[viewerRole]}…`}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#06b6a4] resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setOpen(false);
                setContent("");
              }}
              className="px-3 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={
                sending ||
                !content.trim() ||
                (viewerRole === "client" && !name.trim())
              }
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#0b2545] rounded-lg disabled:opacity-50"
            >
              {sending ? "…" : "Publier la réponse"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
