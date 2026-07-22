// Server-side Firebase Admin SDK — firebase-admin v14 modular imports.
// The default `import admin from "firebase-admin"` no longer exposes `.credential`
// in v14, which caused: "Cannot read properties of undefined (reading 'cert')".
// We use the modular entrypoints instead.

import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getDatabase, type Database } from "firebase-admin/database";

let _app: App | null = null;

function getAppInstance(): App {
  if (_app) return _app;
  const existing = getApps();
  if (existing.length > 0) {
    _app = existing[0];
    return _app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || "transport-mahajanga";
  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL ||
    "firebase-adminsdk-fbsvc@transport-mahajanga.iam.gserviceaccount.com";
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || "";
  const privateKey = rawKey.replace(/\\n/g, "\n");

  if (!privateKey) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY is missing from environment. Cannot initialize Firebase Admin."
    );
  }

  _app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    databaseURL:
      process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
      "https://transport-mahajanga-default-rtdb.firebaseio.com",
  });
  return _app;
}

export function getAdmin(): App {
  return getAppInstance();
}

export function getAdminAuth(): Auth {
  return getAuth(getAppInstance());
}

export function getAdminDb(): Database {
  return getDatabase(getAppInstance());
}
