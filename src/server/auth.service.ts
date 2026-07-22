// Service d'authentification / accès admin en Node.js pur.
// Aucune dépendance à Next.js. Utilisable depuis une route Next, un serveur
// Express, un worker, etc.

import { getServerConfig } from "./config";

export interface VerifyResult {
  ok: boolean;
  error?: string;
  skipped?: boolean;
}

export function isAdminCodeRequired(): boolean {
  return getServerConfig().adminSignupCode.length > 0;
}

export function verifyAdminCode(code: unknown): VerifyResult {
  const expected = getServerConfig().adminSignupCode;
  if (!expected) return { ok: true, skipped: true };
  const c = typeof code === "string" ? code.trim().toUpperCase() : "";
  if (!c) return { ok: false, error: "Code manquant." };
  if (c !== expected.toUpperCase()) return { ok: false, error: "Code d'accès invalide." };
  return { ok: true };
}
