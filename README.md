# TransMahajanga

Plateforme de gestion et de suivi en temps réel des **bus et taxis de Mahajanga**.

## Stack

- **Frontend** : React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router v7
- **Backend** : Node.js + Express (API REST)
- **Données / temps réel** : Firebase (Authentication + Realtime Database)

> Il n'y a **aucune dépendance à Next.js dans le code source** : pas de dossier
> `app/`, pas de `next.config`, pas d'import `next/*`, pas de routing serveur.
> Le routing est 100 % client (React Router) et le serveur est un Express
> standard (`server/index.js`).

## Organisation

```
index.html                 # point d'entrée Vite (SPA)
vite.config.ts             # config Vite (alias @, proxy /api, define env)
server/index.js            # serveur Node + Express (API + static SPA)
public/                    # assets statiques (favicon)
src/
  main.tsx                 # montage React + arbre de routes React Router
  index.css                # styles globaux + Tailwind
  lib/
    router.tsx             # couche d'abstraction routing (React Router)
    firebase.ts            # singletons Firebase (null-safe si .env absent)
    firebase-hooks.ts      # hooks Realtime Database
    auth-context.tsx       # contexte d'authentification
    auth-errors.ts         # traductions d'erreurs Firebase
  server/                  # logique métier Node réutilisable (services)
  components/              # composants React partagés
  pages/                   # composants de page (Home, admin/*, client/*, driver/*)
```

## Pré-requis

1. Node.js 18+
2. Un projet Firebase avec **Authentication (Email/Password)** activé et une
   **Realtime Database** créée.
3. Un fichier `.env` à la racine (voir `.env.example`) :

   ```bash
   cp .env.example .env
   ```

   Si une variable `NEXT_PUBLIC_FIREBASE_*` manque, l'app affiche un écran de
   diagnostic (composant `EnvCheck`) au lieu d'envoyer des requêtes invalides.

## Commandes

```bash
npm install

# Développement : Express (API, :3000) + Vite (frontend, :5173) en parallèle.
# Ouvrez http://localhost:5173  (Vite proxy /api → Express).
npm run dev

# Production : build Vite puis serveur Express qui sert le build + l'API.
npm run build
npm start          # → http://localhost:3000  (PORT surchargeable)
```

## Variables d'environnement

| Variable | Utilisée par | Rôle |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | client (Vite) | config Firebase SDK |
| `ADMIN_EMAIL` / `NEXT_PUBLIC_ADMIN_EMAIL` | serveur / client | email admin de référence |
| `ADMIN_SIGNUP_CODE` | serveur | si défini, code exigé à l'inscription admin |

Côté **client**, Vite lit le `.env` et injecte les `NEXT_PUBLIC_*` à la
compilation via `define` (voir `vite.config.ts`), ce qui permet au code de
continuer d'utiliser `process.env.NEXT_PUBLIC_*` sans modification.

Côté **serveur**, `server/index.js` charge le `.env` via `dotenv`.

## Migration terminée

Le projet a été migré depuis Next.js. Le paquet `next` (et `eslint-config-next`)
peut encore figurer dans `node_modules` comme dépendance **inutilisée** ; vous
pouvez le retirer proprement avec npm (qui met à jour le lockfile) :

```bash
npm uninstall next eslint-config-next
```

(Cette commande n'est pas exécutée automatiquement afin de ne pas casser un
éventuel runner de preview externe qui s'attendrait encore à Next.)
