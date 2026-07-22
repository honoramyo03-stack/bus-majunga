// Configuration serveur en Node.js pur (aucune dépendance à Next.js).
// Lit les variables d'environnement et expose une structure typée.

export interface ServerConfig {
  adminEmail: string;
  adminSignupCode: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

export function getServerConfig(): ServerConfig {
  const env = process.env;
  return {
    adminEmail: env.ADMIN_EMAIL || env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@mahajanga-transport.mg",
    adminSignupCode: (env.ADMIN_SIGNUP_CODE || "").trim(),
    firebase: {
      apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
      authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
      databaseURL: env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "",
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
      storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    },
  };
}
