"use client";
// Fil de messages attaché à une réservation : le chauffeur y informe le
// réservant, et le réservant (qui consulte ses réservations par téléphone)
// peut répondre. Synchronisé en temps réel via Realtime Database.
import { useState } from "react";
import { useFirebaseList, firebaseOps } from "@/lib/firebase-hooks";
import { Send, MessageSquare } from "lucide-react";

interface RMsg {
  id: string;
  from: "driver" | "client";
  authorName: string;
  content: string;
  createdAt: number;
}

export default function ReservationThread({
  resId,
  mode,
  authorName,
  theme = "dark",
}: {
  resId: string;
  mode: "driver" | "client";
  authorName: string;
  theme?: "dark" | "light";
}) {
  const { data: msgs } = useFirebaseList<RMsg>(`reservationMessages/${resId}`);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const sorted = [...msgs].sort((a, b) => a.createdAt - b.createdAt);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await firebaseOps.push(`reservationMessages/${resId}`, {
        from: mode,
        authorName: authorName || "Anonyme",
        content: text.trim(),
        createdAt: Date.now(),
      });
      setText("");
    } finally {
      setSending(false);
    }
  };

  const t =
    theme === "dark"
      ? {
          border: "border-slate-700/60",
          toggle: "text-blue-300 hover:text-blue-200",
          mine: "bg-blue-600 text-white",
          other: "bg-slate-700 text-slate-100",
          mineSub: "text-white/70",
          otherSub: "text-slate-400",
          empty: "text-slate-500",
          input: "bg-slate-700 border-slate-600 text-white focus:border-blue-500",
          btn: "bg-blue-600 text-white",
        }
      : {
          border: "border-slate-200",
          toggle: "text-[#048a7c] hover:text-[#0b2545]",
          mine: "bg-[#0b2545] text-white",
          other: "bg-slate-100 text-slate-800",
          mineSub: "text-white/70",
          otherSub: "text-slate-400",
          empty: "text-slate-400",
          input: "bg-white border-slate-200 text-slate-800 focus:border-[#06b6a4]",
          btn: "bg-[#0b2545] text-white",
        };

  return (
    <div className={`mt-3 border-t ${t.border} pt-3`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-xs font-medium ${t.toggle}`}
      >
        <MessageSquare className="w-3.5 h-3.5" /> Messages sur la réservation ({sorted.length})
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {sorted.length === 0 ? (
              <p className={`text-xs ${t.empty}`}>
                {mode === "driver"
                  ? "Aucun message. Informez le réservant ici."
                  : "Aucun message. Écrivez au chauffeur ici."}
              </p>
            ) : (
              sorted.map((m) => {
                const mine = m.from === mode;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 ${mine ? t.mine : t.other}`}>
                      <div
                        className={`text-[10px] uppercase tracking-wider mb-0.5 ${
                          mine ? t.mineSub : t.otherSub
                        }`}
                      >
                        {m.authorName}
                      </div>
                      <p className="text-[13px] leading-snug">{m.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={mode === "driver" ? "Message au réservant…" : "Message au chauffeur…"}
              className={`flex-1 border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none ${t.input}`}
            />
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              className={`px-3 rounded-lg disabled:opacity-40 ${t.btn}`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
