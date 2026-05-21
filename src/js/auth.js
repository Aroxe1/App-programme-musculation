/* auth.js — wrapper Firebase Auth + Firestore pour NextRep
 * Expose une API simple : init, onAuthChanged, signIn/signUp/signOut,
 * loadUserData, saveUserData (debounced), sendReset.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  reload,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  initializeFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  persistentLocalCache,
  persistentSingleTabManager,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

import { firebaseConfig, isConfigured } from './firebase-config.js';

let app = null;
let auth = null;
let db = null;
let initError = null;

export async function init() {
  if (app) return { ok: true };
  if (!isConfigured()) {
    initError = 'Firebase non configuré. Ouvre firebase-config.js et remplis les clés (voir FIREBASE-SETUP.md).';
    return { ok: false, error: initError };
  }
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Persistance locale = la session reste après fermeture du navigateur
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (err) {
      console.warn('Persistance auth non disponible :', err);
    }
    // Firestore avec cache offline persistant (IndexedDB)
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager(),
      }),
    });
    return { ok: true };
  } catch (err) {
    initError = err.message || String(err);
    return { ok: false, error: initError };
  }
}

export function getInitError() { return initError; }

export function onAuthChanged(callback) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

export function currentUser() {
  return auth?.currentUser ?? null;
}

export async function signUp(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    try { await updateProfile(cred.user, { displayName }); } catch (_) { /* non-bloquant */ }
  }
  // Envoie l'email de vérification immédiatement
  try { await sendEmailVerification(cred.user); } catch (err) { console.warn('sendEmailVerification', err); }
  return cred.user;
}

export async function signIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function sendReset(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function resendVerification() {
  if (!auth?.currentUser) throw new Error('Aucun utilisateur connecté');
  await sendEmailVerification(auth.currentUser);
}

export async function reloadCurrentUser() {
  if (!auth?.currentUser) return null;
  await reload(auth.currentUser);
  return auth.currentUser;
}

export async function signOut() {
  await fbSignOut(auth);
}

// ---------------------------------------------------------------
// Firestore : un document par utilisateur, contenant tout l'état.
// users/{uid} = { programs, sessions, lastProgramId, updatedAt }
// ---------------------------------------------------------------
function userDocRef(uid) {
  return doc(db, 'users', uid);
}

// Champs persistés dans Firestore (le reste est ignoré)
const STATE_FIELDS = [
  'programs',
  'sessions',
  'lastProgramId',
  'activeSession',
  'profile',
  'macroTargets',
  'nutritionLog',
  'savedFoods',
];

export async function loadUserData(uid) {
  const snap = await getDoc(userDocRef(uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  const out = {};
  for (const f of STATE_FIELDS) {
    if (data[f] !== undefined && data[f] !== null) out[f] = data[f];
  }
  return out;
}

// Sauvegarde immédiate (sans debounce). Utiliser saveUserDataDebounced en pratique.
export async function saveUserDataNow(uid, state) {
  const payload = { updatedAt: serverTimestamp() };
  for (const f of STATE_FIELDS) {
    if (state[f] !== undefined) {
      payload[f] = state[f];
    } else if (f === 'activeSession') {
      // explicitement null pour supprimer l'ancienne séance active
      payload.activeSession = null;
    }
  }
  await setDoc(userDocRef(uid), payload, { merge: true });
}

let saveTimer = null;
let pendingState = null;
let pendingUid = null;
let saveListeners = new Set();

export function onSaveStatus(listener) {
  saveListeners.add(listener);
  return () => saveListeners.delete(listener);
}
function emitStatus(status, err) {
  for (const l of saveListeners) {
    try { l(status, err); } catch (_) { /* ignore */ }
  }
}

export function saveUserDataDebounced(uid, state, delay = 1500) {
  pendingState = state;
  pendingUid = uid;
  emitStatus('pending');
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, delay);
}

export async function flush() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  if (!pendingState || !pendingUid) return;
  const uid = pendingUid;
  const state = pendingState;
  pendingState = null;
  pendingUid = null;
  try {
    emitStatus('saving');
    await saveUserDataNow(uid, state);
    emitStatus('saved');
  } catch (err) {
    emitStatus('error', err);
    console.warn('Sync Firestore échouée', err);
  }
}

// Force flush avant quitter la page
window.addEventListener('pagehide', () => { flush(); });
window.addEventListener('beforeunload', () => { flush(); });
