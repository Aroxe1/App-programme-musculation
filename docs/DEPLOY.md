# Déployer NextRep en ligne

Tu vas héberger l'app sur **Firebase Hosting** (gratuit, HTTPS automatique, déjà connecté à ton projet Firebase). En 5 minutes tu auras une URL `https://musculog-f720e.web.app` consultable de n'importe où.

---

## Pré-requis : installer Node.js et la CLI Firebase

### 1. Installer Node.js (une seule fois)

Si tu n'as pas Node :

1. Va sur https://nodejs.org/ → télécharge la version **LTS** (≥ 20)
2. Lance l'installeur, garde tout par défaut
3. Ouvre **un nouveau PowerShell** (important : pour que la nouvelle commande `node` soit reconnue) et vérifie :
   ```powershell
   node --version
   npm --version
   ```
   Tu dois voir `v20.x.x` ou plus.

### 2. Installer la CLI Firebase

```powershell
npm install -g firebase-tools
```

Vérifie :
```powershell
firebase --version
```

---

## Connexion + association au projet

```powershell
cd "C:\Users\FA506\OneDrive\Bureau\App-programme-musculation"
firebase login
```

Une page web s'ouvre — connecte-toi avec le **même compte Google** que celui qui a créé ton projet Firebase.

Associe le dossier au projet :
```powershell
firebase use --add
```
- Choisis ton projet : **musculog-f720e**
- Donne-lui l'alias `default` (juste tape Entrée).

Un fichier `.firebaserc` est créé automatiquement.

---

## Déployer

```powershell
firebase deploy --only hosting
```

À la fin tu vois :
```
Hosting URL: https://musculog-f720e.web.app
```

C'est ton URL publique. Ouvre-la dans n'importe quel navigateur — ça marche.

> Note : Firebase ajoute automatiquement `musculog-f720e.web.app` et `musculog-f720e.firebaseapp.com` à la liste des domaines autorisés pour l'authentification. Si tu utilises un domaine personnalisé, il faudra l'ajouter manuellement dans **Authentication → Settings → Authorized domains**.

Pour redéployer après une modification : relance simplement `firebase deploy --only hosting`.

---

## Installer l'app sur ton téléphone

L'app est une **PWA** : pas besoin du Play Store ni de l'App Store, elle s'installe directement depuis le navigateur.

### 📱 iPhone (Safari uniquement)

1. Ouvre **Safari** (pas Chrome — il faut Safari pour l'install PWA sur iOS)
2. Va sur `https://musculog-f720e.web.app`
3. Connecte-toi à ton compte
4. Tape le bouton **Partager** (le carré avec la flèche vers le haut, en bas de l'écran)
5. Scrolle vers le bas → **« Sur l'écran d'accueil »** (« Add to Home Screen »)
6. Tape **Ajouter** en haut à droite

Une icône NextRep apparaît sur ton écran d'accueil. En l'ouvrant, elle se lance en plein écran sans la barre du navigateur, comme une vraie app.

### 📱 Android (Chrome, Edge, Brave…)

1. Ouvre Chrome
2. Va sur `https://musculog-f720e.web.app`
3. Connecte-toi
4. **Méthode 1 :** Chrome propose souvent une bannière en bas « Installer NextRep » — tape dessus
5. **Méthode 2 :** Menu **⋮** (en haut à droite) → **« Installer l'application »** ou **« Ajouter à l'écran d'accueil »**

L'app apparaît dans le tiroir d'applications comme n'importe quelle autre. Elle fonctionne hors-ligne (service worker), synchronise dès que tu retrouves du réseau.

### 💻 Desktop (bonus)

Sur Chrome/Edge desktop : icône d'installation 💻 dans la barre d'URL (à droite). Tape dessus → l'app s'ouvre dans sa propre fenêtre.

---

## Workflow type pour les futures mises à jour

1. Modifie le code en local
2. Teste avec `.\serve.ps1` (`http://localhost:8080`)
3. Une fois content : `firebase deploy --only hosting`
4. Sur ton téléphone, ferme et rouvre l'app → la nouvelle version est récupérée automatiquement (service worker)

> 💡 **Si une nouvelle version ne s'affiche pas** : c'est le service worker qui sert l'ancienne. Solution : ferme l'app puis rouvre-la deux fois, ou désinstalle/réinstalle. Le numéro de version du cache (`musculog-vN` dans `sw.js`) doit aussi être bumpé à chaque release majeure — je le fais déjà.

---

## Coûts

Plan gratuit Firebase Hosting (Spark) :
- **10 GB de stockage** statique
- **360 MB de transfert par jour**
- Domaine `*.web.app` gratuit
- HTTPS gratuit

Pour une app perso de quelques centaines de Mo de bande passante par jour, tu ne paieras jamais rien.

---

## Domaine personnalisé (optionnel)

Si tu veux `musculog.toi.com` au lieu de `musculog-f720e.web.app` :

1. Console Firebase → **Hosting** → **Ajouter un domaine personnalisé**
2. Suis les étapes (ajoute les enregistrements TXT/A chez ton registrar)
3. **N'oublie pas** d'ajouter ce domaine dans **Authentication → Settings → Authorized domains** sinon le login ne fonctionnera pas dessus
