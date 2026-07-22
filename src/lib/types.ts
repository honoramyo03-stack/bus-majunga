export type VehicleType = "bus" | "taxi";
export type DriverStatus = "active" | "inactive" | "pending" | "suspended";
export type TripStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type MessageType = "info" | "warning" | "alert";

export interface Driver {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  vehicleColor?: string;
  vehicleBrand?: string;
  lineNumber?: string;
  route?: string;
  canDoSpecial: boolean;
  // Tarifs spéciaux du chauffeur (trajets spéciaux) selon le nombre de personnes.
  specialTiers?: { minSeats: number; price: number }[];
  imageUrl?: string;
  vehicleImageUrl?: string;
  status: DriverStatus;
  rating: number;
  totalRatings: number;
  createdAt: number;
  updatedAt: number;
  currentLocation?: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    timestamp: number;
  };
  isOnline: boolean;
  fcmToken?: string;
}

export interface Route {
  id: string;
  name: string;
  lineNumber: string;
  type: VehicleType;
  startPoint: string;
  endPoint: string;
  waypoints: string[];
  price: number;
  distance: number;
  estimatedTime: number;
  schedule: string[];
  color: string;
  coordinates: { lat: number; lng: number }[];
  // Tarifs spéciaux selon le nombre de places : le palier applicable est celui
  // dont `minSeats` est le plus grand tout en restant <= au nombre de passagers.
  specialTiers?: { minSeats: number; price: number }[];
  createdAt: number;
  updatedAt: number;
}

export interface Trip {
  id: string;
  driverId: string;
  routeId?: string;
  type: VehicleType;
  status: TripStatus;
  startPoint: string;
  endPoint: string;
  departureTime: number;
  arrivalTime?: number;
  price: number;
  passengerCount: number;
  maxPassengers: number;
  createdAt: number;
  updatedAt: number;
}

export interface Reservation {
  id: string;
  clientName: string;
  clientPhone: string;
  driverId: string;
  tripId?: string;
  routeId?: string;
  type: VehicleType | "special";
  status: ReservationStatus;
  startPoint: string;
  endPoint: string;
  reservationDate: number;
  passengerCount: number;
  totalPrice: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Review {
  id: string;
  clientName: string;
  driverId: string;
  rating: number;
  comment: string;
  type: VehicleType;
  createdAt: number;
}

export interface ReviewReply {
  id: string;
  authorName: string;
  authorRole: "admin" | "driver" | "client";
  authorId?: string | null;
  content: string;
  createdAt: number;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  content: string;
  type: MessageType;
  isRead: boolean;
  createdAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "reservation" | "message" | "alert" | "info" | "status";
  isRead: boolean;
  // Cible de navigation quand on clique sur la notification.
  target?: { tab: string; id?: string };
  createdAt: number;
}

export interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp: number;
  isOnline: boolean;
}

// Centre géographique de Mahajanga (paramètre d'affichage de la carte,
// pas une donnée métier pré-remplie).
export const MAHAJANGA_CENTER = { lat: -15.7167, lng: 46.3167 };
