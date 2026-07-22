"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { auth, database, hasFirebaseConfig } from "./firebase";
import type { Driver } from "./types";

interface AdminProfile {
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt: number;
}

interface AuthContextType {
  user: User | null;
  driver: Driver | null;
  adminProfile: AdminProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  driver: null,
  adminProfile: null,
  isAdmin: false,
  loading: true,
  signIn: async () => {
    throw new Error("Auth not ready");
  },
  signUp: async () => {
    throw new Error("Auth not ready");
  },
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1) État d'authentification. Tant qu'on ne l'a pas reçu, `loading` reste
  //    true → aucun redirect prématuré côté dashboards.
  useEffect(() => {
    if (!hasFirebaseConfig || !auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setDriver(null);
        setAdminProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
      // si u != null, `loading` reste true jusqu'à ce que les listeners de
      // profil (effet 2) aient émis une première fois.
    });
    return () => unsub();
  }, []);

  // 2) Profils en TEMPS RÉEL : onValue sur drivers/{uid} et admins/{uid}.
  //    Toute modification admin (suspension, réactivation, édition…) se
  //    propage instantanément au client du chauffeur / de l'admin.
  useEffect(() => {
    if (!user || !hasFirebaseConfig || !database) return;
    let done = 0;
    const finish = () => {
      done += 1;
      if (done >= 2) setLoading(false);
    };
    const unsubDriver = onValue(
      ref(database, `drivers/${user.uid}`),
      (snap) => {
        const d = snap.val();
        setDriver(d ? ({ id: user.uid, ...d } as Driver) : null);
        finish();
      },
      () => finish()
    );
    const unsubAdmin = onValue(
      ref(database, `admins/${user.uid}`),
      (snap) => {
        const a = snap.val();
        if (a) {
          setAdminProfile({ id: user.uid, ...a } as unknown as AdminProfile);
          setIsAdmin(true);
          setDriver(null);
        } else {
          setAdminProfile(null);
          setIsAdmin(false);
        }
        finish();
      },
      () => finish()
    );
    return () => {
      unsubDriver();
      unsubAdmin();
    };
  }, [user]);

  const signIn = async (email: string, password: string): Promise<User> => {
    if (!auth) throw new Error("Configuration Firebase manquante (voir .env).");
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<User> => {
    if (!auth) throw new Error("Configuration Firebase manquante (voir .env).");
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    return result.user;
  };

  const logout = async () => {
    if (user && driver) {
      await firebaseOpsUpdateOffline(user.uid);
    }
    if (auth) await signOut(auth);
    setUser(null);
    setDriver(null);
    setAdminProfile(null);
    setIsAdmin(false);
  };

  // `refresh` conservé pour compatibilité ; les profils étant en temps réel,
  // il n'a plus rien à faire.
  const refresh = async () => {};

  return (
    <AuthContext.Provider
      value={{ user, driver, adminProfile, isAdmin, loading, signIn, signUp, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Mise hors ligne au logout (écriture directe, sans dépendre de firebaseOps
// pour éviter une dépendance circulaire).
async function firebaseOpsUpdateOffline(uid: string) {
  const { database: db } = await import("./firebase");
  if (!db) return;
  const { ref, update } = await import("firebase/database");
  await update(ref(db, `drivers/${uid}`), { isOnline: false }).catch(() => {});
}

export const useAuth = () => useContext(AuthContext);
