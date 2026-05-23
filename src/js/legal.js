/* legal.js — Conditions Générales d'Utilisation & Politique de Confidentialité
 *
 * IMPORTANT : Ces textes sont un template raisonnable mais ne valent PAS un
 * conseil juridique. Avant publication grand public, fais-les relire par
 * un juriste / conformité RGPD si tu touches > 100 utilisateurs.
 */

const APP_NAME = 'NextRep';
const PUBLISHER = 'NextRep';
const CONTACT_EMAIL = 'contact@nextrep.app'; // ⚠️ à remplacer par ton email réel
const LAST_UPDATED = '23 mai 2026';

export const CGU = `
# Conditions Générales d'Utilisation

**Dernière mise à jour : ${LAST_UPDATED}**

## 1. Objet
Les présentes conditions régissent l'utilisation de l'application ${APP_NAME}
(« l'Application »), service de suivi de programmes de musculation, séances,
nutrition et progression personnelle.

## 2. Acceptation
En créant un compte ou en utilisant l'Application, vous acceptez sans réserve
les présentes CGU et la Politique de Confidentialité associée.

## 3. Accès au service
L'Application est accessible gratuitement via navigateur (PWA). L'inscription
requiert une adresse email valide et un mot de passe.

L'éditeur peut suspendre l'accès en cas de maintenance, abus, ou de
non-respect des présentes CGU.

## 4. Compte utilisateur
- Vous êtes responsable de la confidentialité de vos identifiants.
- L'âge minimum est de **13 ans** (16 ans dans l'UE conformément au RGPD).
- Un seul compte par personne.
- Toute activité réalisée depuis votre compte est réputée effectuée par vous.

## 5. Usage acceptable
Vous vous engagez à ne pas :
- Utiliser l'Application à des fins illicites ou frauduleuses
- Tenter d'accéder à des comptes tiers
- Contourner les mesures de sécurité techniques
- Surcharger ou perturber le service

## 6. Données fitness et santé
${APP_NAME} est un outil de suivi personnel. Les informations affichées
(macros, rangs, recommandations) sont **purement indicatives** et ne
constituent **pas un avis médical**. Consultez un professionnel de santé
avant tout programme sportif ou diététique intense.

## 7. Propriété intellectuelle
L'Application, son code, sa charte graphique et son contenu sont protégés.
Les données générées par l'utilisateur (programmes, séances, notes) restent
sa propriété.

Certains composants sont sous licence ouverte :
- Silhouettes anatomiques : *body-highlighter* (MIT, © Arnaud Lahaxe)
- Base d'exercices : *free-exercise-db* (Unlicense)
- Données nutritionnelles : *Open Food Facts* (Open Database License)

## 8. Disponibilité
Le service est fourni « tel quel », sans garantie de disponibilité continue.
L'éditeur ne peut être tenu pour responsable d'interruptions, pertes de
données, ou dommages indirects.

## 9. Résiliation
Vous pouvez supprimer votre compte à tout moment depuis l'application
(Menu compte → Supprimer mon compte). Toutes vos données seront effacées
sous 30 jours.

## 10. Modification des CGU
L'éditeur peut modifier les présentes CGU. Les utilisateurs sont informés
des modifications substantielles via l'application.

## 11. Droit applicable
Les présentes CGU sont régies par le droit français. Tout litige relève
des tribunaux compétents du ressort du siège de l'éditeur.

## 12. Contact
Éditeur : ${PUBLISHER}
Email : ${CONTACT_EMAIL}
`;

export const PRIVACY = `
# Politique de Confidentialité

**Dernière mise à jour : ${LAST_UPDATED}**

## 1. Responsable du traitement
${PUBLISHER} (« nous ») est responsable du traitement des données collectées
via l'application ${APP_NAME}.

Contact : ${CONTACT_EMAIL}

## 2. Données collectées
Nous collectons :

**Données d'identification**
- Adresse email (compte)
- Nom affiché (optionnel)
- Mot de passe (chiffré par Firebase Auth, jamais accessible en clair)

**Données fitness**
- Programmes, exercices, séances enregistrées
- Mensurations (poids, taille, âge — optionnel)
- Objectifs caloriques et macros
- Historique nutritionnel

**Données techniques**
- Date de dernière connexion (pour l'auto-déconnexion 30 jours)
- Préférences locales (cache navigateur)

## 3. Finalités du traitement
- Fournir le service (sauvegarde et synchronisation des données)
- Calculer vos rangs et statistiques
- Sécuriser votre compte (auto-logout, vérification email)
- Vous contacter en cas de modification importante du service

## 4. Base légale
Le traitement est basé sur **votre consentement** (art. 6.1.a RGPD) lors de
l'inscription et **l'exécution du contrat** (art. 6.1.b RGPD) pour le
fonctionnement du service.

## 5. Destinataires
Vos données sont stockées sur **Firebase** (Google Cloud, hébergement EU
quand possible). Aucune donnée n'est revendue ni partagée avec des tiers
publicitaires.

Sous-traitants techniques :
- **Google Firebase** (Authentication, Firestore, Hosting) — sous-traitant RGPD
- **Open Food Facts** (lookup nutritionnel, requête anonyme par code-barres)

## 6. Durée de conservation
- **Compte actif** : tant que vous l'utilisez
- **Compte inactif > 24 mois** : suppression automatique avec préavis email
- **Compte supprimé** : effacement sous 30 jours (sauvegardes Firebase
  expirent au-delà)

## 7. Vos droits (RGPD)
Vous disposez des droits suivants :
- **Accès** : consulter vos données
- **Rectification** : modifier votre profil dans l'app
- **Effacement** : supprimer votre compte (Menu compte → Supprimer)
- **Portabilité** : export JSON depuis le menu compte
- **Opposition** : nous contacter à ${CONTACT_EMAIL}
- **Réclamation** : auprès de la CNIL (www.cnil.fr)

## 8. Sécurité
- Communications chiffrées en HTTPS
- Authentification Firebase (mots de passe hashés)
- Auto-déconnexion après 30 jours d'inactivité
- Vérification email obligatoire à l'inscription

## 9. Cookies et stockage local
${APP_NAME} utilise le **stockage local du navigateur** (localStorage,
IndexedDB) pour :
- Garder votre session active
- Cacher vos données hors-ligne (PWA)
- Mémoriser vos préférences

Aucun cookie tiers ni traceur publicitaire.

## 10. Modifications
Cette politique peut évoluer. Les changements majeurs vous seront notifiés
dans l'application.
`;

/**
 * Ouvre une modal avec un texte légal mis en forme Markdown simple.
 * @param {'cgu'|'privacy'} type
 */
export function openLegalModal(type) {
  const text = type === 'cgu' ? CGU : PRIVACY;
  const title = type === 'cgu' ? 'Conditions Générales d\'Utilisation' : 'Politique de Confidentialité';

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop legal-backdrop';
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  const html = mdToHtml(text);
  backdrop.innerHTML = `
    <div class="modal legal-modal">
      <div class="legal-scroll">${html}</div>
      <button class="btn btn-block legal-close">Fermer</button>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.querySelector('.legal-close').addEventListener('click', () => backdrop.remove());
}

/** Conversion Markdown ultra-simple → HTML (titres, listes, gras, paragraphes). */
function mdToHtml(md) {
  const lines = md.trim().split('\n');
  const out = [];
  let inList = false;
  for (let raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inList) { out.push('</ul>'); inList = false; }
      continue;
    }
    if (line.startsWith('# ')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h1>${escape(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h2>${escape(line.slice(3))}</h2>`);
    } else if (line.startsWith('- ')) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${formatInline(line.slice(2))}</li>`);
    } else {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<p>${formatInline(line)}</p>`);
    }
  }
  if (inList) out.push('</ul>');
  return out.join('');
}

function escape(s) {
  return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
function formatInline(s) {
  return escape(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
