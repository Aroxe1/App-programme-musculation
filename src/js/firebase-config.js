/* Configuration Firebase
 * Remplace les valeurs ci-dessous par celles de TON projet Firebase.
 * Voir FIREBASE-SETUP.md pour les étapes de création du projet.
 *
 * Ces clés ne sont pas secrètes : elles identifient ton projet côté client.
 * La sécurité repose sur les règles Firestore (voir FIREBASE-SETUP.md).
 */
export const firebaseConfig = {
  apiKey: "AIzaSyBz0TwQKESi750hXvFvpr33m7Z7uaNfMls",
  authDomain: "nextrep-6e560.firebaseapp.com",
  projectId: "nextrep-6e560",
  storageBucket: "nextrep-6e560.firebasestorage.app",
  messagingSenderId: "532835752796",
  appId: "1:532835752796:web:425eb4a66e35aee269ff99",
  measurementId: "G-7DD9BLYT3R"
};

// Indique si la config a été remplie (utilisé pour afficher un message d'erreur clair)
export const isConfigured = () =>
  firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('REMPLACE_MOI');
