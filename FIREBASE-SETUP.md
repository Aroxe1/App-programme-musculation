# Configuration Firebase pour MuscuLog

L'app utilise **Firebase Authentication** (email + mot de passe) et **Cloud Firestore**
(base de données) pour que chaque utilisateur ait ses propres programmes et séances,
synchronisés entre appareils.

Tout est gratuit dans le plan "Spark" tant que tu restes en dessous des quotas
(plus que suffisant pour un usage personnel).

---

## 1. Créer le projet Firebase

1. Va sur https://console.firebase.google.com/
2. Clique sur **« Ajouter un projet »**
3. Donne-lui un nom (ex : `musculog`)
4. Désactive Google Analytics (pas utile ici), puis clique **« Créer »**

## 2. Activer l'authentification par email/mot de passe

1. Dans le menu de gauche, **Build → Authentication → Get started**
2. Onglet **« Sign-in method »**
3. Active **« Email/Password »** (laisse « Email link » désactivé)
4. **Sauvegarder**

## 3. Créer la base Firestore

1. Menu de gauche : **Build → Firestore Database → Créer une base de données**
2. Choisis le mode **« Production »** (on configure les règles ensuite)
3. Choisis une région proche de toi (ex : `europe-west1` pour la Belgique/France)
4. Clique **« Activer »**

## 4. Règles de sécurité Firestore

Onglet **« Règles »** de Firestore, remplace tout par :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chaque utilisateur ne peut lire/écrire QUE son propre document
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Puis **« Publier »**. Sans ces règles, n'importe qui pourrait lire les
données de n'importe quel utilisateur.

## 5. Récupérer la config et la coller dans l'app

1. Roue dentée (en haut à gauche) → **« Paramètres du projet »**
2. Section **« Vos applications »**, clique sur l'icône **`</>`** (Web)
3. Donne-lui un surnom (ex : `musculog-web`), **ne coche pas** Firebase Hosting,
   puis clique **« Enregistrer »**
4. Tu obtiens un bloc de config qui ressemble à :

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "musculog-xxxx.firebaseapp.com",
  projectId: "musculog-xxxx",
  storageBucket: "musculog-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

5. **Ouvre `firebase-config.js`** dans ce dossier et remplace les valeurs
   `"REMPLACE_MOI"` par celles de ton projet.

## 6. Autoriser ton domaine

Si tu utilises l'app autrement qu'en `localhost` :

1. **Authentication → Settings → Authorized domains**
2. Ajoute le domaine (ou l'IP) depuis lequel tu sers l'app

Par défaut `localhost` est déjà autorisé.

## 7. Lancer l'app

```powershell
.\serve.ps1
```

Puis ouvre `http://localhost:8000` et crée ton premier compte.

---

## Coûts

Plan gratuit Firebase (Spark) :
- **Auth** : 50 000 connexions / mois gratuits — largement assez
- **Firestore** :
  - 50 000 lectures / jour
  - 20 000 écritures / jour
  - 1 GiB stocké

Avec un usage perso (~1 séance/jour), tu seras très loin de ces limites.

## Sécurité

- Les clés dans `firebase-config.js` **ne sont pas secrètes** : elles identifient
  ton projet côté client. Tu peux les commit dans un repo public.
- La sécurité réelle repose sur les **règles Firestore** (étape 4) qui empêchent
  un utilisateur d'accéder aux données d'un autre.
- Le mot de passe est haché par Firebase côté serveur, jamais stocké en clair.

## Dépannage

- **« Firebase non configuré »** au démarrage : tu n'as pas rempli
  `firebase-config.js`.
- **« auth/network-request-failed »** : pas de connexion internet ou
  domaine non autorisé.
- **« permission-denied »** dans la console : tes règles Firestore n'autorisent
  pas l'accès — vérifie l'étape 4.
- Pour réinitialiser totalement les données locales : `localStorage.clear()`
  dans la console DevTools.
