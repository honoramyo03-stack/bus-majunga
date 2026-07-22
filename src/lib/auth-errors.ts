// Traduction en français lisible des codes d'erreur Firebase Auth + Realtime DB.
// Utilisé par /admin/register, /driver/register, /admin/login, /driver/login.

const MAP: Array<[string, string]> = [
  // Firebase Auth
  ["auth/email-already-in-use", "Cet email est déjà associé à un compte (admin ou chauffeur). Connectez-vous ou utilisez un autre email."],
  ["auth/weak-password", "Mot de passe trop faible. Minimum 6 caractères."],
  ["auth/invalid-email", "Le format de l'email n'est pas valide."],
  ["auth/missing-email", "L'email est requis."],
  ["auth/operation-not-allowed", "Le provider Email/Password n'est pas activé. Dans la console Firebase → Authentication → Sign-in method, activez Email/Password."],
  ["auth/network-request-failed", "Impossible de joindre Firebase. Vérifiez votre connexion internet."],
  ["auth/too-many-requests", "Trop de tentatives. Patientez quelques minutes avant de réessayer."],
  ["auth/invalid-credential", "Identifiants invalides."],
  ["auth/invalid-login-credentials", "Identifiants invalides."],
  ["auth/wrong-password", "Mot de passe incorrect."],
  ["auth/user-not-found", "Aucun compte avec cet email."],
  ["auth/user-disabled", "Ce compte a été désactivé. Contactez l'administration."],
  ["auth/invalid-api-key", "La clé API Firebase est invalide ou absente. Vérifiez les variables NEXT_PUBLIC_FIREBASE_* côté serveur."],
  ["auth/app-deleted", "L'application Firebase n'est plus accessible. Vérifiez la configuration du projet."],
  ["auth/internal-error", "Erreur interne Firebase. Réessayez dans un instant."],
  // Realtime Database / réseau
  ["permission_denied", "Permission refusée sur la Realtime Database. Vérifiez les règles dans la console Firebase."],
  ["PERMISSION_DENIED", "Permission refusée sur la Realtime Database."],
  ["Could not parse", "La Realtime Database Firebase n'est pas joignable. Créez-la dans la console Firebase (Realtime Database → Créer la base)."],
  ["CLIENT_OFFLINE", "Client Firebase hors ligne. Vérifiez votre connexion."],
  ["ENOTFOUND", "Résolution DNS impossible. Vérifiez votre connexion."],
  ["ETIMEDOUT", "Délai de connexion dépassé. Réessayez."],
  ["Firebase", "Erreur Firebase. Vérifiez que Authentication (Email/Password) et Realtime Database sont activés dans la console Firebase du projet transport-mahajanga."],
];

export function friendlyAuthError(msg: string | undefined | null): string {
  const m = (msg || "").toString();
  for (const [k, v] of MAP) if (m.includes(k)) return v;
  return "Opération impossible. Réessayez, ou contactez l'équipe si le problème persiste.";
}

// Détecte une erreur liée à la base de données (par opposition à Auth).
export function isDatabaseError(msg: string | undefined | null): boolean {
  const m = (msg || "").toString();
  return (
    m.includes("permission_denied") ||
    m.includes("PERMISSION_DENIED") ||
    m.includes("Could not parse") ||
    m.includes("CLIENT_OFFLINE") ||
    m.includes("DATABASE_ERROR") ||
    m.includes("fb.com") ||
    m.includes("firebaseio.com")
  );
}
