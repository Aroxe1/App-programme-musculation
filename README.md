# NextRep

PWA de suivi de musculation — programmes, séances, rangs par groupe musculaire, nutrition.
Stack : vanilla JS (ES modules) + Firebase (Auth + Firestore) + Service Worker.

## Arborescence

```
/
├── index.html                  Entry point
├── manifest.webmanifest        Manifest PWA
├── sw.js                       Service Worker (doit rester à la racine)
├── version.json                Version courante (auto-update)
├── firebase.json               Config Hosting
├── .firebaserc                 Lien projet Firebase
├── serve.ps1                   Serveur HTTP local pour dev
│
├── /src
│   ├── /js
│   │   ├── app.js              Entrée applicative, routing, vues
│   │   ├── auth.js             Wrapper Firebase Auth + Firestore
│   │   ├── ranks.js            Système de rangs + groupes musculaires
│   │   ├── body-paths.js       Silhouettes SVG (front + back)
│   │   └── firebase-config.js  Clés Firebase (à remplir, voir docs/)
│   └── /css
│       └── styles.css          Design system « Aurora Performance »
│
├── /assets
│   ├── logo_app.png
│   ├── icon.svg                (legacy)
│   ├── /fonts                  Gloock, Bricolage, GeistMono
│   └── /rank-logos             10 logos de rang (bronze → dieu-grec)
│
└── /docs
    ├── DEPLOY.md
    └── FIREBASE-SETUP.md
```

## Développement local

```powershell
.\serve.ps1
# → http://localhost:8080
```

## Déploiement

Voir [`docs/DEPLOY.md`](docs/DEPLOY.md).

```powershell
firebase deploy --only hosting
```

## Versionning à chaque release

Bump simultanément :
1. `CACHE_NAME` dans `sw.js` (ex: `nextrep-v14` → `nextrep-v15`)
2. `APP_VERSION` dans `src/js/app.js`
3. `version` dans `version.json`

Le système d'auto-update détecte la nouvelle version et force le rechargement client.

## Crédits

- Silhouettes anatomiques : [body-highlighter](https://github.com/lahaxearnaud/body-highlighter) (MIT, © Arnaud Lahaxe)
