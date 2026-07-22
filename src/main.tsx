import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/auth-context";
import EnvCheck from "@/components/EnvCheck";
import ServiceWorkerCleanup from "@/components/ServiceWorkerCleanup";
import "@/index.css";

import Home from "@/pages/Home";
import AdminLogin from "@/pages/admin/login/page";
import AdminRegister from "@/pages/admin/register/page";
import AdminSetup from "@/pages/admin/setup/page";
import AdminDashboard from "@/pages/admin/dashboard/page";
import ClientLayout from "@/pages/client/layout";
import ClientHome from "@/pages/client/page";
import ClientMap from "@/pages/client/map/page";
import ClientSearch from "@/pages/client/search/page";
import ClientReservations from "@/pages/client/reservations/page";
import NewReservation from "@/pages/client/reservations/new/page";
import ClientReviews from "@/pages/client/reviews/page";
import DriverDetail from "@/pages/client/drivers/_id/page";
import RouteDetail from "@/pages/client/routes/_id/page";
import DriverLogin from "@/pages/driver/login/page";
import DriverRegister from "@/pages/driver/register/page";
import DriverDashboard from "@/pages/driver/dashboard/page";
import DriverProfile from "@/pages/driver/profile/page";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ServiceWorkerCleanup />
    <AuthProvider>
      <EnvCheck>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route path="/admin/setup" element={<AdminSetup />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            <Route path="/client" element={<ClientLayout />}>
              <Route index element={<ClientHome />} />
              <Route path="map" element={<ClientMap />} />
              <Route path="search" element={<ClientSearch />} />
              <Route path="reservations" element={<ClientReservations />} />
              <Route path="reservations/new" element={<NewReservation />} />
              <Route path="reviews" element={<ClientReviews />} />
              <Route path="drivers/:id" element={<DriverDetail />} />
              <Route path="routes/:id" element={<RouteDetail />} />
            </Route>

            <Route path="/driver/login" element={<DriverLogin />} />
            <Route path="/driver/register" element={<DriverRegister />} />
            <Route path="/driver/dashboard" element={<DriverDashboard />} />
            <Route path="/driver/profile" element={<DriverProfile />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4200,
              style: {
                background: "#0b2545",
                color: "#f4f6f8",
                borderRadius: 0,
                padding: "14px 18px",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                letterSpacing: "0.01em",
                borderLeft: "3px solid #ff3b30",
              },
              success: { iconTheme: { primary: "#06b6a4", secondary: "#f4f6f8" } },
              error: { iconTheme: { primary: "#ff3b30", secondary: "#f4f6f8" } },
            }}
          />
        </BrowserRouter>
      </EnvCheck>
    </AuthProvider>
  </StrictMode>
);
