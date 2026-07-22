"use client";
import { useState, useEffect } from "react";
import {
  ref,
  onValue,
  off,
  set,
  push,
  update,
  remove,
  get,
  DataSnapshot,
} from "firebase/database";
import { database } from "./firebase";

const NOT_CONFIGURED = "Base de données Firebase non configurée (voir .env).";

// Generic hook to listen to a Firebase Realtime Database path
export function useFirebaseData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path || !database) {
      setLoading(false);
      return;
    }
    const dbRef = ref(database, path);
    const unsubscribe = onValue(
      dbRef,
      (snapshot: DataSnapshot) => {
        setData(snapshot.val() as T);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => off(dbRef, "value", unsubscribe);
  }, [path]);

  return { data, loading, error };
}

// Hook to listen to a list of items
export function useFirebaseList<T>(path: string | null) {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path || !database) {
      setLoading(false);
      return;
    }
    const dbRef = ref(database, path);
    const unsubscribe = onValue(
      dbRef,
      (snapshot: DataSnapshot) => {
        const val = snapshot.val();
        if (val) {
          const list = Object.entries(val).map(([id, item]) => ({
            id,
            ...(item as T),
          }));
          setData(list as (T & { id: string })[]);
        } else {
          setData([]);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => off(dbRef, "value", unsubscribe);
  }, [path]);

  return { data, loading, error };
}

// Firebase CRUD operations
export const firebaseOps = {
  async set(path: string, data: unknown) {
    if (!database) throw new Error(NOT_CONFIGURED);
    const dbRef = ref(database, path);
    await set(dbRef, { ...((data as object) || {}), updatedAt: Date.now() });
  },

  async push(path: string, data: unknown) {
    if (!database) throw new Error(NOT_CONFIGURED);
    const dbRef = ref(database, path);
    const newRef = push(dbRef);
    await set(newRef, {
      ...((data as object) || {}),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return newRef.key;
  },

  async update(path: string, data: unknown) {
    if (!database) throw new Error(NOT_CONFIGURED);
    const dbRef = ref(database, path);
    await update(dbRef, { ...((data as object) || {}), updatedAt: Date.now() });
  },

  async remove(path: string) {
    if (!database) throw new Error(NOT_CONFIGURED);
    const dbRef = ref(database, path);
    await remove(dbRef);
  },

  async get(path: string) {
    if (!database) return null;
    const dbRef = ref(database, path);
    const snapshot = await get(dbRef);
    return snapshot.val();
  },

  async getList<T>(path: string): Promise<(T & { id: string })[]> {
    if (!database) return [];
    const dbRef = ref(database, path);
    const snapshot = await get(dbRef);
    const val = snapshot.val();
    if (!val) return [];
    return Object.entries(val).map(([id, item]) => ({ id, ...(item as T) }));
  },
};
