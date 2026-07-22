"use strict";
// Serveur Node + Express (API + service du build en production).
// En dev, si le port demandé est réservé/occupé (fréquent sous Windows à cause
// des plages exclues par Hyper-V/NAT → EACCES), on essaie automatiquement les
// ports suivants et on écrit le port réel dans .dev-api-port (lu par le proxy
// Vite). En production on écoute exactement le port demandé.
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
  if (code !== expected) return res.status(403).json({ ok: false, error: "Code d'accès invalide." });
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
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api/")) {
      res.sendFile(path.join(distDir, "index.html"));
    } else {
      next();
    }
  });
} else {
  console.log("[server] dist/ absent → mode API uniquement. Lancez `npm run dev` (Vite) pour le frontend.");
}

// ----------------------- Écoute (avec repli en dev) ------------------------
const BASE_PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const canFallback = process.env.npm_lifecycle_event === "dev";

function tryListen(port, attempt) {
  const server = app.listen(port, HOST, () => {
    console.log(`[server] TransMahajanga (Node + Express) → http://localhost:${port}`);
    try {
      fs.writeFileSync(path.resolve(process.cwd(), ".dev-api-port"), String(port));
    } catch {
      /* non bloquant */
    }
  });
  server.on("error", (err) => {
    if ((err.code === "EADDRINUSE" || err.code === "EACCES") && canFallback && attempt < 40) {
      console.warn(`[server] port ${port} indisponible (${err.code}) → essai ${port + 1}…`);
      tryListen(port + 1, attempt + 1);
    } else if (err.code === "EADDRINUSE") {
      console.error(`[server] Le port ${port} est déjà utilisé. Relancez avec un port libre, ex : $env:PORT="4000"; npm run dev`);
      process.exit(1);
    } else if (err.code === "EACCES") {
      console.error(
        `[server] Permission refusée sur le port ${port} (plage réservée par Windows/Hyper-V).\n` +
          `           → Solution 1 (recommandée, PowerShell en admin) : libérer les ports, voir README.\n` +
          `           → Solution 2 : choisir un port libre : $env:PORT="<port>"; $env:WEB_PORT="<port>"; npm run dev`
      );
      process.exit(1);
    } else {
      console.error("[server] erreur d'écoute :", err);
      process.exit(1);
    }
  });
}

tryListen(BASE_PORT, 0);
