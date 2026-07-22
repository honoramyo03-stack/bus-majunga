"use client";
import { useState } from "react";
import { Star, MessageSquare, Filter, Bus, Car } from "lucide-react";
import { useFirebaseList } from "@/lib/firebase-hooks";
import type { Review, Driver } from "@/lib/types";
import StarRating from "@/components/StarRating";
import ReviewThread from "@/components/ReviewThread";

export default function ReviewsPage() {
  const [filter, setFilter] = useState<"all" | "bus" | "taxi">("all");
  const { data: reviews } = useFirebaseList<Review>("reviews");
  const { data: drivers } = useFirebaseList<Driver>("drivers");

  const filtered = reviews.filter((r) => filter === "all" || r.type === filter);
  const getDriver = (id: string) => drivers.find((d) => d.id === id);

  const avg = filtered.length > 0 ? filtered.reduce((s, r) => s + r.rating, 0) / filtered.length : 0;
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: filtered.filter((r) => r.rating === star).length,
    pct: filtered.length > 0 ? (filtered.filter((r) => r.rating === star).length / filtered.length) * 100 : 0,
  }));

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Avis & Notes</h1>
          <p className="text-slate-500 text-sm">{reviews.length} avis · temps réel</p>
        </div>
      </div>

      {/* Stats live */}
      <div className="bg-gradient-to-br from-[#0b2545] to-[#1b4079] rounded-3xl p-6 mb-6 text-white">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold tabular-nums">{avg.toFixed(1)}</div>
            <StarRating rating={Math.round(avg)} size="md" />
            <p className="text-blue-200 text-xs mt-1">{filtered.length} avis</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {dist.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-blue-200 text-xs w-4">{star}</span>
                <Star className="w-3 h-3 text-yellow-300 fill-yellow-300 flex-shrink-0" />
                <div className="flex-1 bg-white/20 rounded-full h-1.5">
                  <div className="bg-yellow-300 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-blue-200 text-xs w-4 tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(["all", "bus", "taxi"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f ? "bg-[#0b2545] text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {f === "all" ? <Filter className="w-4 h-4" /> : f === "bus" ? <Bus className="w-4 h-4" /> : <Car className="w-4 h-4" />}
            {f === "all" ? "Tous" : f === "bus" ? "Bus" : "Taxi"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
            <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500">Aucun avis pour l'instant</p>
          </div>
        ) : (
          filtered
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((review) => (
              <ReviewThread key={review.id} review={review} driverName={getDriver(review.driverId)?.fullName} />
            ))
        )}
      </div>
    </div>
  );
}
