import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Variables exposées au bundle client. On conserve les noms NEXT_PUBLIC_*
// du code existant en les injectant via `define` (remplacement à la
// compilation), ce qui évite de réécrire tous les composants. Toute clé
// absente du .env est remplacée par "" (jamais laissée comme référence
// `process.env.*` non résolue, ce qui provoquerait une ReferenceError).
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const define: Record<string, string> = {};
  for (const k of CLIENT_ENV_KEYS) {
    define[`process.env.${k}`] = JSON.stringify(env[k] ?? "");
  }
  return {
    plugins: [react()],
    define,
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
    server: {
      port: 5173,
      proxy: { "/api": { target: "http://localhost:3000", changeOrigin: true } },
    },
    build: { outDir: "dist", emptyOutDir: true },
  };
});
