import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import http from "node:http";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Variables exposées au bundle client (noms NEXT_PUBLIC_* conservés via define).
const CLIENT_ENV_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_DATABASE_URL",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
  "NEXT_PUBLIC_ADMIN_EMAIL",
];

// Proxy /api manuel vers le serveur Express : lit le port réel dans .dev-api-port
// (l'API a pu prendre un port de repli sous Windows). Robuste au EACCES/occupé.
function apiProxyPlugin() {
  return {
    name: "transmahajanga-api-proxy",
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (!req.url || !req.url.startsWith("/api")) return next();
        let port = 3000;
        try {
          const p = fs.readFileSync(path.resolve(process.cwd(), ".dev-api-port"), "utf8").trim();
          if (/^\d+$/.test(p)) port = Number(p);
        } catch {
          /* .dev-api-port absent → port par défaut */
        }
        const opts = {
          hostname: "127.0.0.1",
          port,
          path: req.url,
          method: req.method,
          headers: { ...req.headers, host: `127.0.0.1:${port}` },
        };
        const preq = http.request(opts, (pres) => {
          res.writeHead(pres.statusCode || 502, pres.headers);
          pres.pipe(res);
        });
        preq.on("error", (e: any) => {
          res.statusCode = 502;
          res.setHeader("content-type", "text/plain; charset=utf-8");
          res.end(`API indisponible sur 127.0.0.1:${port} (${e.code || e.message})`);
        });
        req.pipe(preq);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const define: Record<string, string> = {};
  for (const k of CLIENT_ENV_KEYS) {
    define[`process.env.${k}`] = JSON.stringify(env[k] ?? "");
  }
  return {
    plugins: [react(), apiProxyPlugin()],
    define,
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
    server: {
      // IPv4 explicite (contourne le EACCES sur ::1 sous Windows). Port surchargeable
      // via WEB_PORT. strictPort:false → port suivant si occupé (EADDRINUSE).
      host: "127.0.0.1",
      port: Number(process.env.WEB_PORT) || 5173,
      strictPort: false,
    },
    build: { outDir: "dist", emptyOutDir: true },
  };
});
