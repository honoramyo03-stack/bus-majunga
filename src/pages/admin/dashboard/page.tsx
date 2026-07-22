"use client";
import { useState, useEffect } from "react";
import { useRouter } from "@/lib/router";
import { Link } from "@/lib/router";
import {
  Bus,
  Car,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Settings,
  LogOut,
  Navigation,
  Star,
  Phone,
  Send,
  TrendingUp,
  Plus,
  Eye,
  Shield,
  Calendar,
  Bell,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useFirebaseList, useFirebaseData, firebaseOps } from "@/lib/firebase-hooks";
import type { Driver, Route, Reservation, Review, Message } from "@/lib/types";
import { MAHAJANGA_CENTER } from "@/lib/types";
import MapComponent from "@/components/MapComponent";
import StarRating from "@/components/StarRating";
import ReviewThread from "@/components/ReviewThread";
import ImageUpload from "@/components/ImageUpload";
import SpecialTiersEditor from "@/components/SpecialTiersEditor";
import MarqueeStudio from "@/components/MarqueeStudio";
import { byLine } from "@/lib/line";
import toast from "react-hot-toast";

const dfInp =
  "w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAdmin, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "drivers" | "routes" | "reservations" | "messages" | "reviews" | "map">("dashboard");
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [messageForm, setMessageForm] = useState({ content: "", type: "info" as "info" | "warning" | "alert" });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [reviewForm, setReviewForm] = useState({ clientName: "", rating: 5, comment: "", driverId: "" });
  const [addingRoute, setAddingRoute] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverForm, setDriverForm] = useState({
    fullName: "", phone: "", vehicleType: "taxi" as "bus" | "taxi",
    vehicleNumber: "", vehicleBrand: "", vehicleColor: "",
    lineNumber: "", route: "", canDoSpecial: false,
    status: "active" as "active" | "inactive" | "pending" | "suspended",
    specialTiers: [] as { minSeats: number; price: number }[],
    imageUrl: "", vehicleImageUrl: "",
  });
  const [routeForm, setRouteForm] = useState({
    name: "", lineNumber: "", type: "bus" as "bus" | "taxi",
    startPoint: "", endPoint: "", price: 0, distance: 0,
    estimatedTime: 0, color: "#3B82F6", schedule: "", waypoints: "",
    specialTiers: [] as { minSeats: number; price: number }[],
  });

  const { data: drivers } = useFirebaseList<Driver>("drivers");
  const { data: routes } = useFirebaseList<Route>("routes");
  const { data: reservations } = useFirebaseList<Reservation>("reservations");
  const { data: reviews } = useFirebaseList<Review>("reviews");
  const { data: messages } = useFirebaseList<Message>("messages");
  const { data: settings } = useFirebaseData<{ taxiPrice?: number; specialPrice?: number } | null>("settings/general");

  useEffect(() => {
    // On ne redirige que si l'utilisateur n'est pas authentifié. Un admin
    // connecté dont le profil temps réel n'est pas encore arrivé reste sur la
    // page (le `return null` ci-dessous gère l'affichage), ce qui évite toute
    // boucle de redirection lors des mises à jour live du statut.
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  const activeDrivers = drivers.filter((d) => d.status === "active");
  const onlineDrivers = drivers.filter((d) => d.isOnline);
  const pendingDrivers = drivers.filter((d) => d.status === "pending");
  const busDrivers = drivers.filter((d) => d.vehicleType === "bus" && d.status === "active");
  const taxiDrivers = drivers.filter((d) => d.vehicleType === "taxi" && d.status === "active");
  const pendingReservations = reservations.filter((r) => r.status === "pending");

  const handleDriverStatus = async (driverId: string, status: "active" | "suspended" | "inactive") => {
    await firebaseOps.update(`drivers/${driverId}`, { status });
    const d = drivers.find((x) => x.id === driverId);
    const label = status === "active" ? "réactivé" : status === "suspended" ? "suspendu" : "désactivé";
    // Notification temps réel au chauffeur (cible l'onglet Accueil, où l'effet
    // de suspension/réactivation est également appliqué instantanément).
    await firebaseOps.push(`notifications/${driverId}`, {
      title:
        status === "active"
          ? "Compte réactivé"
          : status === "suspended"
          ? "Compte suspendu"
          : "Compte désactivé",
      body:
        status === "active"
          ? "Votre compte a été réactivé. Vous pouvez repasser en ligne."
          : `Votre compte a été ${label} par l'administration.`,
      type: "status",
      isRead: false,
      target: { tab: "home" },
    });
    toast.success(`Statut de ${d?.fullName || driverId} : ${label}`);
  };

  const handleSendMessage = async () => {
    if (!selectedDriver || !messageForm.content.trim()) {
      toast.error("Sélectionnez un chauffeur et écrivez un message");
      return;
    }
    setSendingMessage(true);
    try {
      const driver = drivers.find((d) => d.id === selectedDriver);
      await firebaseOps.push("messages", {
        fromId: "admin",
        toId: selectedDriver,
        fromName: "Administration",
        toName: driver?.fullName || "Chauffeur",
        content: messageForm.content,
        type: messageForm.type,
        isRead: false,
      });
      await firebaseOps.push(`notifications/${selectedDriver}`, {
        title: "Message de l'administration",
        body: messageForm.content,
        type: "message",
        isRead: false,
        target: { tab: "messages" },
      });
      toast.success("Message envoyé !");
      setMessageForm({ content: "", type: "info" });
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.driverId || !reviewForm.clientName || !reviewForm.comment) {
      toast.error("Remplissez tous les champs");
      return;
    }
    try {
      const driver = drivers.find((d) => d.id === reviewForm.driverId);
      await firebaseOps.push("reviews", {
        clientName: reviewForm.clientName,
        driverId: reviewForm.driverId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        type: driver?.vehicleType || "taxi",
      });
      const newTotal = (driver?.totalRatings || 0) + 1;
      const newRating = ((driver?.rating || 0) * (driver?.totalRatings || 0) + reviewForm.rating) / newTotal;
      await firebaseOps.update(`drivers/${reviewForm.driverId}`, {
        rating: parseFloat(newRating.toFixed(2)),
        totalRatings: newTotal,
      });
      toast.success("Avis ajouté !");
      setReviewForm({ clientName: "", rating: 5, comment: "", driverId: "" });
    } catch {
      toast.error("Erreur lors de l'ajout de l'avis");
    }
  };

  const handleSaveRoute = async () => {
    if (!routeForm.name || !routeForm.startPoint || !routeForm.endPoint) {
      toast.error("Remplissez les champs obligatoires");
      return;
    }
    try {
      const schedule = routeForm.schedule.split(",").map((s) => s.trim()).filter(Boolean);
      const waypoints = routeForm.waypoints.split(",").map((w) => w.trim()).filter(Boolean);
      const specialTiers = (routeForm.specialTiers || [])
        .filter((t) => t.minSeats > 0 && t.price >= 0)
        .sort((a, b) => a.minSeats - b.minSeats);
      const payload = {
        name: routeForm.name,
        lineNumber: routeForm.lineNumber,
        type: routeForm.type,
        startPoint: routeForm.startPoint,
        endPoint: routeForm.endPoint,
        price: Number(routeForm.price),
        distance: Number(routeForm.distance),
        estimatedTime: Number(routeForm.estimatedTime),
        color: routeForm.color,
        schedule,
        waypoints,
        specialTiers,
        coordinates: [],
      };
      if (editingRouteId) {
        await firebaseOps.update(`routes/${editingRouteId}`, payload);
        toast.success("Ligne modifiée !");
      } else {
        await firebaseOps.push("routes", payload);
        toast.success("Ligne ajoutée !");
      }
      setAddingRoute(false);
      setEditingRouteId(null);
      setRouteForm({ name: "", lineNumber: "", type: "bus", startPoint: "", endPoint: "", price: 0, distance: 0, estimatedTime: 0, color: "#3B82F6", schedule: "", waypoints: "", specialTiers: [] });
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const startEditRoute = (r: Route) => {
    setRouteForm({
      name: r.name, lineNumber: r.lineNumber, type: r.type,
      startPoint: r.startPoint, endPoint: r.endPoint,
      price: r.price, distance: r.distance, estimatedTime: r.estimatedTime,
      color: r.color || "#3B82F6", schedule: (r.schedule || []).join(", "),
      waypoints: (r.waypoints || []).join(", "),
      specialTiers: r.specialTiers || [],
    });
    setEditingRouteId(r.id);
    setAddingRoute(true);
  };

  const startEditDriver = (d: Driver) => {
    setDriverForm({
      fullName: d.fullName, phone: d.phone, vehicleType: d.vehicleType,
      vehicleNumber: d.vehicleNumber, vehicleBrand: d.vehicleBrand || "",
      vehicleColor: d.vehicleColor || "", lineNumber: d.lineNumber || "",
      route: d.route || "", canDoSpecial: d.canDoSpecial, status: d.status,
      specialTiers: d.specialTiers || [],
      imageUrl: d.imageUrl || "", vehicleImageUrl: d.vehicleImageUrl || "",
    });
    setEditingDriver(d);
  };

  const saveDriver = async () => {
    if (!editingDriver) return;
    if (!driverForm.fullName || !driverForm.phone || !driverForm.vehicleNumber) {
      toast.error("Nom, téléphone et n° de véhicule obligatoires");
      return;
    }
    try {
      await firebaseOps.update(`drivers/${editingDriver.id}`, {
        fullName: driverForm.fullName,
        phone: driverForm.phone,
        vehicleType: driverForm.vehicleType,
        vehicleNumber: driverForm.vehicleNumber.toUpperCase(),
        vehicleBrand: driverForm.vehicleBrand,
        vehicleColor: driverForm.vehicleColor,
        lineNumber: driverForm.lineNumber,
        route: driverForm.route,
        canDoSpecial: driverForm.canDoSpecial,
        specialTiers: driverForm.canDoSpecial
          ? (driverForm.specialTiers || []).filter((t) => t.minSeats > 0 && t.price >= 0).sort((a, b) => a.minSeats - b.minSeats)
          : [],
        status: driverForm.status,
        imageUrl: driverForm.imageUrl || null,
        vehicleImageUrl: driverForm.vehicleImageUrl || null,
      });
      toast.success(`Chauffeur modifié : ${driverForm.fullName}`);
      setEditingDriver(null);
    } catch {
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm("Supprimer cette ligne ?")) return;
    await firebaseOps.remove(`routes/${routeId}`);
    toast.success("Ligne supprimée");
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (
      !confirm(
        "Supprimer ce chauffeur et ses données liées (réservations, avis, messages, position) ?\n\nLe compte de connexion doit être retiré manuellement dans Firebase → Authentication si besoin."
      )
    )
      return;
    const d = drivers.find((x) => x.id === driverId);
    await firebaseOps.remove(`drivers/${driverId}`).catch(() => {});
    reservations
      .filter((r) => r.driverId === driverId)
      .forEach((r) => firebaseOps.remove(`reservations/${r.id}`).catch(() => {}));
    reviews
      .filter((r) => r.driverId === driverId)
      .forEach((r) => firebaseOps.remove(`reviews/${r.id}`).catch(() => {}));
    messages
      .filter((m) => m.fromId === driverId || m.toId === driverId)
      .forEach((m) => firebaseOps.remove(`messages/${m.id}`).catch(() => {}));
    await firebaseOps.remove(`notifications/${driverId}`).catch(() => {});
    await firebaseOps.remove(`locations/${driverId}`).catch(() => {});
    toast.success(`Chauffeur supprimé : ${d?.fullName || driverId}`);
  };

  const handleDeleteReservation = async (id: string) => {
    if (!confirm("Supprimer cette réservation ?")) return;
    await firebaseOps.remove(`reservations/${id}`);
    toast.success("Réservation supprimée");
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Supprimer cet avis et ses réponses ?")) return;
    await firebaseOps.remove(`reviews/${id}`);
    toast.success("Avis supprimé");
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Supprimer ce message ?")) return;
    await firebaseOps.remove(`messages/${id}`);
    toast.success("Message supprimé");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const mapMarkers = onlineDrivers
    .filter((d) => d.currentLocation)
    .map((driver) => ({
      id: driver.id,
      lat: driver.currentLocation!.lat,
      lng: driver.currentLocation!.lng,
      type: driver.vehicleType as "bus" | "taxi",
      label: driver.vehicleType === "bus" ? driver.lineNumber || "B" : "T",
      popup: `<div style="padding:8px"><b>${driver.fullName}</b><br><small>${driver.vehicleNumber}</small><br><a href="tel:${driver.phone}">${driver.phone}</a></div>`,
      color: driver.vehicleType === "bus" ? "#3B82F6" : "#10B981",
    }));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-500/30 border-t-red-500 rounded-full spinner" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white bg-grid-dark">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 z-50 hidden md:flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Administration</p>
              <p className="text-slate-400 text-xs">TransMahajanga</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { key: "dashboard", label: "Tableau de bord", icon: TrendingUp },
            { key: "map", label: "Carte en direct", icon: MapPin, badge: onlineDrivers.length },
            { key: "drivers", label: "Chauffeurs", icon: Users, badge: pendingDrivers.length },
            { key: "routes", label: "Lignes / Trajets", icon: Navigation },
            { key: "reservations", label: "Réservations", icon: Calendar, badge: pendingReservations.length },
            { key: "messages", label: "Messages", icon: MessageSquare },
            { key: "reviews", label: "Avis", icon: Star },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key as typeof activeTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                activeTab === item.key
                  ? "bg-red-600/20 text-red-400 border border-red-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 px-4 pb-3 pt-[calc(0.75rem_+_env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">Admin</span>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-400">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
          {([
            ["dashboard", "Tableau"],
            ["map", "Carte"],
            ["drivers", "Chauff."],
            ["routes", "Lignes"],
            ["reservations", "Résas"],
            ["messages", "Msgs"],
            ["reviews", "Avis"],
            ["delete", "Suppr."],
          ] as const).map(([tab, lbl]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 pt-28 md:pt-10 p-4 md:p-8 lg:p-10">
        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Tableau de bord</h1>
              <p className="text-slate-400">Vue d&apos;ensemble du service TransMahajanga</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Bus actifs", value: busDrivers.length, icon: Bus, color: "blue", sub: "sur " + drivers.filter(d => d.vehicleType === "bus").length + " total" },
                { label: "Taxis actifs", value: taxiDrivers.length, icon: Car, color: "emerald", sub: "sur " + drivers.filter(d => d.vehicleType === "taxi").length + " total" },
                { label: "En ligne", value: onlineDrivers.length, icon: Navigation, color: "green", sub: "en ce moment" },
                { label: "En attente", value: pendingDrivers.length, icon: AlertCircle, color: "yellow", sub: "à valider" },
                { label: "Lignes bus", value: routes.filter(r => r.type === "bus").length, icon: MapPin, color: "violet", sub: "lignes actives" },
                { label: "Réservations", value: reservations.length, icon: Calendar, color: "orange", sub: pendingReservations.length + " en attente" },
                { label: "Total avis", value: reviews.length, icon: Star, color: "yellow", sub: "notes globales" },
                { label: "Messages", value: messages.length, icon: MessageSquare, color: "pink", sub: "échanges" },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                  <div className={`w-10 h-10 bg-${stat.color}-500/20 rounded-xl flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                  <p className="text-slate-500 text-xs mt-1">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Tarifs (prix enregistrés par l'admin) */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Tarifs par défaut (Ariary)
                </h3>
                <span className="text-slate-500 text-xs">appliqués aux réservations</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Prix taxi (par passager)</label>
                  <input
                    type="number"
                    key={`tx-${settings?.taxiPrice ?? "d"}`}
                    defaultValue={settings?.taxiPrice ?? 5000}
                    onBlur={(e) => firebaseOps.update("settings/general", { taxiPrice: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 tabular-nums"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-400 text-xs mb-1 block">Tarifs bus spécial selon le nombre de personnes</label>
                  <input
                    type="text"
                    key={`spt-${JSON.stringify((settings as any)?.specialTiers || [])}`}
                    defaultValue={(((settings as any)?.specialTiers || []) as { minSeats: number; price: number }[])
                      .map((t) => `${t.minSeats}:${t.price}`)
                      .join(", ")}
                    onBlur={(e) => {
                      const tiers = e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((s) => {
                          const [m, p] = s.split(":").map((x) => Number(x.trim()));
                          return { minSeats: m || 0, price: p || 0 };
                        })
                        .filter((t) => t.minSeats > 0 && t.price >= 0)
                        .sort((a, b) => a.minSeats - b.minSeats);
                      firebaseOps.update("settings/general", { specialTiers: tiers });
                    }}
                    placeholder="ex : 4:12000, 8:10000  (personnes:prix, séparés par virgule)"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="text-slate-500 text-[11px] mt-1">
                    Format « personnes:prix » par palier. Le prix spécial s'applique dès que le nombre de personnes atteint un palier ; sinon le prix par défaut ci-contre.
                  </p>
                </div>
              </div>
              <p className="text-slate-500 text-xs mt-2">
                Le prix d'une réservation de bus régulier = tarif de la ligne (défini dans « Lignes / Trajets »).
              </p>
            </div>

            {/* Phrase défilante de l'entête client (studio) */}
            <MarqueeStudio
              key={`mqs-${JSON.stringify({
                t: (settings as any)?.headerMarquee ?? "",
                c: (settings as any)?.headerMarqueeColor ?? "",
                bg: (settings as any)?.headerMarqueeBg ?? "",
                sp: (settings as any)?.headerMarqueeSpeed ?? "",
                sz: (settings as any)?.headerMarqueeSize ?? "",
                w: (settings as any)?.headerMarqueeWeight ?? "",
              })}`}
              initial={{
                text: (settings as any)?.headerMarquee ?? "",
                color: (settings as any)?.headerMarqueeColor ?? "",
                bg: (settings as any)?.headerMarqueeBg ?? "",
                speed: String((settings as any)?.headerMarqueeSpeed ?? ""),
                size: String((settings as any)?.headerMarqueeSize ?? ""),
                weight: String((settings as any)?.headerMarqueeWeight ?? ""),
              }}
            />

            {/* Online drivers map preview */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full status-online"></div>
                  Véhicules en ligne ({onlineDrivers.length})
                </h3>
                <button
                  onClick={() => setActiveTab("map")}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Voir la carte →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {onlineDrivers.slice(0, 6).map((driver) => (
                  <div key={driver.id} className="flex items-center gap-3 bg-slate-700 rounded-xl p-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold ${driver.vehicleType === "bus" ? "bg-blue-500" : "bg-emerald-500"}`}>
                      {driver.vehicleType === "bus" ? driver.lineNumber || "B" : "T"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{driver.fullName}</p>
                      <p className="text-slate-400 text-xs">{driver.vehicleNumber}</p>
                    </div>
                    <a href={`tel:${driver.phone}`} className="text-green-400 hover:text-green-300">
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Drivers */}
            {pendingDrivers.length > 0 && (
              <div className="bg-slate-800 border border-yellow-500/30 rounded-2xl p-4 mb-6">
                <h3 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Chauffeurs en attente de validation ({pendingDrivers.length})
                </h3>
                <div className="space-y-2">
                  {pendingDrivers.map((driver) => (
                    <div key={driver.id} className="flex items-center gap-3 bg-slate-700 rounded-xl p-3">
                      <div className="w-9 h-9 bg-yellow-500/20 rounded-lg flex items-center justify-center text-yellow-400 font-bold text-sm">
                        {driver.fullName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{driver.fullName}</p>
                        <p className="text-slate-400 text-xs">{driver.vehicleNumber} • {driver.phone}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleDriverStatus(driver.id, "active")}
                          className="p-1.5 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDriverStatus(driver.id, "inactive")}
                          className="p-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Reservations */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Réservations récentes</h3>
                <button onClick={() => setActiveTab("reservations")} className="text-sm text-blue-400">
                  Voir tout →
                </button>
              </div>
              <div className="space-y-2">
                {reservations.slice(0, 5).map((res) => {
                  const driver = drivers.find((d) => d.id === res.driverId);
                  return (
                    <div key={res.id} className="flex items-center gap-3 bg-slate-700 rounded-xl p-3">
                      <div className="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        {res.type === "taxi" ? <Car className="w-4 h-4 text-blue-400" /> : <Bus className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{res.clientName}</p>
                        <p className="text-slate-400 text-xs">{res.startPoint} → {res.endPoint}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        res.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                        res.status === "confirmed" ? "bg-green-500/20 text-green-400" :
                        res.status === "completed" ? "bg-slate-600 text-slate-300" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {res.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Zone de suppression granulaire */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                <h2 className="text-white font-bold text-lg">Supprimer des éléments</h2>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Suppression individuelle. Pour vider une collection entière d'un coup, utilisez{" "}
                <Link href="/admin/setup" className="text-blue-400 underline">Maintenance</Link>.
              </p>
              {[
                {
                  title: `Chauffeurs (${drivers.length})`,
                  rows: drivers.map((d) => ({ id: d.id, label: `${d.fullName} — ${d.vehicleNumber} (${d.status})` })),
                  del: (id: string) => handleDeleteDriver(id),
                },
                {
                  title: `Lignes (${routes.length})`,
                  rows: routes.map((r) => ({ id: r.id, label: `${r.lineNumber || r.type} — ${r.name}` })),
                  del: (id: string) => handleDeleteRoute(id),
                },
                {
                  title: `Réservations (${reservations.length})`,
                  rows: reservations.map((r) => ({ id: r.id, label: `${r.clientName} — ${r.startPoint} → ${r.endPoint} (${r.status})` })),
                  del: (id: string) => handleDeleteReservation(id),
                },
                {
                  title: `Avis (${reviews.length})`,
                  rows: reviews.map((rv) => ({ id: rv.id, label: `${rv.clientName} → ${drivers.find((d) => d.id === rv.driverId)?.fullName || "?"} ★${rv.rating}` })),
                  del: (id: string) => handleDeleteReview(id),
                },
                {
                  title: `Messages (${messages.length})`,
                  rows: messages.map((m) => ({ id: m.id, label: `${m.fromName} → ${m.toName} : ${m.content.slice(0, 40)}` })),
                  del: (id: string) => handleDeleteMessage(id),
                },
              ].map((sec) => (
                <div key={sec.title} className="mb-5">
                  <h3 className="font-semibold text-white text-sm mb-2">{sec.title}</h3>
                  {sec.rows.length === 0 ? (
                    <p className="text-slate-500 text-sm">—</p>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {sec.rows.map((row) => (
                        <div key={row.id} className="flex items-center justify-between gap-3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                          <span className="text-slate-300 text-sm truncate">{row.label}</span>
                          <button
                            onClick={() => sec.del(row.id)}
                            className="flex-shrink-0 p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Map */}
        {activeTab === "map" && (
          <div className="animate-fade-in">
            <div className="mb-5">
              <h1 className="text-2xl font-bold">Carte en direct</h1>
              <p className="text-slate-400">{onlineDrivers.length} véhicule(s) en ligne</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden mb-5">
              <MapComponent
                markers={mapMarkers}
                center={MAHAJANGA_CENTER}
                zoom={12}
                className="h-[500px]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {onlineDrivers.map((driver) => (
                <div key={driver.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${driver.vehicleType === "bus" ? "bg-blue-500" : "bg-emerald-500"}`}>
                    {driver.vehicleType === "bus" ? driver.lineNumber || "B" : "T"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{driver.fullName}</p>
                    <p className="text-slate-400 text-sm">{driver.vehicleNumber}</p>
                    {driver.currentLocation?.speed !== undefined && (
                      <p className="text-slate-500 text-xs">{Math.round(driver.currentLocation.speed)} km/h</p>
                    )}
                  </div>
                  <a href={`tel:${driver.phone}`} className="flex items-center gap-1.5 bg-green-600/20 text-green-400 border border-green-600/30 px-3 py-2 rounded-xl text-sm hover:bg-green-600/30 transition-colors">
                    <Phone className="w-4 h-4" />
                    Appeler
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drivers Management */}
        {activeTab === "drivers" && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-red-400 mb-2">§ chauffeurs</div>
              <div className="flex items-end justify-between flex-wrap gap-3">
                <h1 className="text-3xl font-display font-black tracking-tight">Gestion des chauffeurs</h1>
                <span className="font-mono text-xs text-slate-400 tabular-nums">
                  {drivers.length} inscrit(s) · {pendingDrivers.length} en attente
                </span>
              </div>
              <div className="mt-3 h-[3px] w-16 bg-red-500" />
            </div>

            {editingDriver && (
              <div className="bg-slate-800 border border-blue-500/30 rounded-2xl p-5 mb-5 animate-slide-up">
                <h3 className="font-semibold text-white mb-4">Modifier le chauffeur</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Nom complet *</label>
                    <input value={driverForm.fullName} onChange={(e) => setDriverForm((f) => ({ ...f, fullName: e.target.value }))} className={dfInp} />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Téléphone *</label>
                    <input value={driverForm.phone} onChange={(e) => setDriverForm((f) => ({ ...f, phone: e.target.value }))} className={dfInp + " font-mono"} />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Type</label>
                    <select value={driverForm.vehicleType} onChange={(e) => setDriverForm((f) => ({ ...f, vehicleType: e.target.value as "bus" | "taxi" }))} className={dfInp}>
                      <option value="taxi">Taxi</option>
                      <option value="bus">Bus</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">N° véhicule *</label>
                    <input value={driverForm.vehicleNumber} onChange={(e) => setDriverForm((f) => ({ ...f, vehicleNumber: e.target.value.toUpperCase() }))} className={dfInp + " font-mono uppercase"} />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Marque</label>
                    <input value={driverForm.vehicleBrand} onChange={(e) => setDriverForm((f) => ({ ...f, vehicleBrand: e.target.value }))} className={dfInp} />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Couleur</label>
                    <input value={driverForm.vehicleColor} onChange={(e) => setDriverForm((f) => ({ ...f, vehicleColor: e.target.value }))} className={dfInp} />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Ligne (bus)</label>
                    <input value={driverForm.lineNumber} onChange={(e) => setDriverForm((f) => ({ ...f, lineNumber: e.target.value }))} className={dfInp + " font-mono"} />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Trajet / zone</label>
                    <input value={driverForm.route} onChange={(e) => setDriverForm((f) => ({ ...f, route: e.target.value }))} className={dfInp} />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Statut</label>
                    <select value={driverForm.status} onChange={(e) => setDriverForm((f) => ({ ...f, status: e.target.value as "active" | "inactive" | "pending" | "suspended" }))} className={dfInp}>
                      <option value="pending">En attente</option>
                      <option value="active">Actif</option>
                      <option value="suspended">Suspendu</option>
                      <option value="inactive">Inactif</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Photo profil</label>
                    <ImageUpload
                      value={driverForm.imageUrl}
                      onChange={(u) => setDriverForm((f) => ({ ...f, imageUrl: u }))}
                      label="Photo de profil"
                      pathPrefix={`profiles/${editingDriver?.id || "admin-edit"}`}
                      theme="dark"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-slate-400 text-xs mb-1 block">Photo véhicule</label>
                    <ImageUpload
                      value={driverForm.vehicleImageUrl}
                      onChange={(u) => setDriverForm((f) => ({ ...f, vehicleImageUrl: u }))}
                      label="Photo du véhicule"
                      pathPrefix={`profiles/${editingDriver?.id || "admin-edit"}`}
                      theme="dark"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 mb-3 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={driverForm.canDoSpecial} onChange={(e) => setDriverForm((f) => ({ ...f, canDoSpecial: e.target.checked }))} className="accent-blue-500 w-4 h-4" />
                  Trajets spéciaux
                </label>
                {driverForm.canDoSpecial && (
                  <div className="mb-3">
                    <SpecialTiersEditor
                      value={driverForm.specialTiers}
                      onChange={(v) => setDriverForm((f) => ({ ...f, specialTiers: v }))}
                      theme="dark"
                      hint="Appliqué aux réservations « bus / taxi spécial » selon le nombre de personnes."
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setEditingDriver(null)} className="flex-1 py-2 border border-slate-600 text-slate-400 rounded-xl text-sm hover:bg-slate-700 transition-colors">Annuler</button>
                  <button onClick={saveDriver} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors">Enregistrer</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {drivers
                .sort((a, b) => {
                  const order = { pending: 0, active: 1, suspended: 2, inactive: 3 };
                  return (order[a.status] || 3) - (order[b.status] || 3);
                })
                .map((driver) => (
                  <div key={driver.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        {driver.imageUrl ? (
                          <img src={driver.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover" />
                        ) : (
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold ${driver.vehicleType === "bus" ? "bg-blue-500" : "bg-emerald-500"}`}>
                            {driver.fullName.charAt(0)}
                          </div>
                        )}
                        {driver.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800 status-online"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div>
                            <p className="font-semibold text-white">{driver.fullName}</p>
                            <p className="text-slate-400 text-sm">{driver.vehicleNumber}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            driver.status === "active" ? "bg-green-500/20 text-green-400" :
                            driver.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                            driver.status === "suspended" ? "bg-red-500/20 text-red-400" :
                            "bg-slate-600 text-slate-400"
                          }`}>
                            {driver.status === "active" ? "Actif" : driver.status === "pending" ? "En attente" : driver.status === "suspended" ? "Suspendu" : "Inactif"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
                          <span>{driver.vehicleType === "bus" ? `Bus Ligne ${driver.lineNumber}` : "Taxi"}</span>
                          <span>•</span>
                          <span>{driver.phone}</span>
                          {driver.canDoSpecial && <span className="text-violet-400">• Spécial</span>}
                        </div>

                        <div className="flex items-center gap-1 mt-1">
                          <StarRating rating={driver.rating || 0} size="sm" />
                          <span className="text-slate-400 text-xs">({driver.totalRatings || 0})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-700">
                      <a href={`tel:${driver.phone}`} className="flex items-center gap-1.5 text-xs bg-green-600/20 text-green-400 border border-green-600/30 px-3 py-1.5 rounded-lg hover:bg-green-600/30 transition-colors">
                        <Phone className="w-3 h-3" />
                        Appeler
                      </a>
                      <button
                        onClick={() => startEditDriver(driver)}
                        className="flex items-center gap-1.5 text-xs bg-blue-600/20 text-blue-300 border border-blue-600/30 px-3 py-1.5 rounded-lg hover:bg-blue-600/30 transition-colors"
                      >
                        <Settings className="w-3 h-3" />
                        Modifier
                      </button>
                      <button
                        onClick={() => { setSelectedDriver(driver.id); setActiveTab("messages"); }}
                        className="flex items-center gap-1.5 text-xs bg-blue-600/20 text-blue-400 border border-blue-600/30 px-3 py-1.5 rounded-lg hover:bg-blue-600/30 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Message
                      </button>
                      {driver.status === "pending" && (
                        <button onClick={() => handleDriverStatus(driver.id, "active")}
                          className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors">
                          <CheckCircle className="w-3 h-3" />
                          Valider
                        </button>
                      )}
                      {driver.status === "active" && (
                        <button onClick={() => handleDriverStatus(driver.id, "suspended")}
                          className="flex items-center gap-1.5 text-xs bg-red-600/20 text-red-400 border border-red-600/30 px-3 py-1.5 rounded-lg hover:bg-red-600/30 transition-colors">
                          <XCircle className="w-3 h-3" />
                          Suspendre
                        </button>
                      )}
                      {driver.status === "suspended" && (
                        <button onClick={() => handleDriverStatus(driver.id, "active")}
                          className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                          <CheckCircle className="w-3 h-3" />
                          Réactiver
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Routes Management */}
        {activeTab === "routes" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-2xl font-bold">Lignes et Trajets</h1>
                <p className="text-slate-400">{routes.length} ligne(s) configurée(s)</p>
              </div>
              <button
                onClick={() => {
                  setEditingRouteId(null);
                  setRouteForm({ name: "", lineNumber: "", type: "bus", startPoint: "", endPoint: "", price: 0, distance: 0, estimatedTime: 0, color: "#3B82F6", schedule: "", waypoints: "", specialTiers: [] });
                  setAddingRoute(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            {addingRoute && (
              <div className="bg-slate-800 border border-blue-500/30 rounded-2xl p-5 mb-5 animate-slide-up">
                <h3 className="font-semibold text-white mb-4">{editingRouteId ? "Modifier la ligne / trajet" : "Nouvelle ligne / trajet"}</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Nom *</label>
                    <input value={routeForm.name} onChange={(e) => setRouteForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" placeholder="Centre → Mahavoky" />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Numéro ligne</label>
                    <input value={routeForm.lineNumber} onChange={(e) => setRouteForm(f => ({ ...f, lineNumber: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" placeholder="L1" />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Type</label>
                    <select value={routeForm.type} onChange={(e) => setRouteForm(f => ({ ...f, type: e.target.value as "bus" | "taxi" }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500">
                      <option value="bus">Bus</option>
                      <option value="taxi">Taxi</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Couleur</label>
                    <input type="color" value={routeForm.color} onChange={(e) => setRouteForm(f => ({ ...f, color: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-slate-600 bg-slate-700 cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Départ *</label>
                    <input value={routeForm.startPoint} onChange={(e) => setRouteForm(f => ({ ...f, startPoint: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" placeholder="Centre-ville" />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Destination *</label>
                    <input value={routeForm.endPoint} onChange={(e) => setRouteForm(f => ({ ...f, endPoint: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" placeholder="Mahavoky" />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Prix normal / passager (Ar)</label>
                    <input type="number" value={routeForm.price} onChange={(e) => setRouteForm(f => ({ ...f, price: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 tabular-nums" />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Distance (km)</label>
                    <input type="number" value={routeForm.distance} onChange={(e) => setRouteForm(f => ({ ...f, distance: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 tabular-nums" />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Durée (min)</label>
                    <input type="number" value={routeForm.estimatedTime} onChange={(e) => setRouteForm(f => ({ ...f, estimatedTime: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 tabular-nums" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-slate-400 text-xs mb-1 block">Horaires (séparés par virgule)</label>
                  <input value={routeForm.schedule} onChange={(e) => setRouteForm(f => ({ ...f, schedule: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="06:00, 07:30, 09:00, 11:00, 13:00, 15:00, 17:00" />
                </div>
                <div className="mb-4">
                  <label className="text-slate-400 text-xs mb-1 block">Arrêts intermédiaires (séparés par virgule)</label>
                  <input value={routeForm.waypoints} onChange={(e) => setRouteForm(f => ({ ...f, waypoints: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Marché Be, Université, Hôpital" />
                </div>

                {/* Tarifs spéciaux selon le nombre de places */}
                <div className="mb-4 border border-slate-700 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <label className="text-slate-300 text-xs font-semibold">Tarifs spéciaux selon le nombre de places</label>
                    <button
                      type="button"
                      onClick={() => setRouteForm(f => ({ ...f, specialTiers: [...(f.specialTiers || []), { minSeats: 4, price: Math.round(Number(f.price) * 0.8) || 0 }] }))}
                      className="text-xs text-blue-300 hover:text-blue-200 flex-shrink-0"
                    >
                      + ajouter un palier
                    </button>
                  </div>
                  <p className="text-slate-500 text-[11px] mb-2">
                    Dès qu'une réservation atteint un palier, le prix spécial remplace le prix normal par passager.
                  </p>
                  {(routeForm.specialTiers || []).length === 0 ? (
                    <p className="text-slate-600 text-xs">Aucun palier — le prix normal s'applique toujours.</p>
                  ) : (
                    <div className="space-y-2">
                      {(routeForm.specialTiers || []).map((t, i) => (
                        <div key={i} className="flex items-center gap-2 flex-wrap">
                          <span className="text-slate-400 text-xs">dès</span>
                          <input
                            type="number"
                            value={t.minSeats}
                            onChange={(e) => setRouteForm(f => { const st = [...(f.specialTiers || [])]; st[i] = { ...st[i], minSeats: Number(e.target.value) }; return { ...f, specialTiers: st }; })}
                            className="w-20 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm tabular-nums focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-slate-400 text-xs">places →</span>
                          <input
                            type="number"
                            value={t.price}
                            onChange={(e) => setRouteForm(f => { const st = [...(f.specialTiers || [])]; st[i] = { ...st[i], price: Number(e.target.value) }; return { ...f, specialTiers: st }; })}
                            className="w-24 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm tabular-nums focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-slate-400 text-xs">Ar / passager</span>
                          <button
                            type="button"
                            onClick={() => setRouteForm(f => ({ ...f, specialTiers: (f.specialTiers || []).filter((_, j) => j !== i) }))}
                            className="ml-auto p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"
                            title="Retirer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { setAddingRoute(false); setEditingRouteId(null); }} className="flex-1 py-2 border border-slate-600 text-slate-400 rounded-xl text-sm hover:bg-slate-700 transition-colors">Annuler</button>
                  <button onClick={handleSaveRoute} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors">{editingRouteId ? "Enregistrer les modifications" : "Ajouter la ligne"}</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {routes.slice().sort(byLine).map((route) => (
                <div key={route.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: route.color || "#3B82F6" }}>
                      {route.lineNumber || route.type === "bus" ? "B" : "T"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{route.name}</p>
                      <p className="text-slate-400 text-sm">{route.startPoint} → {route.endPoint}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs text-emerald-400 tabular-nums">{route.price?.toLocaleString()} Ar</span>
                        {route.distance ? <span className="text-xs text-slate-500 tabular-nums">{route.distance} km</span> : null}
                        {route.estimatedTime ? <span className="text-xs text-slate-500 tabular-nums">{route.estimatedTime} min</span> : null}
                      </div>
                      {(route.specialTiers || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(route.specialTiers || []).map((t, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 tabular-nums">
                              ≥{t.minSeats} pl. → {t.price.toLocaleString()} Ar
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button onClick={() => startEditRoute(route)} className="p-2 text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors" title="Modifier">
                        <Settings className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteRoute(route.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Supprimer">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {route.schedule && route.schedule.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <div className="flex flex-wrap gap-1">
                        {route.schedule.slice(0, 6).map((t, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-lg text-slate-300" style={{ backgroundColor: `${route.color || "#3B82F6"}30` }}>{t}</span>
                        ))}
                        {route.schedule.length > 6 && <span className="text-xs text-slate-500">+{route.schedule.length - 6}</span>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reservations */}
        {activeTab === "reservations" && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-red-400 mb-2">§ réservations</div>
              <div className="flex items-end justify-between flex-wrap gap-3">
                <h1 className="text-3xl font-display font-black tracking-tight">Toutes les réservations</h1>
                <span className="font-mono text-xs text-slate-400 tabular-nums">
                  {reservations.length} au total · {pendingReservations.length} en attente
                </span>
              </div>
              <div className="mt-3 h-[3px] w-16 bg-red-500" />
            </div>

            {reservations.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-slate-700 rounded-2xl">
                <Calendar className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-white font-medium">Aucune réservation</p>
                <p className="text-slate-400 text-sm mt-1 max-w-sm">
                  Les réservations des clients apparaîtront ici en temps réel dès qu'un client réserve un trajet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reservations
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((res) => {
                    const driver = drivers.find((d) => d.id === res.driverId);
                    const meta =
                      res.status === "pending"
                        ? { label: "En attente", bar: "border-l-yellow-500", pill: "bg-yellow-500/20 text-yellow-400" }
                        : res.status === "confirmed"
                        ? { label: "Confirmé", bar: "border-l-green-500", pill: "bg-green-500/20 text-green-400" }
                        : res.status === "completed"
                        ? { label: "Terminé", bar: "border-l-slate-500", pill: "bg-slate-600 text-slate-300" }
                        : { label: "Annulé", bar: "border-l-red-500", pill: "bg-red-500/20 text-red-400" };
                    return (
                      <div
                        key={res.id}
                        className={`group bg-slate-800/70 hover:bg-slate-800 border border-slate-700 border-l-4 ${meta.bar} rounded-xl p-4 transition-all hover:translate-x-1`}
                      >
                        <div className="flex items-start justify-between mb-2 gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate">{res.clientName}</p>
                            <a href={`tel:${res.clientPhone}`} className="text-green-400 text-sm hover:underline">
                              {res.clientPhone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs px-2 py-1 rounded-full ${meta.pill}`}>{meta.label}</span>
                            <button
                              onClick={() => handleDeleteReservation(res.id)}
                              className="p-1.5 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="truncate">{res.startPoint}</span>
                          <span className="text-slate-500">→</span>
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="truncate">{res.endPoint}</span>
                          <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-500">
                            {res.type === "special" ? "spécial" : res.type} · {res.passengerCount}p
                          </span>
                        </div>
                        {driver && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>Chauffeur : {driver.fullName}</span>
                            <span>•</span>
                            <a href={`tel:${driver.phone}`} className="text-green-400 hover:underline">
                              {driver.phone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/60">
                          <span className="text-emerald-400 font-semibold text-sm tabular-nums">
                            {res.totalPrice?.toLocaleString()} Ar
                          </span>
                          <span className="text-slate-500 text-xs">
                            {new Date(res.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {activeTab === "messages" && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-5">Envoyer un message privé</h1>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-6">
              <h3 className="font-semibold text-white mb-4">Nouveau message</h3>

              <div className="mb-3">
                <label className="text-slate-400 text-sm mb-1 block">Destinataire</label>
                <select
                  value={selectedDriver || ""}
                  onChange={(e) => setSelectedDriver(e.target.value || null)}
                  className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Choisir un chauffeur...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.fullName} ({d.vehicleNumber})</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="text-slate-400 text-sm mb-1 block">Type de message</label>
                <div className="flex gap-2">
                  {(["info", "warning", "alert"] as const).map((t) => (
                    <button key={t} onClick={() => setMessageForm(f => ({ ...f, type: t }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                        messageForm.type === t
                          ? t === "info" ? "bg-blue-600 text-white" : t === "warning" ? "bg-yellow-600 text-white" : "bg-red-600 text-white"
                          : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-slate-400 text-sm mb-1 block">Message</label>
                <textarea
                  value={messageForm.content}
                  onChange={(e) => setMessageForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Écrivez votre message ici..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !selectedDriver || !messageForm.content}
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {sendingMessage ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Envoyer le message
              </button>
            </div>

            {/* Message History */}
            <h3 className="font-semibold text-white mb-3">Historique des messages</h3>
            <div className="space-y-2">
              {messages.sort((a, b) => b.createdAt - a.createdAt).map((msg) => (
                <div key={msg.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400 text-xs">→ {msg.toName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      msg.type === "alert" ? "bg-red-500/20 text-red-400" :
                      msg.type === "warning" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-blue-500/20 text-blue-400"
                    }`}>{msg.type}</span>
                  </div>
                  <p className="text-white text-sm">{msg.content}</p>
                  <p className="text-slate-500 text-xs mt-1">{new Date(msg.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {activeTab === "reviews" && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-5">Avis & Notes</h1>

            {/* Add Review */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-6">
              <h3 className="font-semibold text-white mb-4">Ajouter un avis (admin)</h3>
              <div className="space-y-3">
                <select value={reviewForm.driverId} onChange={(e) => setReviewForm(f => ({ ...f, driverId: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Choisir un chauffeur...</option>
                  {drivers.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                </select>
                <input value={reviewForm.clientName} onChange={(e) => setReviewForm(f => ({ ...f, clientName: e.target.value }))}
                  placeholder="Nom du client" className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500" />
                <div>
                  <p className="text-slate-400 text-sm mb-2">Note</p>
                  <StarRating rating={reviewForm.rating} size="lg" interactive onChange={(r) => setReviewForm(f => ({ ...f, rating: r }))} />
                </div>
                <textarea value={reviewForm.comment} onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="Commentaire..." rows={3}
                  className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
                <button onClick={handleSubmitReview} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                  Publier l&apos;avis
                </button>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-3">
              {reviews.sort((a, b) => b.createdAt - a.createdAt).map((review) => {
                const driver = drivers.find((d) => d.id === review.driverId);
                return (
                  <ReviewThread key={review.id} review={review} driverName={driver?.fullName} />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
