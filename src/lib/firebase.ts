"use client";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirestore, type Firestore } from "firebase/firestore";

// Les services Firebase ne sont initialisés QUE si la config est complète.
// getAuth() / getDatabase() lèvent une erreur synchrone si la clé API ou
// l'URL est invalide, ce qui cassait le prerendering Next.js quand le .env
// est absent. En gardant les singletons à null dans ce cas, le module se
// charge sans erreur et l'écran <EnvCheck/> prend la main côté client.
const raw = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const hasFirebaseConfig = Boolean(
  raw.apiKey && raw.authDomain && raw.projectId && raw.databaseURL && raw.appId
);

const app = hasFirebaseConfig
  ? getApps().length === 0
    ? initializeApp(raw)
    : getApp()
  : null;

export const database: Database | null = app ? getDatabase(app) : null;
export const auth: Auth | null = app ? getAuth(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;
export const firestore: Firestore | null = app ? getFirestore(app) : null;

export { app };
