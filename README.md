# NextRep

Une app de suivi de musculation qui tourne dans le navigateur : tu crées tes programmes, tu logges tes séances, et l'app te attribue un rang par groupe musculaire en fonction de ce que tu soulèves. Il y a aussi un suivi nutrition avec scanner de code-barres.

C'est une PWA, donc ça s'installe sur le téléphone comme une vraie app et ça marche hors ligne.

Techniquement c'est du JavaScript vanilla avec des modules ES natifs — pas de build, pas de `node_modules`, tu ouvres un serveur statique et c'est parti. Firebase s'occupe des comptes et de la synchro.

## Ce que ça fait

**Programmes.** Tu crées tes séances à la main (exercices, séries, reps, repos), ou tu pars d'un programme type — PPL, Upper/Lower, Full Body, etc. Il y a aussi un générateur : tu réponds à quelques questions (objectif, niveau, jours par semaine, matériel dispo) et il te sort un programme cohérent. Un programme peut se partager par lien : tout est compressé et encodé dans l'URL, il n'y a rien à stocker côté serveur.

**Séances.** Tu valides tes séries au fur et à mesure, le minuteur de repos se lance tout seul et vibre quand c'est fini. Si tu quittes l'app en cours de route tu retrouves ta séance là où tu l'avais laissée. Tout part dans l'historique.

**Exercices.** Une base de plusieurs centaines d'exercices avec images, instructions et muscles travaillés, tirée de free-exercise-db. Elle est chargée une fois depuis un CDN puis gardée en cache un mois.

**Rangs.** Le cœur de l'app. Dix niveaux, de Bronze à Dieu Grec. Pour chaque groupe musculaire, on prend ton meilleur 1RM estimé (formule d'Epley) et on le compare à des standards de force réels, ajustés selon ton sexe, ton âge et ta taille. Le résultat s'affiche sur une silhouette anatomique colorée, de face et de dos.

**Records.** Les PR sont détectés tout seuls à partir de l'historique, et l'app te le fait savoir quand tu en bats un.

**Photos de progression.** Stockées en IndexedDB, sur l'appareil uniquement. Elles ne partent jamais sur un serveur — c'était le choix assumé pour la vie privée, au prix de la synchro multi-appareils.

**Nutrition.** Journal quotidien, aliments réutilisables, et un scanner de code-barres qui va chercher les valeurs nutritionnelles sur Open Food Facts. Les objectifs caloriques et les macros sont calculés à partir du profil (Mifflin-St Jeor × niveau d'activité), ou fixés à la main.

**Le reste.** Connexion par email ou par Google, vérification d'email, suppression de compte. L'app est traduite en français, anglais, espagnol et allemand. Les CGU et la politique de confidentialité sont intégrées. Et il y a un petit fil d'actualités pour annoncer les nouveautés à chaque version.

## Comment c'est fait

Pas de framework, pas d'étape de build. Le front est en JS vanilla, chaque fonctionnalité vit dans son module sous `src/js/`. Firebase Authentication gère les comptes, Firestore stocke les données de chaque utilisateur dans un seul document, et un Service Worker met l'app en cache pour l'offline (network-first, le cache ne sert que de secours).

Les données locales sont réparties entre `localStorage` (état de l'app, caches) et IndexedDB (photos). Côté look, la direction artistique s'appelle « Aurora Performance » : fond sombre, verre dépoli, gradients chauds, nav flottante en bas.

Quelques librairies sont chargées à la volée depuis un CDN, seulement quand on en a besoin : le SDK Firebase, `lz-string` pour le partage, `html5-qrcode` pour le scanner, et la base d'exercices.

## Les fichiers

```
index.html              le shell : topbar, conteneur de vue, nav du bas
sw.js                   Service Worker — doit rester à la racine
version.json            version courante, c'est elle qui déclenche l'auto-update
manifest.webmanifest    manifest PWA
firebase.json           config Hosting (headers de cache)
serve.ps1               petit serveur local pour développer

src/js/
  app.js                le gros morceau : routing et rendu de toutes les vues
  auth.js               Firebase Auth + Firestore
  firebase-config.js    les clés du projet (publiques, rien de secret)
  i18n.js               traductions de l'interface
  icons.js              icônes SVG inline
  ranks.js              système de rangs et groupes musculaires
  strength-standards.js seuils de force par exercice, en multiple du poids de corps
  records.js            records personnels et 1RM estimé
  body-paths.js         les silhouettes SVG
  exercise-db.js        chargement et recherche dans la banque d'exercices
  exercise-i18n.js      traduction des données d'exercices
  program-templates.js  programmes types prêts à importer
  program-generator.js  générateur par questionnaire
  progress-photos.js    photos de progression (IndexedDB)
  share.js              partage de programme par lien
  barcode.js            scanner + Open Food Facts
  legal.js              CGU et confidentialité

src/css/styles.css      tout le design system

assets/                 logo, polices, les 10 logos de rang
docs/                   DEPLOY.md et FIREBASE-SETUP.md
```

## Développer en local

Il faut passer par un serveur HTTP : en `file://` les modules ES et le Service Worker ne fonctionnent pas.

```powershell
.\serve.ps1
```

Ça ouvre http://localhost:8080. Le script se débrouille avec Python, Node ou PowerShell, selon ce qui est installé.

La config Firebase est déjà dans `src/js/firebase-config.js`. Pour brancher un autre projet, tout est expliqué dans [docs/FIREBASE-SETUP.md](docs/FIREBASE-SETUP.md). À retenir : la sécurité repose entièrement sur les règles Firestore, qui limitent chaque utilisateur à son propre document `users/{uid}`.

## Déployer

```powershell
firebase deploy --only hosting
```

Les pré-requis (Node, `firebase-tools`, `firebase login`) sont dans [docs/DEPLOY.md](docs/DEPLOY.md).

Avant chaque déploiement, il faut bumper trois valeurs **en même temps**, sinon l'auto-update ne part pas — ou pire, il boucle :

1. `CACHE_NAME` dans `sw.js` (ex. `nextrep-v47` → `nextrep-v48`)
2. `APP_VERSION` dans `src/js/app.js`
3. `version` dans `version.json`

Au démarrage, l'app va lire `version.json` (servi sans cache) et compare avec `APP_VERSION`. Si ça diffère, elle vide les caches et force le rechargement.

Autre piège : tout nouveau fichier ajouté dans `src/js/` doit aussi être listé dans le tableau `ASSETS` de `sw.js`, sinon il ne sera pas disponible hors ligne.

## Crédits

- Silhouettes anatomiques : [body-highlighter](https://github.com/lahaxearnaud/body-highlighter), MIT, © Arnaud Lahaxe
- Banque d'exercices : [free-exercise-db](https://github.com/yuhonas/free-exercise-db), domaine public
- Données nutritionnelles : [Open Food Facts](https://openfoodfacts.org), ODbL / CC-BY-SA
- Standards de force : données agrégées de [strengthlevel.com](https://strengthlevel.com)
- Icônes inspirées de [Lucide](https://lucide.dev), ISC
- [lz-string](https://github.com/pieroxy/lz-string), MIT — [html5-qrcode](https://github.com/mebjas/html5-qrcode), Apache-2.0

## Petit avertissement

NextRep est un outil de suivi personnel, pas un conseil médical ni un suivi diététique professionnel. Les rangs et les standards de force sont là pour donner un repère et motiver, rien de plus.
