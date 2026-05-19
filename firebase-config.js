/* Configuration Firebase
 * Remplace les valeurs ci-dessous par celles de TON projet Firebase.
 * Voir FIREBASE-SETUP.md pour les étapes de création du projet.
 *
 * Ces clés ne sont pas secrètes : elles identifient ton projet côté client.
 * La sécurité repose sur les règles Firestore (voir FIREBASE-SETUP.md).
 */
export const firebaseConfig = {
  apiKey: "AIzaSyDcj7artKo-4YLVoMJLV6nux3K6Wr0Tb5o",
  authDomain: "musculog-f720e.firebaseapp.com",
  projectId: "musculog-f720e",
  storageBucket: "musculog-f720e.firebasestorage.app",
  messagingSenderId: "705619083050",
  appId: "1:705619083050:web:00d7495aca1d503727e853",
};

// Indique si la config a été remplie (utilisé pour afficher un message d'erreur clair)
export const isConfigured = () =>
  firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('REMPLACE_MOI');
