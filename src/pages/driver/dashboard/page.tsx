"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/lib/router";
import { Link } from "@/lib/router";
import {
  MapPin,
  Navigation,
  Power,
  PowerOff,
  Bus,
  Car,
  Star,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useFirebaseList, useFirebaseData, firebaseOps } from "@/lib/firebase-hooks";
import type { Reservation, Message, Notification as AppNotification, Review } from "@/lib/types";
import StarRating from "@/components/StarRating";
import MapComponent from "@/components/MapComponent";
import ReviewThread from "@/components/ReviewThread";
import ReservationThread from "@/components/ReservationThread";
import toast from "react-hot-toast";

export default function DriverDashboard() {
  const router = useRouter();
  const { user, driver, isAdmin, loading, logout, refresh } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "reservations" | "messages" | "settings">("home");
  const [watchId, setWatchId] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: reservations } = useFirebaseList<Reservation>("reservations");
  const { data: messages } = useFirebaseList<Message>("messages");
  const { data: notifications } = useFirebaseList<AppNotification>(
    user ? `notifications/${user.uid}` : null
  );
  const { data: reviews } = useFirebaseList<Review>("reviews");

  const myReservations = reservations.filter((r) => r.driverId === user?.uid);
  const myMessages = messages.filter((m) => m.toId === user?.uid || m.fromId === user?.uid);
  const myReviews = reviews.filter((r) => r.driverId === user?.uid);
  const unreadNotifs = notifications.filter((n) => !n.isRead);
  const unreadMessages = myMessages.filter((m) => m.toId === user?.uid && !m.isRead);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/driver/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (driver) {
      setIsOnline(driver.isOnline);
    }
  }, [driver]);

  // Synchronisation temps réel : si l'admin suspend/désactive le compte, on
  // coupe immédiatement le partage GPS et le statut en ligne (effet direct).
  useEffect(() => {
    if (!driver || !user) return;
    if (driver.status !== "active" && (isOnline || tracking)) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setTracking(false);
      setIsOnline(false);
      setCurrentLocation(null);
      firebaseOps
        .update(`drivers/${user.uid}`, { isOnline: false, currentLocation: null })
        .catch(() => {});
      toast.error(
        driver.status === "suspended"
          ? "Compte suspendu par l'administration — connexion coupée."
          : "Compte désactivé — connexion coupée."
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver?.status]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas disponible");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      async (position) => {
        // On n'écrit JAMAIS de valeur `undefined` (Firebase les rejette) :
        // heading/speed sont ajoutés uniquement si réellement disponibles.
        const loc: Record<string, number> = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
        };
        if (
          typeof position.coords.heading === "number" &&
          !Number.isNaN(position.coords.heading)
        ) {
          loc.heading = position.coords.heading;
        }
        if (typeof position.coords.speed === "number" && position.coords.speed >= 0) {
          loc.speed = Math.round(position.coords.speed * 3.6);
        }
        setCurrentLocation({ lat: loc.lat, lng: loc.lng });
        if (user) {
          await firebaseOps.update(`drivers/${user.uid}`, {
            currentLocation: loc,
          });
          await firebaseOps.update(`locations/${user.uid}`, {
            ...loc,
            driverId: user.uid,
            isOnline: true,
          });
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        toast.error("Erreur de géolocalisation");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
    setWatchId(id);
    setTracking(true);
    toast.success("Partage de position activé");
  }, [user]);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setTracking(false);
    toast("Partage de position désactivé", { icon: "📍" });
  }, [watchId]);

  const toggleOnline = async () => {
    if (!user) return;
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    await firebaseOps.update(`drivers/${user.uid}`, { isOnline: newStatus });
    if (newStatus) {
      startTracking();
      toast.success("Vous êtes maintenant en ligne !");
    } else {
      stopTracking();
      await firebaseOps.update(`drivers/${user.uid}`, { currentLocation: null });
      toast("Vous êtes maintenant hors ligne", { icon: "👋" });
    }
  };

  const handleReservationStatus = async (reservationId: string, status: "confirmed" | "cancelled" | "completed") => {
    await firebaseOps.update(`reservations/${reservationId}`, { status });
    toast.success(
      status === "confirmed"
        ? "Réservation confirmée !"
        : status === "cancelled"
        ? "Réservation refusée"
        : "Trajet terminé !"
    );
  };

  const markNotificationRead = async (notifId: string) => {
    if (!user) return;
    await firebaseOps.update(`notifications/${user.uid}/${notifId}`, { isRead: true });
  };

  // Réponse du chauffeur aux messages de l'administration.
  const [replyText, setReplyText] = useState("");
  const sendReply = async () => {
    if (!user || !driver || !replyText.trim()) return;
    const content = replyText.trim();
    setReplyText("");
    await firebaseOps.push("messages", {
      fromId: user.uid,
      toId: "admin",
      fromName: driver.fullName,
      toName: "Administration",
      content,
      type: "info",
      isRead: false,
    });
    await firebaseOps.push("notifications/admin", {
      title: `Réponse de ${driver.fullName}`,
      body: content,
      type: "message",
      isRead: false,
      target: { tab: "messages" },
    });
    toast.success("Réponse envoyée à l'administration");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/driver/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full spinner" />
      </div>
    );
  }

  if (!user || isAdmin) {
    return null;
  }

  const driverStatusColor =
    driver?.status === "active"
      ? "text-green-400 bg-green-400/20"
      : driver?.status === "pending"
      ? "text-yellow-400 bg-yellow-400/20"
      : "text-red-400 bg-red-400/20";

  const driverStatusLabel =
    driver?.status === "active"
      ? "Actif"
      : driver?.status === "pending"
      ? "En attente de validation"
      : driver?.status === "suspended"
      ? "Suspendu"
      : "Inactif";

  const mapMarker = currentLocation
    ? [
        {
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          type: (driver?.vehicleType || "taxi") as "bus" | "taxi",
          label: driver?.vehicleNumber,
          popup: "Ma position",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-800 border-b border-slate-700 px-4 pb-4 pt-[calc(1rem_+_env(safe-area-inset-top))]">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          <div className="flex items-center gap-3">
            {driver?.imageUrl ? (
              <img
                src={driver.imageUrl}
                alt={driver.fullName}
                className="w-11 h-11 rounded-xl object-cover"
              />
            ) : (
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold">
                {driver?.fullName?.charAt(0) || "?"}
              </div>
            )}
            <div>
              <p className="text-white font-semibold text-sm">{driver?.fullName || "Chauffeur"}</p>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${driverStatusColor}`}>
                  {driverStatusLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setActiveTab("messages")}
                className="w-9 h-9 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <Bell className="w-4 h-4" />
              </button>
              {unreadNotifs.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{unreadNotifs.length}</span>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-9 h-9 bg-slate-700 hover:bg-red-600 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto px-4 py-5">
        {/* Status Warning */}
        {driver?.status === "pending" && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4 mb-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-300 font-medium">Compte en attente de validation</p>
              <p className="text-yellow-400/80 text-sm mt-1">
                Votre compte est en cours de vérification par l&apos;administrateur.
                Vous serez notifié dès que votre compte sera activé.
              </p>
            </div>
          </div>
        )}

        {driver?.status === "suspended" && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 mb-5 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium">Compte suspendu</p>
              <p className="text-red-400/80 text-sm mt-1">
                Contactez l&apos;administrateur pour plus d&apos;informations.
              </p>
            </div>
          </div>
        )}

        {activeTab === "home" && (
          <div className="space-y-5 animate-slide-up">
            {/* Online Toggle */}
            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-semibold text-lg">Statut de service</p>
                  <p className={`text-sm mt-1 ${isOnline ? "text-green-400" : "text-slate-400"}`}>
                    {isOnline ? "En ligne - Visible sur la carte" : "Hors ligne - Non visible"}
                  </p>
                </div>
                <button
                  onClick={toggleOnline}
                  disabled={driver?.status !== "active"}
                  className={`relative w-16 h-8 rounded-full transition-all ${
                    isOnline ? "bg-green-500" : "bg-slate-600"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      isOnline ? "translate-x-9" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {isOnline && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full status-online"></div>
                  <span className="text-green-400 text-sm">
                    {tracking ? "Position partagée en temps réel" : "En ligne"}
                  </span>
                </div>
              )}

              {currentLocation && (
                <MapComponent
                  markers={mapMarker}
                  center={currentLocation}
                  zoom={15}
                  className="h-40 rounded-2xl"
                />
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 text-center">
                <div className="text-2xl font-bold text-white">
                  {myReservations.filter((r) => r.status === "pending").length}
                </div>
                <p className="text-slate-400 text-xs mt-1">Nouvelles</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 text-center">
                <div className="text-2xl font-bold text-white">
                  {myReservations.filter((r) => r.status === "completed").length}
                </div>
                <p className="text-slate-400 text-xs mt-1">Terminées</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-bold text-lg">
                    {driver?.rating?.toFixed(1) || "0.0"}
                  </span>
                </div>
                <p className="text-slate-400 text-xs">Note ({driver?.totalRatings || 0})</p>
              </div>
            </div>

            {/* Pending Reservations */}
            {myReservations.filter((r) => r.status === "pending").length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-yellow-400" />
                  Nouvelles réservations
                </h3>
                <div className="space-y-3">
                  {myReservations
                    .filter((r) => r.status === "pending")
                    .map((res) => (
                      <div
                        key={res.id}
                        className="bg-slate-800 border border-yellow-500/30 rounded-2xl p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-white font-medium">{res.clientName}</p>
                            <a
                              href={`tel:${res.clientPhone}`}
                              className="flex items-center gap-1 text-green-400 text-sm"
                            >
                              <Phone className="w-3 h-3" />
                              {res.clientPhone}
                            </a>
                          </div>
                          <span className="text-yellow-400 text-xs bg-yellow-400/20 px-2 py-1 rounded-lg capitalize">
                            {res.type === "special" ? "Bus Spécial" : res.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300 mb-3">
                          <span className="text-green-400">●</span>
                          {res.startPoint}
                          <span className="text-slate-500">→</span>
                          <span className="text-red-400">●</span>
                          {res.endPoint}
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span>{res.passengerCount} passager(s)</span>
                            <span className="text-emerald-400 font-semibold">
                              {res.totalPrice?.toLocaleString()} Ar
                            </span>
                          </div>
                          <span className="text-slate-400 text-xs">
                            {new Date(res.reservationDate).toLocaleString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {res.notes && (
                          <p className="text-slate-400 text-xs italic mb-3">"{res.notes}"</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReservationStatus(res.id, "cancelled")}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-xl text-sm hover:bg-red-600/30 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Refuser
                          </button>
                          <button
                            onClick={() => handleReservationStatus(res.id, "confirmed")}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Accepter
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Messages from Admin */}
            {myMessages.filter((m) => m.toId === user?.uid && !m.isRead).length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  Messages de l&apos;administration
                </h3>
                <div className="space-y-2">
                  {myMessages
                    .filter((m) => m.toId === user?.uid)
                    .slice(0, 3)
                    .map((msg) => (
                      <div
                        key={msg.id}
                        className={`bg-slate-800 border rounded-xl p-3 ${
                          !msg.isRead ? "border-blue-500/40" : "border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400 text-xs">{msg.fromName}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              msg.type === "alert"
                                ? "bg-red-500/20 text-red-400"
                                : msg.type === "warning"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {msg.type}
                          </span>
                        </div>
                        <p className="text-white text-sm">{msg.content}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Mes avis (temps réel, avec réponses) */}
            {myReviews.length > 0 && (
              <div className="mt-6">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Mes avis ({myReviews.length})
                </h3>
                <div className="space-y-3">
                  {myReviews
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((rv) => (
                      <ReviewThread key={rv.id} review={rv} />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "reservations" && (
          <div className="space-y-3 animate-slide-up">
            <h2 className="text-white font-bold text-lg mb-4">Mes Réservations</h2>
            {myReservations.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Aucune réservation</p>
              </div>
            ) : (
              myReservations
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((res) => (
                  <div
                    key={res.id}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{res.clientName}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          res.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : res.status === "confirmed"
                            ? "bg-green-500/20 text-green-400"
                            : res.status === "completed"
                            ? "bg-slate-600 text-slate-300"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {res.status === "pending" ? "En attente" : res.status === "confirmed" ? "Confirmé" : res.status === "completed" ? "Terminé" : "Annulé"}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mb-2">
                      {res.startPoint} → {res.endPoint}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{res.passengerCount}p</span>
                        <span className="text-emerald-400">{res.totalPrice?.toLocaleString()} Ar</span>
                      </div>
                      {res.status === "confirmed" && (
                        <button
                          onClick={() => handleReservationStatus(res.id, "completed")}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Terminer
                        </button>
                      )}
                    </div>
                    <ReservationThread
                      resId={res.id}
                      mode="driver"
                      authorName={driver?.fullName || ""}
                      theme="dark"
                    />
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === "messages" && (
          <div className="space-y-3 animate-slide-up">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              Messages
              {unreadMessages.length > 0 && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {unreadMessages.length}
                </span>
              )}
            </h2>

            {/* Notifications (cliquables → onglet cible) */}
            {notifications.length > 0 && (
              <div className="mb-5">
                <h3 className="text-slate-400 text-sm mb-2 flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  Notifications
                </h3>
                {notifications
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationRead(notif.id);
                        const t = (notif as AppNotification & { target?: { tab?: string } }).target;
                        if (
                          t?.tab === "home" ||
                          t?.tab === "reservations" ||
                          t?.tab === "messages" ||
                          t?.tab === "settings"
                        ) {
                          setActiveTab(t.tab as typeof activeTab);
                        }
                      }}
                      className={`bg-slate-800 border rounded-xl p-3 mb-2 cursor-pointer ${
                        !notif.isRead ? "border-blue-500/40" : "border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {!notif.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                        <p className="text-white text-sm font-medium">{notif.title}</p>
                      </div>
                      <p className="text-slate-400 text-xs mt-1">{notif.body}</p>
                    </div>
                  ))}
              </div>
            )}

            {/* Conversation avec l'administration (temps réel, deux sens) */}
            <h3 className="text-slate-400 text-sm mb-2 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Conversation avec l'administration
            </h3>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 space-y-2 max-h-80 overflow-y-auto">
              {myMessages.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">Aucun message pour l'instant.</p>
              ) : (
                myMessages
                  .sort((a, b) => a.createdAt - b.createdAt)
                  .map((msg) => {
                    const fromMe = msg.fromId === user?.uid;
                    return (
                      <div key={msg.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-xl px-3 py-2 ${
                            fromMe ? "bg-[#06b6a4] text-[#0b2545]" : "bg-slate-700 text-white"
                          }`}
                        >
                          <div
                            className={`text-[10px] uppercase tracking-wider mb-0.5 ${
                              fromMe ? "text-[#0b2545]/70" : "text-slate-400"
                            }`}
                          >
                            {fromMe ? "Vous" : msg.fromName}
                          </div>
                          <p className="text-sm leading-snug">{msg.content}</p>
                          <div
                            className={`text-[10px] mt-1 ${
                              fromMe ? "text-[#0b2545]/60" : "text-slate-400"
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Réponse du chauffeur */}
            <div className="flex gap-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                placeholder="Répondre à l'administration…"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#06b6a4] resize-none"
              />
              <button
                onClick={sendReply}
                disabled={!replyText.trim()}
                className="self-stretch px-4 bg-[#06b6a4] text-[#0b2545] font-bold rounded-xl hover:bg-[#ffd60a] transition-colors disabled:opacity-40"
              >
                Envoyer
              </button>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="animate-slide-up">
            <h2 className="text-white font-bold text-lg mb-5">Paramètres</h2>
            <Link
              href="/driver/profile"
              className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-3 hover:bg-slate-750 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white font-medium">Modifier le profil</p>
                  <p className="text-slate-400 text-xs">Infos personnelles et véhicule</p>
                </div>
              </div>
              <span className="text-slate-600">›</span>
            </Link>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold">
                  {driver?.fullName?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-white font-medium">{driver?.fullName}</p>
                  <p className="text-slate-400 text-sm">{driver?.email || user?.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Téléphone</span>
                  <span className="text-white">{driver?.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Véhicule</span>
                  <span className="text-white">{driver?.vehicleNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Type</span>
                  <span className="text-white capitalize">{driver?.vehicleType}</span>
                </div>
                {driver?.lineNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Ligne</span>
                    <span className="text-white">{driver.lineNumber}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Spécial</span>
                  <span className={driver?.canDoSpecial ? "text-green-400" : "text-slate-500"}>
                    {driver?.canDoSpecial ? "Oui" : "Non"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Note</span>
                  <div className="flex items-center gap-1">
                    <StarRating rating={driver?.rating || 0} size="sm" />
                    <span className="text-white">{driver?.rating?.toFixed(1) || "0.0"}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-600/20 text-red-400 border border-red-600/30 rounded-xl font-medium hover:bg-red-600/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-40" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="max-w-xl mx-auto flex items-center justify-around px-2 py-2">
          {[
            { key: "home", label: "Accueil", icon: MapPin },
            { key: "reservations", label: "Réservations", icon: Calendar },
            { key: "messages", label: "Messages", icon: MessageSquare, badge: unreadNotifs.length + unreadMessages.length },
            { key: "settings", label: "Paramètres", icon: Settings },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key as typeof activeTab)}
              className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                activeTab === item.key
                  ? "text-blue-400 bg-blue-500/10"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{item.badge}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
