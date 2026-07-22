# Lancer TransMahajanga en local (Windows)

## Démarrage normal

```powershell
npm install
npm run dev
```

- Frontend (Vite) : `http://127.0.0.1:5173` (ouvre l'URL affichée par Vite)
- API (Express) : `http://localhost:3000`

Le serveur Express **essaie automatiquement les ports suivants** si le port demandé
est occupé ou réservé, et Vite lit ce port réel via `.dev-api-port` (le proxy `/api`
suit donc toujours l'API, quel que soit le port pris).

---

## Si vous voyez `EACCES: permission denied ...:5173` ou `...:3000`

C'est le cas le plus fréquent sous Windows : **Hyper-V / WSL / NAT réservent des
plages de ports** qui incluent 3000 et 5173 → Windows refuse toute écoute dessus
(`EACCES`), même en administrateur. Le code gère déjà le repli pour l'API, mais Vite
ne sait pas replier sur `EACCES` : il faut donc libérer les ports **ou** en choisir
d'autres.

### Solution 1 (recommandée) — libérer les ports une fois pour toutes

Ouvrez **PowerShell en tant qu'administrateur** puis :

```powershell
net stop winnat
netsh int ipv4 add excludedportrange protocol=tcp startport=3000 numberofports=10
netsh int ipv4 add excludedportrange protocol=tcp startport=5173 numberofports=10
net start winnat
```

Cela réserve ces ports **pour vous** (hors de la plage que Hyper-V s'approprie au
démarrage). Ensuite `npm run dev` fonctionne avec les ports par défaut.

> Astuce : parfois un simple `net stop winnat` puis `net start winnat` suffit
> (cela remélange les plages réservées et libère 3000/5173).

Pour voir les plages actuellement réservées :

```powershell
netsh interface ipv4 show excludedportrange protocol=tcp
```

### Solution 2 — choisir des ports libres (sans toucher à Windows)

Choisissez deux ports **hors** des plages réservées (voir commande ci-dessus),
par ex. `4310` et `4320`, puis :

```powershell
$env:PORT="4310"; $env:WEB_PORT="4320"; npm run dev
```

- `PORT` → port de l'API Express (repli automatique activé en dev si occupé)
- `WEB_PORT` → port de Vite

Ouvrez l'URL que Vite affiche (`http://127.0.0.1:<WEB_PORT>`).

---

## Build de production (local)

```powershell
npm run build      # Vite build → dossier dist/
npm run start      # Express sert dist/ + l'API sur $PORT (défaut 3000)
```

## Application installable (PWA)

Une fois l'app ouverte dans le navigateur :

- **Android / Chrome / Edge desktop** : une bannière « Installer TransMahajanga »
  apparaît, ou icône d'installation dans la barre d'adresse.
- **iOS / Safari** : bouton *Partager* → *Sur l'écran d'accueil*.

L'app s'ouvre alors en plein écran (mode standalone) avec icône et splash, comme
une application native, et la coquille reste accessible hors ligne.
