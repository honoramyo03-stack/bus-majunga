"use strict";
// ===========================================================================
//  TransMahajanga — serveur Node.js + Express (SANS Next.js).
// ===========================================================================
//  - Sert l'API  : /api/health, /api/verify-admin-code, /api/init-demo
//  - Sert le frontend React buildé (dossier dist/) en production, avec
//    fallback SPA pour que le routing client (react-router) fonctionne.
//  - En développement, ce serveur ne sert que l'API ; le frontend tourne via
//    `vite` (port 5173) qui proxy /api vers ce serveur (port 3000).
// ===========================================================================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------- API (Node.js pur) ----------------------------
const expectedCode = () => (process.env.ADMIN_SIGNUP_CODE || "").trim();

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    runtime: "node + express",
    service: "TransMahajanga",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.get("/api/verify-admin-code", (_req, res) => {
  res.json({ required: expectedCode().length > 0 });
});

app.post("/api/verify-admin-code", (req, res) => {
  const expected = expectedCode();
  if (!expected) return res.json({ ok: true, skipped: true });
  const code = String((req.body && req.body.code) || "").trim().toUpperCase();
  if (!code) return res.status(400).json({ ok: false, error: "Code manquant." });
  if (code !== expected.toUpperCase())
    return res.status(403).json({ ok: false, error: "Code d'accès invalide." });
  return res.json({ ok: true });
});

app.get("/api/init-demo", (_req, res) => {
  res.json({
    message: "TransMahajanga Demo Data",
    instructions: "Use /admin/setup to seed routes and drivers.",
    busLines: [
      { number: "L1", name: "Centre-ville → Mahavoky", price: 1000 },
      { number: "L2", name: "Centre-ville → Amborovy", price: 1500 },
      { number: "L3", name: "Centre-ville → Mangarivotra", price: 2000 },
      { number: "L4", name: "Marché Be → Université", price: 1000 },
      { number: "L5", name: "Centre-ville → Aéroport", price: 3000 },
      { number: "L6", name: "Port → Tsaramandroso", price: 1500 },
    ],
  });
});

// ----------------------- Static SPA (production) ---------------------------
const distDir = path.join(__dirname, "..", "dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  // Fallback SPA : toute requête GET qui n'est pas l'API renvoie index.html,
  // laissant react-router résoudre la route côté client.
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api/")) {
      res.sendFile(path.join(distDir, "index.html"));
    } else {
      next();
    }
  });
} else {
  console.log(
    "[server] dist/ absent → mode API uniquement. Lancez `npm run dev` (Vite) pour le frontend."
  );
}

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`[server] TransMahajanga (Node + Express) → http://localhost:${PORT}`);
});
