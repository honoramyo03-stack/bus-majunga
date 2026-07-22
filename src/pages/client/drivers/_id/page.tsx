"use client";
import { useState, useEffect } from "react";
import { Link } from "@/lib/router";
import { useParams } from "@/lib/router";
import {
  ArrowLeft,
  Phone,
  Bus,
  Car,
  MapPin,
  Star,
  Clock,
  Navigation,
  MessageSquare,
  Zap,
  Shield,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useFirebaseData, useFirebaseList, firebaseOps } from "@/lib/firebase-hooks";
import type { Driver, Route, Review } from "@/lib/types";
import StarRating from "@/components/StarRating";
import MapComponent from "@/components/MapComponent";
import ReviewThread from "@/components/ReviewThread";
import toast from "react-hot-toast";

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: driver } = useFirebaseData<Driver>(`drivers/${id}`);
  const { data: reviews } = useFirebaseList<Review>(`reviews`);
  const { data: routes } = useFirebaseList<Route>("routes");

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    clientName: "",
    rating: 5,
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "map" | "reviews">("info");

  const driverReviews = reviews.filter((r) => r.driverId === id);
  const driverRoute = routes.find((r) => r.lineNumber === driver?.lineNumber);

  const avgRating =
    driverReviews.length > 0
      ? driverReviews.reduce((sum, r) => sum + r.rating, 0) / driverReviews.length
      : 0;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.clientName.trim() || !reviewForm.comment.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setSubmitting(true);
    try {
      await firebaseOps.push("reviews", {
        clientName: reviewForm.clientName,
        driverId: id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        type: driver?.vehicleType || "taxi",
      });

      // Update driver rating
      const newTotal = (driver?.totalRatings || 0) + 1;
      const newRating = ((driver?.rating || 0) * (driver?.totalRatings || 0) + reviewForm.rating) / newTotal;
      await firebaseOps.update(`drivers/${id}`, {
        rating: parseFloat(newRating.toFixed(2)),
        totalRatings: newTotal,
      });

      toast.success("Avis envoyé avec succès !");
      setReviewForm({ clientName: "", rating: 5, comment: "" });
      setShowReviewForm(false);
    } catch {
      toast.error("Erreur lors de l'envoi de l'avis");
    } finally {
      setSubmitting(false);
    }
  };

  if (!driver) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-500">Chauffeur non trouvé</p>
        <Link href="/client" className="text-blue-600 text-sm mt-2 block">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const mapMarkers = driver.currentLocation
    ? [
        {
          id: "self",
          lat: driver.currentLocation.lat,
          lng: driver.currentLocation.lng,
          type: driver.vehicleType as "bus" | "taxi",
          label: driver.vehicleNumber,
          popup: `<div class="p-2"><b>${driver.fullName}</b><br>${driver.vehicleNumber}</div>`,
          color: driver.vehicleType === "bus" ? "#3B82F6" : "#10B981",
        },
      ]
    : [];

  return (
    <div className="max-w-xl mx-auto">
      {/* Header Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-600 to-violet-700">
        {driver.vehicleImageUrl ? (
          <img
            src={driver.vehicleImageUrl}
            alt="Vehicle"
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            {driver.vehicleType === "bus" ? (
              <Bus className="w-32 h-32 text-white" />
            ) : (
              <Car className="w-32 h-32 text-white" />
            )}
          </div>
        )}

        {/* Back button */}
        <Link
          href="/client"
          className="absolute top-4 left-4 w-10 h-10 bg-black/30 backdrop-blur rounded-xl flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Online indicator */}
        {driver.isOnline && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-green-500/90 backdrop-blur px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full status-online"></div>
            <span className="text-white text-xs font-medium">En ligne</span>
          </div>
        )}
      </div>

      {/* Driver Card */}
      <div className="px-4 -mt-8 relative z-10 mb-6">
        <div className="bg-white rounded-3xl shadow-lg p-5">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              {driver.imageUrl ? (
                <img
                  src={driver.imageUrl}
                  alt={driver.fullName}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow"
                />
              ) : (
                <div
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow ${
                    driver.vehicleType === "bus" ? "bg-blue-500" : "bg-emerald-500"
                  }`}
                >
                  {driver.fullName.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-800">{driver.fullName}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        driver.vehicleType === "bus"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {driver.vehicleType === "bus" ? (
                        <Bus className="w-3 h-3" />
                      ) : (
                        <Car className="w-3 h-3" />
                      )}
                      {driver.vehicleType === "bus"
                        ? `Bus - Ligne ${driver.lineNumber}`
                        : "Taxi"}
                    </span>
                    {driver.canDoSpecial && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                        <Zap className="w-3 h-3" />
                        Spécial
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <StarRating rating={avgRating} size="sm" />
                <span className="text-sm text-slate-600 font-medium">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-slate-400">({driverReviews.length} avis)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <a
              href={`tel:${driver.phone}`}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl font-semibold transition-colors"
            >
              <Phone className="w-5 h-5" />
              Appeler
            </a>
            {(driver.vehicleType === "taxi" || driver.canDoSpecial) && (
              <Link
                href={`/client/reservations/new?driverId=${id}&type=${driver.vehicleType}`}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold transition-colors"
              >
                <Calendar className="w-5 h-5" />
                Réserver
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex bg-slate-100 rounded-2xl p-1">
          {(["info", "map", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "info" ? "Informations" : tab === "map" ? "Position" : "Avis"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-6">
        {activeTab === "info" && (
          <div className="space-y-4">
            {/* Vehicle Info */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                Informations du véhicule
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-sm">Numéro</span>
                  <span className="text-slate-800 font-medium text-sm">{driver.vehicleNumber}</span>
                </div>
                {driver.vehicleBrand && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Marque</span>
                    <span className="text-slate-800 font-medium text-sm">{driver.vehicleBrand}</span>
                  </div>
                )}
                {driver.vehicleColor && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Couleur</span>
                    <span className="text-slate-800 font-medium text-sm">{driver.vehicleColor}</span>
                  </div>
                )}
                {driver.vehicleType === "bus" && driver.lineNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Ligne</span>
                    <span className="text-blue-600 font-bold text-sm">Ligne {driver.lineNumber}</span>
                  </div>
                )}
                {driver.route && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Trajet</span>
                    <span className="text-slate-800 font-medium text-sm">{driver.route}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 text-sm">Spécial disponible</span>
                  <span
                    className={`text-sm font-medium flex items-center gap-1 ${
                      driver.canDoSpecial ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {driver.canDoSpecial ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {driver.canDoSpecial ? "Oui" : "Non"}
                  </span>
                </div>
              </div>
            </div>

            {/* Route Info */}
            {driverRoute && (
              <div className="bg-white rounded-2xl p-4 border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-500" />
                  Détails du trajet
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Départ</span>
                    <span className="text-slate-800 font-medium text-sm">{driverRoute.startPoint}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Arrivée</span>
                    <span className="text-slate-800 font-medium text-sm">{driverRoute.endPoint}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Prix</span>
                    <span className="text-emerald-600 font-bold text-sm">
                      {driverRoute.price?.toLocaleString()} Ar
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Distance</span>
                    <span className="text-slate-800 font-medium text-sm">{driverRoute.distance} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Durée estimée</span>
                    <span className="text-slate-800 font-medium text-sm">
                      {driverRoute.estimatedTime} min
                    </span>
                  </div>
                </div>

                {(driverRoute.specialTiers || []).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-slate-500 text-sm mb-2 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-[#c92a22]" /> Tarifs spéciaux (selon le nombre de places)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(driverRoute.specialTiers || []).map((t, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-lg bg-[#ffe5e3] text-[#c92a22] font-medium tabular-nums">
                          ≥ {t.minSeats} places → {t.price.toLocaleString()} Ar / passager
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {driverRoute.schedule && driverRoute.schedule.length > 0 && (
                  <div className="mt-3">
                    <p className="text-slate-500 text-sm mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Horaires de départ
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {driverRoute.schedule.map((time, i) => (
                        <span
                          key={i}
                          className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-medium"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {driverRoute.waypoints && driverRoute.waypoints.length > 0 && (
                  <div className="mt-3">
                    <p className="text-slate-500 text-sm mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Arrêts
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-slate-600">{driverRoute.startPoint}</span>
                      </div>
                      {driverRoute.waypoints.map((wp, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                          <span className="text-xs text-slate-500">{wp}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-xs text-slate-600">{driverRoute.endPoint}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contact */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-500" />
                Contact
              </h3>
              <a
                href={`tel:${driver.phone}`}
                className="flex items-center justify-between py-2 hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors"
              >
                <span className="text-slate-600 text-sm">Téléphone</span>
                <span className="text-green-600 font-medium">{driver.phone}</span>
              </a>
            </div>
          </div>
        )}

        {activeTab === "map" && (
          <div>
            {driver.currentLocation ? (
              <div>
                <div className="bg-white rounded-2xl p-3 border border-slate-100 mb-3">
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-500" />
                    Dernière mise à jour:{" "}
                    {new Date(driver.currentLocation.timestamp).toLocaleTimeString("fr-FR")}
                  </p>
                  {driver.currentLocation.speed !== undefined && (
                    <p className="text-sm text-slate-500 mt-1">
                      Vitesse: {Math.round(driver.currentLocation.speed)} km/h
                    </p>
                  )}
                </div>
                <MapComponent
                  markers={mapMarkers}
                  center={driver.currentLocation}
                  zoom={15}
                  className="h-80 rounded-2xl border border-slate-100"
                  routeCoords={driverRoute?.coordinates || []}
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
                <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Position non disponible</p>
                <p className="text-slate-400 text-sm mt-1">
                  Le chauffeur n&apos;a pas partagé sa position
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div>
            {/* Write Review */}
            {!showReviewForm ? (
              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-2xl font-medium mb-4 hover:bg-blue-700 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                Écrire un avis
              </button>
            ) : (
              <div className="bg-white rounded-2xl p-4 border border-slate-200 mb-4 animate-slide-up">
                <h3 className="font-semibold text-slate-800 mb-4">Votre avis</h3>
                <form onSubmit={handleSubmitReview} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Votre nom"
                    value={reviewForm.clientName}
                    onChange={(e) =>
                      setReviewForm((f) => ({ ...f, clientName: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
                  />
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Note</p>
                    <StarRating
                      rating={reviewForm.rating}
                      size="lg"
                      interactive
                      onChange={(r) => setReviewForm((f) => ({ ...f, rating: r }))}
                    />
                  </div>
                  <textarea
                    placeholder="Votre commentaire..."
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm((f) => ({ ...f, comment: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
                    >
                      {submitting ? "Envoi..." : "Envoyer"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Reviews List */}
            {driverReviews.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                <Star className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">Aucun avis pour l&apos;instant</p>
                <p className="text-slate-400 text-sm mt-1">
                  Soyez le premier à laisser un avis !
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {driverReviews
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((review) => (
                    <ReviewThread key={review.id} review={review} />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
