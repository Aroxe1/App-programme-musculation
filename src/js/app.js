/* NextRep — PWA de suivi de musculation
 * Stockage : Firebase (Auth + Firestore) + cache localStorage par utilisateur.
 */
'use strict';

import * as Auth from './auth.js';
import { RANKS, RANK_ICONS, RANK_LOGOS, MUSCLE_GROUPS, computeRanks, overallRank, detectGroups } from './ranks.js';
import { anteriorData, posteriorData } from './body-paths.js';

// ============================================================
// Storage (par utilisateur)
// ============================================================
const STORAGE_PREFIX = 'musculog.v2.';
const LEGACY_KEY = 'musculog.v1'; // ancienne clé (avant comptes)

// Auto-logout après 30 jours d'inactivité (sécurité)
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const LAST_ACTIVE_KEY = 'nextrep.lastActive';
function markActive() {
  try { localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now())); } catch (_) {}
}
function isSessionExpired() {
  try {
    const v = localStorage.getItem(LAST_ACTIVE_KEY);
    if (!v) return false;
    const last = parseInt(v, 10);
    if (!Number.isFinite(last)) return false;
    return (Date.now() - last) > SESSION_TTL_MS;
  } catch (_) { return false; }
}
function clearActive() {
  try { localStorage.removeItem(LAST_ACTIVE_KEY); } catch (_) {}
}

const defaultState = () => ({
  programs: [],
  sessions: [],
  lastProgramId: null,
  profile: {
    name: '',
    height: null,      // cm
    weight: null,      // kg
    age: null,
    gender: '',        // 'male' | 'female' | 'other'
    activityLevel: 'moderate', // sedentary | light | moderate | active | very_active
  },
  macroTargets: {
    kcal: null,
    protein: null,
    carbs: null,
    fat: null,
    auto: true,        // recalcul auto à partir du profil
  },
  nutritionLog: {},    // { 'YYYY-MM-DD': [{ id, name, kcal, protein, carbs, fat, time }] }
  savedFoods: [],      // aliments réutilisables [{ id, name, kcal, protein, carbs, fat }]
});

let currentUid = null;        // uid Firebase courant, null si non connecté
let store = defaultState();   // état mémoire courant
let cloudReady = false;       // données chargées depuis Firestore au moins une fois

function storageKey(uid) {
  return STORAGE_PREFIX + (uid || 'anon');
}

function loadStateFromLocal(uid) {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Cache local illisible', err);
    return null;
  }
}

function writeStateToLocal(uid) {
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(store));
  } catch (err) {
    console.error('Échec écriture cache local', err);
  }
}

function saveState() {
  // 1) Cache local immédiat (pour reprise rapide / offline)
  writeStateToLocal(currentUid);
  // 2) Sync cloud (debounced) si connecté
  if (currentUid && cloudReady) {
    Auth.saveUserDataDebounced(currentUid, store);
  }
}

function migrateLegacyIfAny() {
  // Récupère un éventuel état v1 stocké avant l'ajout des comptes
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.programs?.length || parsed.sessions?.length)) return parsed;
  } catch (_) { /* ignore */ }
  return null;
}

// ============================================================
// Utils
// ============================================================
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const $ = (sel, root = document) => root.querySelector(sel);

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

function toast(msg, ms = 2200) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._h);
  toast._h = setTimeout(() => t.classList.remove('show'), ms);
}

function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function confirmDialog(message, onConfirm) {
  const backdrop = el('div', { class: 'modal-backdrop', onclick: e => { if (e.target === backdrop) close(); } });
  const close = () => backdrop.remove();
  const modal = el('div', { class: 'modal' },
    el('h2', {}, 'Confirmation'),
    el('p', { class: 'muted', style: 'margin: 0 0 16px;' }, message),
    el('div', { class: 'row' },
      el('button', { class: 'btn', onclick: close }, 'Annuler'),
      el('button', { class: 'btn btn-danger', onclick: () => { onConfirm(); close(); } }, 'Confirmer'),
    ),
  );
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

// ============================================================
// Routing
// ============================================================
const route = { name: 'programs', params: {} };

function navigate(name, params = {}) {
  route.name = name;
  route.params = params;
  window.scrollTo({ top: 0 });
  render();
}

function setActiveNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const target = btn.dataset.route;
    const active = target === 'session'
      ? ['session', 'session-pick', 'session-active'].includes(route.name)
      : target === 'programs'
        ? ['programs', 'program-edit'].includes(route.name)
        : target === 'history'
          ? ['history', 'session-detail'].includes(route.name)
          : target === 'progress'
            ? ['progress'].includes(route.name)
            : target === 'nutrition'
              ? ['nutrition'].includes(route.name)
              : target === route.name;
    btn.classList.toggle('active', active);
  });
}

// ============================================================
// Bootstrap
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.route));
  });
  // Bouton compte dans la topbar
  const acc = $('#account-btn');
  if (acc) acc.addEventListener('click', openAccountMenu);

  // Bouton actualités dans la topbar
  const notifs = $('#notifs-btn');
  if (notifs) notifs.addEventListener('click', openNotificationsPanel);
  updateNotifsBadge();

  bootstrapAuth();
  registerSW();
});

function setChrome(visible) {
  // Affiche ou masque la nav du bas + bouton "+" + bouton compte selon le contexte auth
  document.body.classList.toggle('no-chrome', !visible);
  const fab = $('#fab-action');
  if (fab && !visible) { fab.hidden = true; fab.onclick = null; }
}

async function bootstrapAuth() {
  // Affiche écran de chargement le temps que Firebase rende un verdict
  renderLoading('Connexion…');

  const initRes = await Auth.init();
  if (!initRes.ok) {
    renderConfigError(initRes.error);
    return;
  }

  Auth.onAuthChanged(async user => {
    if (!user) {
      currentUid = null;
      cloudReady = false;
      store = defaultState();
      route.name = 'auth';
      route.params = {};
      setChrome(false);
      render();
      return;
    }
    // Email non vérifié → bloque l'accès, affiche écran de vérification
    if (!user.emailVerified) {
      currentUid = null;
      cloudReady = false;
      store = defaultState();
      route.name = 'verify-email';
      route.params = { email: user.email };
      setChrome(false);
      render();
      return;
    }
    // Session expirée (30j sans activité) → logout forcé
    if (isSessionExpired()) {
      clearActive();
      try { await Auth.signOut(); } catch (_) {}
      toast('Session expirée — reconnecte-toi');
      return; // onAuthChanged va se redéclencher avec user=null
    }
    markActive();
    await enterVerifiedUser(user);
  });

  // Indicateur de sync dans la topbar
  Auth.onSaveStatus(status => {
    if (status === 'saved' || status === 'pending') markActive();
    const ind = $('#sync-indicator');
    if (!ind) return;
    ind.dataset.status = status;
    ind.title = ({
      pending: 'Modifications en attente…',
      saving: 'Synchronisation…',
      saved: 'Synchronisé',
      error: 'Erreur de synchronisation',
    })[status] || '';
  });
}

// Charge les données d'un utilisateur dont l'email est déjà vérifié
// et affiche l'app. Utilisé depuis onAuthChanged ET après vérif manuelle.
async function enterVerifiedUser(user) {
  currentUid = user.uid;
  cloudReady = false;
  const cached = loadStateFromLocal(currentUid);
  store = cached ? { ...defaultState(), ...cached } : defaultState();
  setChrome(true);
  // Si on était sur auth ou verify-email, on bascule sur programs
  if (route.name === 'auth' || route.name === 'verify-email') {
    route.name = 'programs';
    route.params = {};
  }
  render();

  try {
    const cloud = await Auth.loadUserData(currentUid);
    if (cloud) {
      store = { ...defaultState(), ...cloud };
    } else {
      const legacy = !cached ? migrateLegacyIfAny() : null;
      if (legacy) {
        store = { ...defaultState(), ...legacy };
        toast('Données locales existantes importées dans ton compte');
      }
    }
    cloudReady = true;
    writeStateToLocal(currentUid);
    if (!cloud) {
      Auth.saveUserDataDebounced(currentUid, store, 200);
    }
    render();
  } catch (err) {
    console.warn('Chargement Firestore échoué', err);
    cloudReady = true;
    toast('Données chargées depuis le cache (hors-ligne)');
  }
}

// ============================================================
// Render dispatcher
// ============================================================
function render() {
  const app = $('#app');
  app.innerHTML = '';
  setActiveNav();

  const fab = $('#fab-action');
  fab.hidden = true;
  fab.onclick = null;

  switch (route.name) {
    case 'auth':           renderAuth(app); break;
    case 'verify-email':   renderVerifyEmail(app); break;
    case 'loading':        renderLoading(route.params.label || 'Chargement…'); break;
    case 'config-error':   /* géré séparément */ break;
    case 'programs':       renderPrograms(app); break;
    case 'program-edit':   renderProgramEdit(app, route.params.id); break;
    case 'session':        renderSessionHome(app); break;
    case 'session-pick':   renderSessionPick(app); break;
    case 'session-active': renderSessionActive(app); break;
    case 'history':        renderHistory(app); break;
    case 'session-detail': renderSessionDetail(app, route.params.id); break;
    case 'progress':       renderProgress(app); break;
    case 'nutrition':      renderNutrition(app); break;
    case 'profile':        renderProfile(app); break;
    default:               renderPrograms(app);
  }
}

function setTitle(title) { $('#page-title').textContent = title; }

function showFab(label, onClick) {
  const fab = $('#fab-action');
  fab.hidden = false;
  fab.textContent = label;
  fab.onclick = onClick;
}

function emptyState(icon, title, hint, ctaLabel, ctaOnClick) {
  const tpl = $('#tpl-empty').content.cloneNode(true);
  const root = tpl.querySelector('.empty');
  root.querySelector('.empty-icon').textContent = icon;
  root.querySelector('.empty-title').textContent = title;
  root.querySelector('.empty-hint').textContent = hint;
  if (ctaLabel) {
    const btn = el('button', { class: 'btn btn-primary', onclick: ctaOnClick }, ctaLabel);
    root.appendChild(btn);
  }
  return root;
}

// ============================================================
// View : Loading
// ============================================================
function renderLoading(label) {
  const app = $('#app');
  app.innerHTML = '';
  setTitle('NextRep');
  setChrome(false);
  app.appendChild(el('div', { class: 'auth-screen' },
    el('div', { class: 'auth-spinner' }),
    el('p', { class: 'muted text-center' }, label),
  ));
}

// ============================================================
// View : Configuration error (Firebase non configuré)
// ============================================================
function renderConfigError(message) {
  const app = $('#app');
  app.innerHTML = '';
  setTitle('Configuration requise');
  setChrome(false);
  app.appendChild(el('div', { class: 'auth-screen' },
    el('div', { class: 'empty-icon' }, '🔧'),
    el('h2', { style: 'margin: 8px 0;' }, 'Firebase n’est pas configuré'),
    el('p', { class: 'muted text-center', style: 'max-width: 360px;' }, message || ''),
    el('p', { class: 'muted text-center', style: 'max-width: 360px;' },
      'Ouvre le fichier ',
      el('code', {}, 'firebase-config.js'),
      ' et remplis les clés de ton projet. Les étapes sont dans ',
      el('code', {}, 'FIREBASE-SETUP.md'),
      '.'),
  ));
}

// ============================================================
// View : Authentification (login / signup)
// ============================================================
function renderAuth(root) {
  setTitle('NextRep');
  setChrome(false);

  const tab = route.params.tab === 'signup' ? 'signup' : 'login';

  const wrap = el('div', { class: 'auth-screen' });

  wrap.appendChild(el('div', { class: 'auth-logo' },
    el('img', { src: 'assets/logo_app.png', alt: 'NextRep', class: 'auth-logo-img' })
  ));
  wrap.appendChild(el('h1', { class: 'auth-title' }, 'NextRep'));
  wrap.appendChild(el('p', { class: 'muted text-center', style: 'margin-top: 0;' },
    tab === 'login' ? 'Connecte-toi pour retrouver tes programmes' : 'Crée un compte pour synchroniser tes séances'));

  const tabs = el('div', { class: 'auth-tabs' },
    el('button', {
      class: 'auth-tab' + (tab === 'login' ? ' active' : ''),
      onclick: () => navigate('auth', { tab: 'login' }),
    }, 'Connexion'),
    el('button', {
      class: 'auth-tab' + (tab === 'signup' ? ' active' : ''),
      onclick: () => navigate('auth', { tab: 'signup' }),
    }, 'Inscription'),
  );
  wrap.appendChild(tabs);

  if (tab === 'signup') {
    wrap.appendChild(buildSignupForm());
  } else {
    wrap.appendChild(buildLoginForm());
  }

  root.appendChild(wrap);
}

function buildLoginForm() {
  const form = el('form', { class: 'auth-form', onsubmit: async e => {
    e.preventDefault();
    const email = form.querySelector('input[name=email]').value.trim();
    const pwd = form.querySelector('input[name=password]').value;
    if (!email || !pwd) { toast('Email et mot de passe requis'); return; }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Connexion…';
    try {
      await Auth.signIn(email, pwd);
      // onAuthChanged va déclencher le rendu de la suite
    } catch (err) {
      toast(humanAuthError(err));
      submitBtn.disabled = false;
      submitBtn.textContent = 'Se connecter';
    }
  }});

  form.appendChild(el('div', { class: 'field' },
    el('label', {}, 'Email'),
    el('input', { class: 'input', name: 'email', type: 'email', autocomplete: 'email', required: true, placeholder: 'toi@exemple.com' }),
  ));
  form.appendChild(el('div', { class: 'field' },
    el('label', {}, 'Mot de passe'),
    el('input', { class: 'input', name: 'password', type: 'password', autocomplete: 'current-password', required: true, placeholder: '••••••••' }),
  ));

  const submitBtn = el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Se connecter');
  form.appendChild(submitBtn);

  form.appendChild(el('button', {
    class: 'btn btn-ghost btn-block mt-2',
    type: 'button',
    onclick: async () => {
      const email = form.querySelector('input[name=email]').value.trim();
      if (!email) { toast('Saisis ton email d’abord'); return; }
      try {
        await Auth.sendReset(email);
        toast('Email de réinitialisation envoyé');
      } catch (err) {
        toast(humanAuthError(err));
      }
    },
  }, 'Mot de passe oublié ?'));

  return form;
}

function buildSignupForm() {
  const form = el('form', { class: 'auth-form', onsubmit: async e => {
    e.preventDefault();
    const name = form.querySelector('input[name=name]').value.trim();
    const email = form.querySelector('input[name=email]').value.trim();
    const pwd = form.querySelector('input[name=password]').value;
    const pwd2 = form.querySelector('input[name=password2]').value;
    if (!email || !pwd) { toast('Email et mot de passe requis'); return; }
    if (pwd.length < 6) { toast('Mot de passe : 6 caractères minimum'); return; }
    if (pwd !== pwd2) { toast('Les mots de passe ne correspondent pas'); return; }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Création…';
    try {
      await Auth.signUp(email, pwd, name);
    } catch (err) {
      toast(humanAuthError(err));
      submitBtn.disabled = false;
      submitBtn.textContent = 'Créer le compte';
    }
  }});

  form.appendChild(el('div', { class: 'field' },
    el('label', {}, 'Nom affiché (optionnel)'),
    el('input', { class: 'input', name: 'name', type: 'text', autocomplete: 'name', placeholder: 'Ex : Alex' }),
  ));
  form.appendChild(el('div', { class: 'field' },
    el('label', {}, 'Email'),
    el('input', { class: 'input', name: 'email', type: 'email', autocomplete: 'email', required: true, placeholder: 'toi@exemple.com' }),
  ));
  form.appendChild(el('div', { class: 'field' },
    el('label', {}, 'Mot de passe (6+ caractères)'),
    el('input', { class: 'input', name: 'password', type: 'password', autocomplete: 'new-password', required: true, minlength: '6', placeholder: '••••••••' }),
  ));
  form.appendChild(el('div', { class: 'field' },
    el('label', {}, 'Confirmer le mot de passe'),
    el('input', { class: 'input', name: 'password2', type: 'password', autocomplete: 'new-password', required: true, minlength: '6', placeholder: '••••••••' }),
  ));

  const submitBtn = el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Créer le compte');
  form.appendChild(submitBtn);

  return form;
}

// ============================================================
// View : Vérification d'email (bloquant tant que non vérifié)
// ============================================================
function renderVerifyEmail(root) {
  setTitle('Vérification email');
  setChrome(false);

  const email = route.params.email || Auth.currentUser()?.email || '';

  const wrap = el('div', { class: 'auth-screen' });
  wrap.appendChild(el('div', { class: 'auth-logo' },
    el('img', { src: 'assets/logo_app.png', alt: 'NextRep', class: 'auth-logo-img' })
  ));
  wrap.appendChild(el('h1', { class: 'auth-title' }, 'Vérifie ton email'));
  wrap.appendChild(el('p', { class: 'muted text-center', style: 'margin-top: 0;' },
    'Un lien de vérification a été envoyé à'));
  wrap.appendChild(el('p', { class: 'text-center', style: 'font-weight: 700; margin: 4px 0 16px; word-break: break-all;' }, email));
  wrap.appendChild(el('p', { class: 'muted text-center', style: 'margin-bottom: 20px;' },
    'Clique sur le lien dans l’email, puis reviens ici et tape sur « J’ai vérifié ».'));

  const checkBtn = el('button', { class: 'btn btn-primary btn-block', type: 'button' }, 'J’ai vérifié, continuer');
  const resendBtn = el('button', { class: 'btn btn-block', type: 'button', style: 'margin-top: 10px;' }, 'Renvoyer l’email');
  const logoutBtn = el('button', { class: 'btn btn-ghost btn-block', type: 'button', style: 'margin-top: 18px;' }, 'Se déconnecter');

  checkBtn.onclick = async () => {
    checkBtn.disabled = true;
    checkBtn.textContent = 'Vérification…';
    try {
      const u = await Auth.reloadCurrentUser();
      if (u && u.emailVerified) {
        toast('Email vérifié ✓');
        // onAuthChanged ne se redéclenche pas après reload(user) :
        // on déclenche manuellement le chargement de l'app.
        await enterVerifiedUser(u);
      } else {
        toast('Email pas encore vérifié — clique sur le lien dans l’email');
        checkBtn.disabled = false;
        checkBtn.textContent = 'J’ai vérifié, continuer';
      }
    } catch (err) {
      toast(humanAuthError(err));
      checkBtn.disabled = false;
      checkBtn.textContent = 'J’ai vérifié, continuer';
    }
  };

  resendBtn.onclick = async () => {
    resendBtn.disabled = true;
    resendBtn.textContent = 'Envoi…';
    try {
      await Auth.resendVerification();
      toast('Email renvoyé ✓');
    } catch (err) {
      toast(humanAuthError(err));
    } finally {
      setTimeout(() => {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Renvoyer l’email';
      }, 3000);
    }
  };

  logoutBtn.onclick = async () => {
    clearActive();
    try { await Auth.signOut(); } catch (_) {}
  };

  wrap.appendChild(checkBtn);
  wrap.appendChild(resendBtn);
  wrap.appendChild(logoutBtn);
  root.appendChild(wrap);
}

function humanAuthError(err) {
  const code = err?.code || '';
  switch (code) {
    case 'auth/invalid-email': return 'Email invalide';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email ou mot de passe incorrect';
    case 'auth/email-already-in-use': return 'Cet email est déjà utilisé';
    case 'auth/weak-password': return 'Mot de passe trop faible (6 caractères min.)';
    case 'auth/network-request-failed': return 'Pas de connexion internet';
    case 'auth/too-many-requests': return 'Trop de tentatives, réessaie plus tard';
    default: return err?.message || 'Erreur d’authentification';
  }
}

// ============================================================
// Menu compte (dans la topbar)
// ============================================================
// ============================================================
// Actualités (notifications) — éditable ici
// ============================================================
// Pour ajouter une actualité : ajoute une entrée tout EN HAUT du tableau.
// id : identifiant unique (string) — utilisé pour marquer comme lu.
// Le badge rouge sur le bouton apparaît tant qu'au moins une actualité n'est pas lue.
const NEWS_FEED = [
  {
    id: '2026-05-20-addNotification',
    title: 'Bienvenue sur NextRep 🎉',
    date: '20 mai 2026',
    body: "Ajout des notifications au sein de l'application !",
  },
];

const NEWS_READ_KEY = 'nextrep.newsRead';
function getReadNews() {
  try { return new Set(JSON.parse(localStorage.getItem(NEWS_READ_KEY) || '[]')); }
  catch (_) { return new Set(); }
}
function markAllNewsRead() {
  try {
    localStorage.setItem(NEWS_READ_KEY, JSON.stringify(NEWS_FEED.map(n => n.id)));
  } catch (_) {}
  updateNotifsBadge();
}
function updateNotifsBadge() {
  const badge = $('#notifs-badge');
  if (!badge) return;
  const read = getReadNews();
  const unread = NEWS_FEED.some(n => !read.has(n.id));
  badge.hidden = !unread;
}

function openNotificationsPanel() {
  const backdrop = el('div', { class: 'modal-backdrop', onclick: e => { if (e.target === backdrop) close(); } });
  const close = () => { markAllNewsRead(); backdrop.remove(); };

  const list = el('div', { class: 'news-list' });
  if (NEWS_FEED.length === 0) {
    list.appendChild(el('p', { class: 'muted text-center' }, 'Aucune actualité pour le moment.'));
  } else {
    const read = getReadNews();
    for (const n of NEWS_FEED) {
      const item = el('div', { class: 'news-item' + (read.has(n.id) ? '' : ' unread') },
        el('div', { class: 'news-head' },
          el('h3', { class: 'news-title' }, n.title),
          el('span', { class: 'news-date' }, n.date),
        ),
        el('p', { class: 'news-body' }, n.body),
      );
      list.appendChild(item);
    }
  }

  const modal = el('div', { class: 'modal' },
    el('h2', {}, 'Actualités'),
    list,
    el('button', { class: 'btn btn-block mt-2', type: 'button', onclick: close }, 'Fermer'),
  );

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

function openAccountMenu() {
  const user = Auth.currentUser();
  if (!user) return;

  const backdrop = el('div', { class: 'modal-backdrop', onclick: e => { if (e.target === backdrop) close(); } });
  const close = () => backdrop.remove();

  const modal = el('div', { class: 'modal' },
    el('h2', {}, 'Mon compte'),
    el('p', { class: 'muted', style: 'margin: 0 0 4px;' },
      user.displayName ? `Connecté en tant que ${user.displayName}` : 'Connecté'),
    el('p', { class: 'muted', style: 'margin: 0 0 16px; font-size: 13px;' }, user.email || ''),
    el('button', {
      class: 'btn btn-primary btn-block',
      onclick: () => { close(); navigate('profile'); },
    }, '👤 Mon profil (taille, poids…)'),
    el('button', {
      class: 'btn btn-block mt-2',
      onclick: async () => {
        await Auth.flush();
        toast('Synchronisé');
      },
    }, '⟳ Forcer la synchronisation'),
    el('button', {
      class: 'btn btn-danger btn-block mt-2',
      onclick: () => {
        confirmDialog('Se déconnecter ? Tes données restent sauvegardées dans le cloud.', async () => {
          close();
          try {
            await Auth.flush();
            clearActive();
            await Auth.signOut();
          } catch (err) {
            toast('Erreur de déconnexion');
          }
        });
      },
    }, 'Se déconnecter'),
    el('button', {
      class: 'btn btn-ghost btn-block mt-2',
      onclick: close,
    }, 'Fermer'),
  );
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

// ============================================================
// View : Programmes (liste)
// ============================================================
function renderPrograms(root) {
  const greeting = greetingByHour();
  const firstName = (store.profile?.name || Auth.currentUser()?.displayName || '').trim().split(' ')[0];
  setTitle(firstName ? `${greeting}, ${firstName}` : greeting);
  showFab('+', () => createProgram());

  // Dashboard hero (rang + nutrition du jour)
  root.appendChild(buildDashboardHero());

  if (store.programs.length === 0) {
    root.appendChild(emptyState(
      '📋',
      'Aucun programme',
      'Crée ton premier programme de musculation pour commencer.',
      'Créer un programme',
      () => createProgram(),
    ));
    return;
  }

  root.appendChild(el('h2', { class: 'section-title' },
    el('span', {}, 'Mes programmes'),
    el('span', { class: 'muted', style: 'font-family: var(--font-mono); font-size: 11px; font-weight: 400;' },
      `${store.programs.length}`),
  ));

  for (const p of store.programs) {
    const exCount = p.exercises.length;
    const setCount = p.exercises.reduce((acc, e) => acc + (parseInt(e.sets) || 0), 0);
    const lastSession = store.sessions
      .filter(s => s.programId === p.id)
      .sort((a, b) => b.date - a.date)[0];

    const card = el('div', { class: 'card clickable', onclick: () => navigate('program-edit', { id: p.id }) },
      el('div', { class: 'card-row' },
        el('div', {},
          el('p', { class: 'card-title' }, p.name || 'Sans titre'),
          p.description ? el('p', { class: 'card-sub' }, p.description) : null,
        ),
      ),
      el('div', { class: 'card-meta' },
        el('span', {}, `💪 ${exCount} ${exCount > 1 ? 'exercices' : 'exercice'}`),
        el('span', {}, `🔢 ${setCount} séries`),
        lastSession ? el('span', {}, `📅 ${fmtDate(lastSession.date)}`) : el('span', {}, '— jamais fait'),
      ),
      el('div', { class: 'card-actions' },
        el('button', {
          class: 'btn btn-primary btn-sm',
          onclick: e => { e.stopPropagation(); startSessionFromProgram(p.id); },
        }, '▶ Démarrer séance'),
        el('button', {
          class: 'btn btn-sm btn-ghost',
          onclick: e => { e.stopPropagation(); navigate('program-edit', { id: p.id }); },
        }, 'Modifier'),
      ),
    );
    root.appendChild(card);
  }
}

function greetingByHour() {
  const h = new Date().getHours();
  if (h < 6) return 'Bonne nuit';
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function buildDashboardHero() {
  const wrap = el('div', { class: 'hero-grid' });

  // Tile 1 : Rang global — fond glass, logo prominent, glow de la couleur du rang
  const ranks = computeRanks(store);
  const overall = overallRank(ranks);
  const rankTile = el('div', {
    class: 'hero-tile hero-tile-rank' + (overall ? '' : ' empty'),
    style: overall ? `--rank-color: ${overall.color}; --rank-glow: ${overall.glow};` : '',
    onclick: () => navigate('progress'),
  },
    el('div', { class: 'rank-tile-text' },
      el('div', { class: 'hero-eyebrow' }, 'Mon rang'),
      el('div', { class: 'hero-headline rank-tile-name' },
        overall ? overall.name : 'À débloquer'),
      el('div', { class: 'hero-sub' },
        overall ? 'Voir le détail →' : 'Termine une séance'),
    ),
    overall
      ? el('img', { class: 'rank-tile-logo', src: RANK_LOGOS[overall.id], alt: '', loading: 'lazy' })
      : el('div', { class: 'rank-tile-logo-placeholder' }, '✦'),
  );
  wrap.appendChild(rankTile);

  // Tile 2 : Nutrition du jour
  const today = todayKey();
  const entries = store.nutritionLog?.[today] || [];
  const kcalToday = entries.reduce((a, e) => a + (Number(e.kcal) || 0), 0);
  const kcalTarget = store.macroTargets?.kcal;
  const nutritionTile = el('div', {
    class: 'hero-tile hero-tile-glass',
    onclick: () => navigate('nutrition'),
  },
    el('div', {},
      el('div', { class: 'hero-eyebrow' }, 'Aujourd’hui'),
      el('div', { class: 'hero-headline' },
        kcalTarget
          ? `${Math.round(kcalToday)}`
          : '—',
      ),
      kcalTarget
        ? el('div', { class: 'hero-sub' }, `/ ${Math.round(kcalTarget)} kcal`)
        : el('div', { class: 'hero-sub' }, 'kcal'),
    ),
    el('div', { class: 'hero-sub', style: 'color: var(--text-dim);' },
      entries.length ? `${entries.length} repas` : 'Ouvrir nutrition →'),
  );
  wrap.appendChild(nutritionTile);

  return wrap;
}

function createProgram() {
  const program = {
    id: uid(),
    name: 'Nouveau programme',
    description: '',
    createdAt: Date.now(),
    exercises: [],
  };
  store.programs.push(program);
  saveState();
  navigate('program-edit', { id: program.id });
}

// ============================================================
// View : Édition d'un programme
// ============================================================
function renderProgramEdit(root, programId) {
  const program = store.programs.find(p => p.id === programId);
  if (!program) { navigate('programs'); return; }

  setTitle('Modifier le programme');

  const nameField = el('div', { class: 'field' },
    el('label', {}, 'Nom du programme'),
    el('input', {
      class: 'input',
      type: 'text',
      value: program.name,
      placeholder: 'Ex : Push, Pull, Legs…',
      oninput: e => { program.name = e.target.value; saveState(); },
    }),
  );

  const descField = el('div', { class: 'field' },
    el('label', {}, 'Description (optionnel)'),
    el('textarea', {
      class: 'textarea',
      placeholder: 'Objectifs, notes, etc.',
      oninput: e => { program.description = e.target.value; saveState(); },
    }, program.description || ''),
  );

  root.appendChild(nameField);
  root.appendChild(descField);

  root.appendChild(el('h2', { class: 'section-title' }, 'Exercices'));

  const list = el('div', { class: 'exercises-list' });
  root.appendChild(list);

  function renderExercises() {
    list.innerHTML = '';
    if (program.exercises.length === 0) {
      list.appendChild(el('p', { class: 'muted text-center', style: 'padding: 16px 0;' },
        'Aucun exercice. Ajoutes-en un ci-dessous.'));
    }
    program.exercises.forEach((ex, idx) => list.appendChild(buildExerciseCard(program, ex, idx, renderExercises)));
  }

  renderExercises();

  root.appendChild(el('button', {
    class: 'btn btn-block mt-2',
    onclick: () => {
      program.exercises.push({
        id: uid(),
        name: '',
        sets: 3,
        reps: 10,
        restSeconds: 90,
      });
      saveState();
      renderExercises();
    },
  }, '+ Ajouter un exercice'));

  root.appendChild(el('button', {
    class: 'btn btn-primary btn-block mt-2',
    onclick: () => {
      if (program.exercises.length === 0) {
        toast('Ajoute au moins un exercice avant de démarrer');
        return;
      }
      startSessionFromProgram(program.id);
    },
  }, '▶ Démarrer une séance'));

  root.appendChild(el('button', {
    class: 'btn btn-danger btn-block mt-2',
    onclick: () => {
      confirmDialog(`Supprimer définitivement « ${program.name} » ? (Les séances déjà enregistrées sont conservées.)`, () => {
        store.programs = store.programs.filter(p => p.id !== program.id);
        saveState();
        toast('Programme supprimé');
        navigate('programs');
      });
    },
  }, 'Supprimer le programme'));

  root.appendChild(el('button', {
    class: 'btn btn-ghost btn-block mt-2',
    onclick: () => navigate('programs'),
  }, '← Retour'));
}

function buildExerciseCard(program, ex, idx, refresh) {
  if (!Array.isArray(ex.muscleGroups)) ex.muscleGroups = [];

  return el('div', { class: 'exercise-card' },
    el('div', { class: 'exercise-head' },
      el('input', {
        class: 'exercise-name',
        type: 'text',
        value: ex.name,
        placeholder: `Exercice ${idx + 1} (ex : Développé couché)`,
        oninput: e => { ex.name = e.target.value; saveState(); },
      }),
      el('button', {
        class: 'btn btn-sm btn-ghost',
        title: 'Supprimer',
        onclick: () => {
          program.exercises.splice(idx, 1);
          saveState();
          refresh();
        },
      }, '🗑'),
    ),
    el('div', { class: 'exercise-grid' },
      buildNumField('Séries', ex.sets, 1, 20, v => { ex.sets = v; saveState(); }),
      buildNumField('Reps', ex.reps, 1, 100, v => { ex.reps = v; saveState(); }),
      buildNumField('Repos (s)', ex.restSeconds, 0, 600, v => { ex.restSeconds = v; saveState(); }, 15),
    ),
    buildMuscleGroupSelector(ex),
  );
}

function buildMuscleGroupSelector(ex) {
  if (!Array.isArray(ex.muscleGroups)) ex.muscleGroups = [];
  const wrap = el('div', { class: 'field', style: 'margin-top: 8px; margin-bottom: 0;' },
    el('label', {}, 'Groupes musculaires'),
  );
  const chips = el('div', { class: 'muscle-chips' });

  const auto = detectGroups(ex.name || '');
  const showAuto = ex.muscleGroups.length === 0 && auto.length > 0;

  for (const g of MUSCLE_GROUPS) {
    const isSelected = ex.muscleGroups.includes(g.id);
    const isAuto = showAuto && auto.includes(g.id);
    const chip = el('button', {
      type: 'button',
      class: 'muscle-chip' + (isSelected ? ' selected' : '') + (isAuto ? ' auto' : ''),
      onclick: () => {
        if (ex.muscleGroups.includes(g.id)) {
          ex.muscleGroups = ex.muscleGroups.filter(x => x !== g.id);
        } else {
          ex.muscleGroups = [...ex.muscleGroups, g.id];
        }
        saveState();
        // Refresh chips
        const newWrap = buildMuscleGroupSelector(ex);
        wrap.replaceWith(newWrap);
      },
    }, g.name);
    chips.appendChild(chip);
  }
  wrap.appendChild(chips);
  if (showAuto) {
    wrap.appendChild(el('p', { class: 'muted', style: 'font-size: 11px; margin: 4px 0 0;' },
      `🤖 Détectés automatiquement : ${auto.map(id => MUSCLE_GROUPS.find(m => m.id === id)?.name).filter(Boolean).join(', ')}`));
  }
  return wrap;
}

function buildNumField(label, value, min, max, onChange, step = 1) {
  return el('div', { class: 'field' },
    el('label', {}, label),
    el('input', {
      class: 'input input-num',
      type: 'number',
      value: value,
      min: String(min),
      max: String(max),
      step: String(step),
      inputmode: 'numeric',
      onchange: e => {
        let v = parseInt(e.target.value);
        if (isNaN(v)) v = min;
        v = Math.max(min, Math.min(max, v));
        e.target.value = v;
        onChange(v);
      },
    }),
  );
}

// ============================================================
// View : Séance (accueil — choix ou reprise)
// ============================================================
function renderSessionHome(root) {
  if (store.activeSession) {
    navigate('session-active');
    return;
  }
  navigate('session-pick');
}

function renderSessionPick(root) {
  setTitle('Démarrer');

  if (store.programs.length === 0) {
    root.appendChild(emptyState(
      '🏋️',
      'Aucun programme',
      'Crée un programme avant de pouvoir démarrer une séance.',
      'Créer un programme',
      () => { navigate('programs'); setTimeout(() => createProgram(), 50); },
    ));
    return;
  }

  // Programme le plus récemment utilisé en hero
  const programsWithStats = store.programs.map(p => {
    const sessions = store.sessions.filter(s => s.programId === p.id);
    const last = sessions.sort((a, b) => b.date - a.date)[0];
    return {
      program: p,
      lastDate: last?.date || null,
      sessionCount: sessions.length,
      lastVolume: last
        ? last.exercises.reduce((a, ex) => a + ex.sets.reduce((b, set) => b + (set.weight || 0) * (set.reps || 0), 0), 0)
        : 0,
    };
  });
  // Tri : programme le plus récemment utilisé en premier
  programsWithStats.sort((a, b) => (b.lastDate || 0) - (a.lastDate || 0));

  const featured = programsWithStats[0];
  const rest = programsWithStats.slice(1);

  if (featured) {
    root.appendChild(el('div', { class: 'pick-hero', onclick: () => startSessionFromProgram(featured.program.id) },
      el('div', { class: 'pick-hero-text' },
        el('div', { class: 'hero-eyebrow' },
          featured.lastDate ? 'Reprendre ta routine' : 'Démarrer'),
        el('div', { class: 'pick-hero-name' }, featured.program.name || 'Sans titre'),
        el('div', { class: 'pick-hero-meta' },
          el('span', {}, `${featured.program.exercises.length} exercices`),
          featured.lastDate ? el('span', {}, '·') : null,
          featured.lastDate ? el('span', {}, `Dernière : ${relativeDate(featured.lastDate)}`) : null,
        ),
      ),
      el('div', { class: 'pick-hero-cta' }, '▶'),
    ));
  }

  if (rest.length) {
    root.appendChild(el('h2', { class: 'section-title' }, 'Autres programmes'));
    for (const { program: p, lastDate, sessionCount } of rest) {
      const card = el('div', { class: 'card clickable pick-card', onclick: () => startSessionFromProgram(p.id) },
        el('div', { class: 'card-row' },
          el('div', {},
            el('p', { class: 'card-title' }, p.name || 'Sans titre'),
            el('p', { class: 'card-sub' },
              `${p.exercises.length} ex.${lastDate ? ' · ' + relativeDate(lastDate) : ' · jamais fait'}`),
          ),
          el('div', { class: 'pick-card-cta' }, '▶'),
        ),
      );
      root.appendChild(card);
    }
  }
}

function relativeDate(ts) {
  const now = Date.now();
  const diff = now - ts;
  const day = 86400000;
  if (diff < day) return 'aujourd’hui';
  if (diff < 2 * day) return 'hier';
  if (diff < 7 * day) return `il y a ${Math.floor(diff / day)} j`;
  if (diff < 30 * day) return `il y a ${Math.floor(diff / (7 * day))} sem.`;
  if (diff < 365 * day) return `il y a ${Math.floor(diff / (30 * day))} mois`;
  return fmtDate(ts);
}

function startSessionFromProgram(programId) {
  const program = store.programs.find(p => p.id === programId);
  if (!program) return;
  if (program.exercises.length === 0) {
    toast('Ce programme n’a aucun exercice');
    return;
  }

  const lastSession = store.sessions
    .filter(s => s.programId === programId)
    .sort((a, b) => b.date - a.date)[0];

  const lastByExName = {};
  if (lastSession) {
    for (const ex of lastSession.exercises) {
      lastByExName[ex.name] = ex.sets;
    }
  }

  store.activeSession = {
    id: uid(),
    programId: program.id,
    programName: program.name,
    date: Date.now(),
    startedAt: Date.now(),
    exercises: program.exercises.map(ex => {
      const prev = lastByExName[ex.name] || [];
      const sets = Array.from({ length: ex.sets || 3 }, (_, i) => ({
        targetReps: ex.reps,
        weight: prev[i]?.weight ?? '',
        reps: '',
        done: false,
      }));
      return {
        name: ex.name || 'Exercice',
        muscleGroups: Array.isArray(ex.muscleGroups) ? [...ex.muscleGroups] : [],
        targetSets: ex.sets || 3,
        targetReps: ex.reps || 10,
        restSeconds: ex.restSeconds || 90,
        sets,
      };
    }),
  };
  saveState();
  store.lastProgramId = programId;
  navigate('session-active');
}

// ============================================================
// View : Séance active (logging en cours)
// ============================================================
let restTimer = null;
function startRestTimer(seconds) {
  cancelRestTimer();
  if (!seconds || seconds <= 0) return;
  const endsAt = Date.now() + seconds * 1000;
  restTimer = { endsAt, interval: null, totalSeconds: seconds };
  renderRestTimer();
  restTimer.interval = setInterval(renderRestTimer, 500);

  if (navigator.vibrate) navigator.vibrate(50);
}

function cancelRestTimer() {
  if (restTimer?.interval) clearInterval(restTimer.interval);
  restTimer = null;
  const existing = document.getElementById('rest-timer');
  if (existing) existing.remove();
}

function renderRestTimer() {
  if (!restTimer) return;
  const remaining = Math.max(0, Math.round((restTimer.endsAt - Date.now()) / 1000));
  let bar = document.getElementById('rest-timer');
  if (!bar) {
    bar = el('div', { id: 'rest-timer', class: 'rest-timer' },
      el('div', {},
        el('div', { class: 'rest-timer-label' }, 'Repos'),
        el('div', { class: 'rest-timer-time', id: 'rest-time' }, fmtDuration(remaining)),
      ),
      el('div', { class: 'rest-timer-actions' },
        el('button', { onclick: () => { restTimer.endsAt += 15000; renderRestTimer(); } }, '+15'),
        el('button', { onclick: () => cancelRestTimer() }, '✕'),
      ),
    );
    document.body.appendChild(bar);
  } else {
    bar.querySelector('#rest-time').textContent = fmtDuration(remaining);
  }
  if (remaining <= 0) {
    if (navigator.vibrate) navigator.vibrate([200, 80, 200]);
    cancelRestTimer();
    toast('Repos terminé !');
  }
}

function renderSessionActive(root) {
  const s = store.activeSession;
  if (!s) { navigate('session-pick'); return; }

  setTitle(s.programName);

  const completed = s.exercises.reduce((acc, ex) => acc + ex.sets.filter(set => set.done).length, 0);
  const total = s.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const elapsedMin = Math.max(0, Math.floor((Date.now() - s.startedAt) / 60000));
  const pct = total > 0 ? Math.min(1, completed / total) : 0;

  // Bandeau de progression hero
  const heroBar = el('div', { class: 'session-hero' });
  heroBar.innerHTML = `
    <div class="session-hero-row">
      <div>
        <div class="hero-eyebrow">En cours</div>
        <div class="session-hero-progress">${completed}<span class="session-hero-total">/${total}</span></div>
        <div class="hero-sub">séries · ${elapsedMin} min écoulées</div>
      </div>
      <div class="session-hero-pct">${Math.round(pct * 100)}<span>%</span></div>
    </div>
    <div class="session-progress-track">
      <div class="session-progress-fill" style="width:${pct * 100}%;"></div>
    </div>
  `;
  root.appendChild(heroBar);

  s.exercises.forEach((ex, exIdx) => {
    const exDone = ex.sets.filter(set => set.done).length;
    const exTotal = ex.sets.length;
    const exComplete = exDone === exTotal && exTotal > 0;
    const card = el('div', { class: 'exercise-live' + (exComplete ? ' done' : '') },
      el('div', { class: 'exercise-live-head' },
        el('div', { class: 'exercise-live-num' }, String(exIdx + 1)),
        el('div', { class: 'exercise-live-meta' },
          el('div', { class: 'exercise-live-name' }, ex.name || `Exercice ${exIdx + 1}`),
          el('div', { class: 'exercise-live-target' },
            `${ex.targetSets} × ${ex.targetReps} reps`,
            ' · ',
            `Repos ${ex.restSeconds}s`,
          ),
        ),
        el('div', { class: 'exercise-live-progress' }, `${exDone}/${exTotal}`),
      ),
    );

    const setsWrap = el('div', { style: 'margin-top: 10px;' });
    ex.sets.forEach((set, setIdx) => {
      const row = el('div', { class: 'set-row' + (set.done ? ' done' : '') },
        el('div', { class: 'set-idx' }, String(setIdx + 1)),
        el('div', {},
          el('input', {
            class: 'input input-num',
            type: 'number',
            inputmode: 'decimal',
            placeholder: 'kg',
            step: '0.5',
            min: '0',
            value: set.weight,
            oninput: e => { set.weight = e.target.value; saveState(); },
          }),
          el('div', { class: 'set-target' }, 'kg'),
        ),
        el('div', {},
          el('input', {
            class: 'input input-num',
            type: 'number',
            inputmode: 'numeric',
            placeholder: String(ex.targetReps),
            min: '0',
            value: set.reps,
            oninput: e => { set.reps = e.target.value; saveState(); },
          }),
          el('div', { class: 'set-target' }, 'reps'),
        ),
        el('div', {
          class: 'set-check' + (set.done ? ' done' : ''),
          role: 'button',
          tabindex: '0',
          onclick: () => {
            set.done = !set.done;
            if (set.done) {
              if (set.weight === '' || set.weight == null) set.weight = '0';
              if (set.reps === '' || set.reps == null) set.reps = String(ex.targetReps);
              startRestTimer(ex.restSeconds);
            }
            saveState();
            render();
          },
          html: set.done
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>',
        }),
      );
      setsWrap.appendChild(row);
    });

    card.appendChild(setsWrap);

    card.appendChild(el('div', { class: 'card-actions' },
      el('button', {
        class: 'btn btn-sm',
        onclick: () => {
          ex.sets.push({
            targetReps: ex.targetReps,
            weight: ex.sets.at(-1)?.weight || '',
            reps: '',
            done: false,
          });
          saveState();
          render();
        },
      }, '+ Série'),
      ex.sets.length > 1 ? el('button', {
        class: 'btn btn-sm btn-ghost',
        onclick: () => { ex.sets.pop(); saveState(); render(); },
      }, '− Série') : null,
    ));

    root.appendChild(card);
  });

  root.appendChild(el('button', {
    class: 'btn btn-primary btn-block mt-2',
    onclick: () => finishActiveSession(),
  }, '✓ Terminer la séance'));

  root.appendChild(el('button', {
    class: 'btn btn-danger btn-block mt-2',
    onclick: () => {
      confirmDialog('Abandonner cette séance ? Les données saisies seront perdues.', () => {
        delete store.activeSession;
        cancelRestTimer();
        saveState();
        toast('Séance abandonnée');
        navigate('session-pick');
      });
    },
  }, 'Abandonner'));
}

function finishActiveSession() {
  const s = store.activeSession;
  if (!s) return;

  const recorded = {
    id: s.id,
    programId: s.programId,
    programName: s.programName,
    date: Date.now(),
    durationSeconds: Math.round((Date.now() - s.startedAt) / 1000),
    exercises: s.exercises.map(ex => ({
      name: ex.name,
      muscleGroups: Array.isArray(ex.muscleGroups) ? [...ex.muscleGroups] : [],
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      sets: ex.sets
        .filter(set => set.done || (set.weight !== '' && set.reps !== ''))
        .map(set => ({
          weight: parseFloat(set.weight) || 0,
          reps: parseInt(set.reps) || 0,
        })),
    })).filter(ex => ex.sets.length > 0),
  };

  if (recorded.exercises.length === 0) {
    toast('Aucune série complétée — séance non enregistrée');
    return;
  }

  store.sessions.unshift(recorded);
  delete store.activeSession;
  cancelRestTimer();
  saveState();
  toast('Séance enregistrée 💪');
  navigate('session-detail', { id: recorded.id });
}

// ============================================================
// View : Historique
// ============================================================
function renderHistory(root) {
  setTitle('Historique');

  if (store.sessions.length === 0) {
    root.appendChild(emptyState(
      '📅',
      'Aucune séance enregistrée',
      'Tes séances apparaîtront ici une fois terminées.',
    ));
    return;
  }

  // ---- Stats hero ----
  const now = Date.now();
  const week = 7 * 86400000;
  const monthNow = new Date();
  const sameMonth = ts => {
    const d = new Date(ts);
    return d.getFullYear() === monthNow.getFullYear() && d.getMonth() === monthNow.getMonth();
  };
  const thisWeek = store.sessions.filter(s => now - s.date < week).length;
  const monthSess = store.sessions.filter(s => sameMonth(s.date));
  const monthVolume = monthSess.reduce(
    (a, s) => a + s.exercises.reduce((b, ex) => b + ex.sets.reduce((c, set) => c + (set.weight || 0) * (set.reps || 0), 0), 0), 0,
  );
  const total = store.sessions.length;
  const streak = computeStreak(store.sessions);

  const hero = el('div', { class: 'history-hero' });
  hero.innerHTML = `
    <div class="history-stat">
      <div class="history-stat-val">${streak}</div>
      <div class="history-stat-label">Série en cours</div>
      <div class="history-stat-sub">${streak > 1 ? 'jours d’affilée' : 'jour'}</div>
    </div>
    <div class="history-stat-sep"></div>
    <div class="history-stat">
      <div class="history-stat-val">${monthSess.length}</div>
      <div class="history-stat-label">Ce mois</div>
      <div class="history-stat-sub">${(monthVolume / 1000).toFixed(1)} t levées</div>
    </div>
    <div class="history-stat-sep"></div>
    <div class="history-stat">
      <div class="history-stat-val">${total}</div>
      <div class="history-stat-label">Total</div>
      <div class="history-stat-sub">séances</div>
    </div>
  `;
  root.appendChild(hero);

  // ---- Sessions groupées par mois ----
  const groups = {};
  for (const s of store.sessions) {
    const d = new Date(s.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = { label, items: [] };
    groups[key].items.push(s);
  }
  const sortedKeys = Object.keys(groups).sort().reverse();

  for (const k of sortedKeys) {
    root.appendChild(el('h2', { class: 'section-title' },
      el('span', {}, groups[k].label),
      el('span', { class: 'muted', style: 'font-family: var(--font-mono); font-size: 11px; font-weight: 400;' },
        `${groups[k].items.length}`),
    ));
    for (const s of groups[k].items) {
      const totalSets = s.exercises.reduce((a, ex) => a + ex.sets.length, 0);
      const totalVolume = s.exercises.reduce(
        (a, ex) => a + ex.sets.reduce((b, set) => b + set.weight * set.reps, 0), 0,
      );
      const d = new Date(s.date);
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');

      const card = el('div', { class: 'history-card clickable', onclick: () => navigate('session-detail', { id: s.id }) },
        el('div', { class: 'history-date' },
          el('div', { class: 'history-date-num' }, dayNum),
          el('div', { class: 'history-date-day' }, dayName),
        ),
        el('div', { class: 'history-card-body' },
          el('p', { class: 'card-title' }, s.programName || 'Séance'),
          el('div', { class: 'history-card-meta' },
            el('span', {}, `${s.exercises.length} ex.`),
            el('span', { class: 'dot' }, '·'),
            el('span', {}, `${totalSets} séries`),
            el('span', { class: 'dot' }, '·'),
            el('span', {}, `${Math.round(totalVolume)} kg`),
            s.durationSeconds ? el('span', { class: 'dot' }, '·') : null,
            s.durationSeconds ? el('span', {}, `${Math.round(s.durationSeconds / 60)} min`) : null,
          ),
        ),
        el('div', { class: 'history-card-cta' }, '→'),
      );
      root.appendChild(card);
    }
  }
}

function computeStreak(sessions) {
  if (!sessions || !sessions.length) return 0;
  const dates = new Set();
  for (const s of sessions) {
    const d = new Date(s.date);
    dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  let streak = 0;
  const day = new Date();
  // Si pas de séance aujourd'hui, on autorise (le streak commence à hier)
  const todayKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
  if (!dates.has(todayKey)) day.setDate(day.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    if (dates.has(key)) streak++;
    else break;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

// ============================================================
// View : Détail d'une séance
// ============================================================
function renderSessionDetail(root, sessionId) {
  const s = store.sessions.find(x => x.id === sessionId);
  if (!s) { navigate('history'); return; }

  setTitle('Détail séance');

  // Stats globales
  const totalSets = s.exercises.reduce((a, ex) => a + ex.sets.length, 0);
  const totalVolume = s.exercises.reduce(
    (a, ex) => a + ex.sets.reduce((b, set) => b + (set.weight || 0) * (set.reps || 0), 0), 0,
  );
  const topSet = s.exercises.reduce((best, ex) => {
    for (const set of ex.sets) {
      const e1 = (set.weight || 0) * (1 + (set.reps || 0) / 30);
      if (!best || e1 > best.e1) best = { e1, weight: set.weight, reps: set.reps, name: ex.name };
    }
    return best;
  }, null);

  // En-tête séance
  root.appendChild(el('div', { class: 'detail-hero' },
    el('div', { class: 'hero-eyebrow' }, fmtDateTime(s.date)),
    el('div', { class: 'detail-hero-name' }, s.programName || 'Séance'),
  ));

  // Grille stats
  const stats = el('div', { class: 'detail-stats' });
  stats.innerHTML = `
    <div class="detail-stat">
      <div class="detail-stat-val">${s.exercises.length}</div>
      <div class="detail-stat-label">Exercices</div>
    </div>
    <div class="detail-stat">
      <div class="detail-stat-val">${totalSets}</div>
      <div class="detail-stat-label">Séries</div>
    </div>
    <div class="detail-stat">
      <div class="detail-stat-val">${(totalVolume / 1000).toFixed(1)}<span>t</span></div>
      <div class="detail-stat-label">Volume</div>
    </div>
    <div class="detail-stat">
      <div class="detail-stat-val">${s.durationSeconds ? Math.round(s.durationSeconds / 60) : '—'}<span>${s.durationSeconds ? 'min' : ''}</span></div>
      <div class="detail-stat-label">Durée</div>
    </div>
  `;
  root.appendChild(stats);

  if (topSet) {
    root.appendChild(el('div', { class: 'detail-top' },
      el('div', { class: 'hero-eyebrow' }, 'Top set'),
      el('div', { class: 'detail-top-line' },
        el('span', { class: 'detail-top-w' }, `${topSet.weight} kg`),
        el('span', { class: 'detail-top-x' }, '×'),
        el('span', { class: 'detail-top-r' }, `${topSet.reps} reps`),
      ),
      el('div', { class: 'hero-sub' }, topSet.name),
    ));
  }

  root.appendChild(el('h2', { class: 'section-title' }, 'Détail des exercices'));

  for (const ex of s.exercises) {
    const exVolume = ex.sets.reduce((a, set) => a + (set.weight || 0) * (set.reps || 0), 0);
    const card = el('div', { class: 'card' },
      el('div', { class: 'card-row' },
        el('p', { class: 'card-title' }, ex.name),
        el('div', { class: 'chip chip-accent' }, `${Math.round(exVolume)} kg`),
      ),
    );
    const list = el('div', { style: 'margin-top: 8px;' });
    ex.sets.forEach((set, idx) => {
      list.appendChild(el('div', { class: 'set-row done' },
        el('div', { class: 'set-idx' }, String(idx + 1)),
        el('div', { class: 'tabular text-center' }, `${set.weight} kg`),
        el('div', { class: 'tabular text-center' }, `${set.reps} reps`),
        el('div', {}),
      ));
    });
    card.appendChild(list);
    root.appendChild(card);
  }

  root.appendChild(el('button', {
    class: 'btn btn-danger btn-block mt-2',
    onclick: () => {
      confirmDialog('Supprimer cette séance ?', () => {
        store.sessions = store.sessions.filter(x => x.id !== sessionId);
        saveState();
        toast('Séance supprimée');
        navigate('history');
      });
    },
  }, 'Supprimer'));

  root.appendChild(el('button', {
    class: 'btn btn-ghost btn-block mt-2',
    onclick: () => navigate('history'),
  }, '← Retour'));
}

// ============================================================
// View : Progression (graphes par exercice)
// ============================================================
function renderProgress(root) {
  setTitle('Rang & progrès');

  // Section rang (toujours visible si profil ou séances)
  root.appendChild(buildRankSection());

  if (store.sessions.length === 0) {
    root.appendChild(el('h2', { class: 'section-title' }, 'Progression par exercice'));
    root.appendChild(emptyState(
      '📈',
      'Pas encore de données',
      'Termine au moins une séance pour voir tes progrès.',
    ));
    return;
  }

  root.appendChild(el('h2', { class: 'section-title' }, 'Progression par exercice'));

  const exerciseNames = new Set();
  for (const s of store.sessions) {
    for (const ex of s.exercises) {
      if (ex.name && ex.name.trim()) exerciseNames.add(ex.name.trim());
    }
  }
  const names = Array.from(exerciseNames).sort();

  if (names.length === 0) {
    root.appendChild(emptyState('📈', 'Aucun exercice trouvé', 'Tes données enregistrées sont incomplètes.'));
    return;
  }

  const selected = route.params.exercise && names.includes(route.params.exercise)
    ? route.params.exercise
    : names[0];

  root.appendChild(el('div', { class: 'field' },
    el('label', {}, 'Exercice'),
    el('select', {
      class: 'select',
      onchange: e => navigate('progress', { exercise: e.target.value }),
    },
      ...names.map(n => {
        const opt = el('option', { value: n }, n);
        if (n === selected) opt.selected = true;
        return opt;
      }),
    ),
  ));

  const points = [];
  for (const s of [...store.sessions].sort((a, b) => a.date - b.date)) {
    for (const ex of s.exercises) {
      if (ex.name?.trim() === selected) {
        const maxWeight = Math.max(0, ...ex.sets.map(set => set.weight || 0));
        const totalVolume = ex.sets.reduce((a, set) => a + (set.weight || 0) * (set.reps || 0), 0);
        const bestSet = ex.sets.reduce((best, set) => {
          const w = set.weight || 0, r = set.reps || 0;
          const e1rm = w * (1 + r / 30);
          return e1rm > (best?.e1rm ?? 0) ? { e1rm, weight: w, reps: r } : best;
        }, null);
        points.push({
          date: s.date,
          maxWeight,
          totalVolume,
          e1rm: bestSet?.e1rm || 0,
          totalReps: ex.sets.reduce((a, set) => a + (set.reps || 0), 0),
        });
      }
    }
  }

  if (points.length === 0) {
    root.appendChild(el('p', { class: 'muted text-center', style: 'padding: 24px;' }, 'Aucune donnée pour cet exercice.'));
    return;
  }

  const best = points.reduce((m, p) => p.maxWeight > m.maxWeight ? p : m);
  const bestE1rm = points.reduce((m, p) => p.e1rm > m.e1rm ? p : m);
  const recentVolume = points[points.length - 1].totalVolume;

  root.appendChild(el('div', { class: 'chart-stats' },
    el('div', { class: 'stat-box' },
      el('div', { class: 'stat-val' }, `${best.maxWeight} kg`),
      el('div', { class: 'stat-label' }, 'Record charge'),
    ),
    el('div', { class: 'stat-box' },
      el('div', { class: 'stat-val' }, `${Math.round(bestE1rm.e1rm)} kg`),
      el('div', { class: 'stat-label' }, '1RM estimé'),
    ),
    el('div', { class: 'stat-box' },
      el('div', { class: 'stat-val' }, `${Math.round(recentVolume)}`),
      el('div', { class: 'stat-label' }, 'Volume dernière'),
    ),
  ));

  root.appendChild(el('h2', { class: 'section-title' }, 'Charge max par séance'));
  const chartWrap1 = el('div', { class: 'chart-wrap' });
  const canvas1 = el('canvas');
  chartWrap1.appendChild(canvas1);
  root.appendChild(chartWrap1);

  root.appendChild(el('h2', { class: 'section-title' }, 'Volume total (kg × reps)'));
  const chartWrap2 = el('div', { class: 'chart-wrap' });
  const canvas2 = el('canvas');
  chartWrap2.appendChild(canvas2);
  root.appendChild(chartWrap2);

  requestAnimationFrame(() => {
    drawLineChart(canvas1, points.map(p => ({ x: p.date, y: p.maxWeight })), { unit: 'kg' });
    drawLineChart(canvas2, points.map(p => ({ x: p.date, y: Math.round(p.totalVolume) })), { unit: 'kg' });
  });
}

// ============================================================
// Chart drawer (canvas pur, sans dépendance)
// ============================================================
function drawLineChart(canvas, data, opts = {}) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const padL = 44, padR = 12, padT = 12, padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  if (data.length === 0) return;

  const ys = data.map(d => d.y);
  let yMin = Math.min(...ys);
  let yMax = Math.max(...ys);
  if (yMin === yMax) { yMin = Math.max(0, yMin - 1); yMax = yMax + 1; }
  const range = yMax - yMin;
  yMin = Math.max(0, yMin - range * 0.1);
  yMax = yMax + range * 0.1;

  const xs = data.map(d => d.x);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const xRange = xMax - xMin || 1;

  const xScale = x => padL + ((x - xMin) / xRange) * plotW;
  const yScale = y => padT + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  ctx.strokeStyle = '#2a2f3a';
  ctx.fillStyle = '#9aa3b2';
  ctx.font = '11px -apple-system, sans-serif';
  ctx.lineWidth = 1;
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const y = padT + (plotH * i) / yTicks;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();
    const v = yMax - ((yMax - yMin) * i) / yTicks;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(v) + (opts.unit ? '' : ''), padL - 6, y);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const xLabelTimes = data.length <= 3
    ? data.map(d => d.x)
    : [data[0].x, data[Math.floor(data.length / 2)].x, data[data.length - 1].x];
  for (const t of xLabelTimes) {
    const label = new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    ctx.fillText(label, xScale(t), padT + plotH + 6);
  }

  if (data.length > 1) {
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, 'rgba(255, 106, 61, 0.35)');
    grad.addColorStop(1, 'rgba(255, 106, 61, 0.02)');
    ctx.beginPath();
    ctx.moveTo(xScale(data[0].x), padT + plotH);
    for (const d of data) ctx.lineTo(xScale(d.x), yScale(d.y));
    ctx.lineTo(xScale(data[data.length - 1].x), padT + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  ctx.strokeStyle = '#ff6a3d';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = xScale(d.x), y = yScale(d.y);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = '#ff6a3d';
  for (const d of data) {
    ctx.beginPath();
    ctx.arc(xScale(d.x), yScale(d.y), 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============================================================
// View : Profil (taille, poids, âge, activité)
// ============================================================
function renderProfile(root) {
  setTitle('Mon profil');
  if (!store.profile) store.profile = defaultState().profile;
  const p = store.profile;

  root.appendChild(el('p', { class: 'muted mb-2' },
    'Ces informations servent à calculer tes besoins caloriques et à pondérer ton rang.'));

  root.appendChild(el('div', { class: 'field' },
    el('label', {}, 'Nom affiché'),
    el('input', {
      class: 'input', type: 'text', value: p.name || '',
      placeholder: 'Ex : Alex',
      oninput: e => { p.name = e.target.value; saveState(); },
    }),
  ));

  root.appendChild(el('div', { class: 'row' },
    el('div', { class: 'field' },
      el('label', {}, 'Taille (cm)'),
      el('input', {
        class: 'input', type: 'number', min: '50', max: '250', step: '1',
        inputmode: 'numeric', value: p.height ?? '',
        placeholder: '175',
        oninput: e => { p.height = e.target.value ? parseInt(e.target.value) : null; recomputeMacros(); saveState(); },
      }),
    ),
    el('div', { class: 'field' },
      el('label', {}, 'Poids (kg)'),
      el('input', {
        class: 'input', type: 'number', min: '20', max: '300', step: '0.1',
        inputmode: 'decimal', value: p.weight ?? '',
        placeholder: '70',
        oninput: e => { p.weight = e.target.value ? parseFloat(e.target.value) : null; recomputeMacros(); saveState(); },
      }),
    ),
  ));

  root.appendChild(el('div', { class: 'row' },
    el('div', { class: 'field' },
      el('label', {}, 'Âge'),
      el('input', {
        class: 'input', type: 'number', min: '10', max: '120', step: '1',
        inputmode: 'numeric', value: p.age ?? '',
        placeholder: '25',
        oninput: e => { p.age = e.target.value ? parseInt(e.target.value) : null; recomputeMacros(); saveState(); },
      }),
    ),
    el('div', { class: 'field' },
      el('label', {}, 'Genre'),
      buildSegmented([
        { value: 'male',   label: 'Homme' },
        { value: 'female', label: 'Femme' },
        { value: 'other',  label: 'Autre' },
      ], p.gender || '', v => { p.gender = v; recomputeMacros(); saveState(); navigate('profile'); }),
    ),
  ));

  root.appendChild(el('div', { class: 'field' },
    el('label', {}, 'Niveau d’activité'),
    buildOptionList([
      { value: 'sedentary',   label: 'Sédentaire',  hint: 'Peu ou pas de sport' },
      { value: 'light',       label: 'Léger',       hint: '1 à 3 séances / semaine' },
      { value: 'moderate',    label: 'Modéré',      hint: '3 à 5 séances / semaine' },
      { value: 'active',      label: 'Actif',       hint: '6 à 7 séances / semaine' },
      { value: 'very_active', label: 'Très actif',  hint: '2× / jour ou travail physique' },
    ], p.activityLevel || 'moderate', v => { p.activityLevel = v; recomputeMacros(); saveState(); navigate('profile'); }),
  ));

  // Aperçu calculs
  const tdee = computeTDEE(p);
  if (tdee) {
    root.appendChild(el('div', { class: 'card', style: 'margin-top: 16px;' },
      el('p', { class: 'card-title' }, '📊 Tes besoins estimés'),
      el('div', { class: 'card-meta' },
        el('span', {}, `🔥 ${Math.round(tdee)} kcal/jour`),
        el('span', {}, `💪 ${Math.round(tdee * 0.3 / 4)} g glucides`),
        el('span', {}, `🥩 ${Math.round((p.weight || 70) * 1.8)} g protéines`),
        el('span', {}, `🥑 ${Math.round(tdee * 0.25 / 9)} g lipides`),
      ),
    ));
  }

  root.appendChild(el('button', {
    class: 'btn btn-ghost btn-block mt-2',
    onclick: () => navigate('programs'),
  }, '← Retour'));
}

function buildSegmented(opts, current, onChange) {
  const wrap = el('div', { class: 'segmented' });
  for (const o of opts) {
    const btn = el('button', {
      type: 'button',
      class: 'segmented-item' + (o.value === current ? ' active' : ''),
      onclick: () => onChange(o.value),
    }, o.label);
    wrap.appendChild(btn);
  }
  return wrap;
}

function buildOptionList(opts, current, onChange) {
  const wrap = el('div', { class: 'option-list' });
  for (const o of opts) {
    const isActive = o.value === current;
    const row = el('button', {
      type: 'button',
      class: 'option-row' + (isActive ? ' active' : ''),
      onclick: () => onChange(o.value),
    },
      el('div', { class: 'option-row-text' },
        el('div', { class: 'option-row-label' }, o.label),
        o.hint ? el('div', { class: 'option-row-hint' }, o.hint) : null,
      ),
      el('div', { class: 'option-row-tick' }, isActive ? '✓' : ''),
    );
    wrap.appendChild(row);
  }
  return wrap;
}

// Mifflin-St Jeor BMR puis TDEE
function computeTDEE(p) {
  if (!p || !p.height || !p.weight || !p.age) return null;
  const w = p.weight, h = p.height, a = p.age;
  let bmr;
  if (p.gender === 'female') bmr = 10 * w + 6.25 * h - 5 * a - 161;
  else bmr = 10 * w + 6.25 * h - 5 * a + 5; // par défaut homme
  const mult = ({
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
  })[p.activityLevel] || 1.55;
  return bmr * mult;
}

function recomputeMacros() {
  if (!store.macroTargets) store.macroTargets = defaultState().macroTargets;
  if (!store.macroTargets.auto) return;
  const p = store.profile;
  const tdee = computeTDEE(p);
  if (!tdee) return;
  store.macroTargets.kcal = Math.round(tdee);
  store.macroTargets.protein = Math.round((p.weight || 70) * 1.8);
  store.macroTargets.fat = Math.round(tdee * 0.25 / 9);
  store.macroTargets.carbs = Math.round((tdee - store.macroTargets.protein * 4 - store.macroTargets.fat * 9) / 4);
}

// ============================================================
// View : Nutrition (log quotidien + macros)
// ============================================================
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ensureNutritionDay(dateKey) {
  if (!store.nutritionLog) store.nutritionLog = {};
  if (!store.nutritionLog[dateKey]) store.nutritionLog[dateKey] = [];
  return store.nutritionLog[dateKey];
}

function renderNutrition(root) {
  setTitle('Nutrition');
  const key = route.params.date || todayKey();
  showFab('+', () => openFoodEntry(null, key));

  if (!store.profile) store.profile = defaultState().profile;
  if (!store.macroTargets) store.macroTargets = defaultState().macroTargets;

  // Pas de profil minimal → invite à remplir
  if (!store.profile.weight || !store.profile.height || !store.profile.age) {
    root.appendChild(el('div', { class: 'card' },
      el('p', { class: 'card-title' }, '👤 Complète d’abord ton profil'),
      el('p', { class: 'card-sub' },
        'Taille, poids et âge pour estimer automatiquement tes besoins en calories et macros.'),
      el('button', {
        class: 'btn btn-primary btn-block mt-2',
        onclick: () => navigate('profile'),
      }, 'Renseigner mon profil'),
    ));
    return;
  }

  if (store.macroTargets.auto && (!store.macroTargets.kcal)) {
    recomputeMacros();
    saveState();
  }

  const entries = ensureNutritionDay(key);

  // Date selector
  const navDate = el('div', { class: 'date-nav' },
    el('button', { class: 'btn btn-sm', onclick: () => navigate('nutrition', { date: shiftDay(key, -1) }) }, '◀'),
    el('div', { class: 'date-label' }, prettyDate(key)),
    el('button', { class: 'btn btn-sm', onclick: () => navigate('nutrition', { date: shiftDay(key, +1) }) }, '▶'),
  );
  root.appendChild(navDate);

  // Totaux du jour
  const totals = entries.reduce((acc, e) => ({
    kcal: acc.kcal + (Number(e.kcal) || 0),
    protein: acc.protein + (Number(e.protein) || 0),
    carbs: acc.carbs + (Number(e.carbs) || 0),
    fat: acc.fat + (Number(e.fat) || 0),
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  const tgt = store.macroTargets;
  root.appendChild(buildCalorieHero(totals.kcal, tgt.kcal));
  root.appendChild(el('div', { class: 'macro-bars' },
    macroBar('Protéines',  totals.protein, tgt.protein, 'g', '#22d3ee'),
    macroBar('Glucides',   totals.carbs,   tgt.carbs,   'g', '#a78bfa'),
    macroBar('Lipides',    totals.fat,     tgt.fat,     'g', '#f472b6'),
  ));

  // Édition des cibles
  root.appendChild(el('details', { class: 'targets-edit' },
    el('summary', {}, '⚙️ Ajuster mes objectifs'),
    el('div', { class: 'row', style: 'margin-top: 8px;' },
      el('label', { class: 'switch' },
        el('input', { type: 'checkbox', checked: tgt.auto,
          onchange: e => { tgt.auto = e.target.checked; if (tgt.auto) recomputeMacros(); saveState(); navigate('nutrition', { date: key }); },
        }),
        el('span', {}, 'Calcul automatique (TDEE)'),
      ),
    ),
    el('div', { class: 'macro-targets-grid', style: 'margin-top: 8px;' },
      buildTargetInput('Calories', 'kcal', 'kcal'),
      buildTargetInput('Protéines', 'protein', 'g'),
      buildTargetInput('Glucides', 'carbs', 'g'),
      buildTargetInput('Lipides', 'fat', 'g'),
    ),
  ));

  // Liste des entrées
  root.appendChild(el('h2', { class: 'section-title' }, 'Repas du jour'));
  if (entries.length === 0) {
    root.appendChild(el('p', { class: 'muted text-center', style: 'padding: 16px;' },
      'Aucun aliment renseigné. Tape sur « + » pour ajouter.'));
  } else {
    for (const e of entries) {
      const card = el('div', { class: 'card clickable', onclick: () => openFoodEntry(e, key) },
        el('div', { class: 'card-row' },
          el('div', {},
            el('p', { class: 'card-title' }, e.name),
            el('p', { class: 'card-sub' }, e.time || ''),
          ),
          el('div', { class: 'chip chip-accent' }, `${e.kcal} kcal`),
        ),
        el('div', { class: 'card-meta' },
          el('span', {}, `🥩 ${e.protein || 0}g`),
          el('span', {}, `🌾 ${e.carbs || 0}g`),
          el('span', {}, `🥑 ${e.fat || 0}g`),
        ),
      );
      root.appendChild(card);
    }
  }

  // Aliments favoris
  if (store.savedFoods?.length) {
    root.appendChild(el('h2', { class: 'section-title' }, 'Aliments sauvegardés'));
    const grid = el('div', { class: 'saved-foods' });
    for (const f of store.savedFoods) {
      grid.appendChild(el('button', {
        class: 'saved-food',
        onclick: () => {
          entries.push({
            id: uid(), name: f.name, kcal: f.kcal, protein: f.protein,
            carbs: f.carbs, fat: f.fat, time: timeNow(),
          });
          saveState();
          navigate('nutrition', { date: key });
          toast(`+ ${f.name}`);
        },
      },
        el('div', { class: 'saved-food-name' }, f.name),
        el('div', { class: 'saved-food-meta' }, `${f.kcal} kcal`),
      ));
    }
    root.appendChild(grid);
  }
}

function buildTargetInput(label, key, unit) {
  return el('div', { class: 'field' },
    el('label', {}, label),
    el('div', { class: 'input-suffix' },
      el('input', {
        class: 'input input-num',
        type: 'number', min: '0', step: '1',
        value: store.macroTargets[key] ?? '',
        disabled: store.macroTargets.auto,
        oninput: e => {
          store.macroTargets[key] = e.target.value ? parseInt(e.target.value) : null;
          saveState();
        },
      }),
      el('span', { class: 'suffix' }, unit),
    ),
  );
}

function buildCalorieHero(value, target) {
  const has = target && target > 0;
  const pct = has ? Math.min(1, value / target) : 0;
  const overshoot = has && value > target;
  const remaining = has ? Math.max(0, target - Math.round(value)) : null;
  const r = 78;
  const c = 2 * Math.PI * r;
  const dashOffset = c - c * pct;

  const hero = el('div', { class: 'calorie-hero' });
  hero.innerHTML = `
    <div class="calorie-ring">
      <svg viewBox="0 0 180 180">
        <defs>
          <linearGradient id="kcalGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#22d3ee"/>
            <stop offset="55%" stop-color="#3b82f6"/>
            <stop offset="100%" stop-color="#8b5cf6"/>
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r="${r}" class="kcal-ring-bg"/>
        <circle cx="90" cy="90" r="${r}" class="kcal-ring-fg"
          style="stroke-dasharray:${c};stroke-dashoffset:${dashOffset};"/>
      </svg>
      <div class="calorie-ring-center">
        <div class="calorie-val">${Math.round(value)}</div>
        <div class="calorie-unit">kcal</div>
      </div>
    </div>
    <div class="calorie-meta">
      <div class="calorie-eyebrow">${overshoot ? 'Dépassement' : 'Restantes'}</div>
      <div class="calorie-rem">${has ? (overshoot ? '+' + Math.round(value - target) : remaining) : '—'}</div>
      <div class="calorie-target">${has ? 'Objectif ' + Math.round(target) + ' kcal' : 'Renseigne tes objectifs'}</div>
    </div>
  `;
  return hero;
}

function macroBar(label, value, target, unit, color) {
  const has = target && target > 0;
  const pct = has ? Math.min(1, value / target) : 0;
  const overshoot = has && value > target;
  const bar = el('div', { class: 'macro-bar' });
  bar.innerHTML = `
    <div class="macro-bar-row">
      <span class="macro-bar-label">${label}</span>
      <span class="macro-bar-val">
        <strong>${Math.round(value)}</strong>
        <span class="macro-bar-sep">/</span>${has ? Math.round(target) : '—'}<span class="macro-bar-unit">${unit}</span>
      </span>
    </div>
    <div class="macro-bar-track">
      <div class="macro-bar-fill${overshoot ? ' over' : ''}"
        style="width:${pct * 100}%;background:${color};box-shadow:0 0 12px ${color}66;"></div>
    </div>
  `;
  return bar;
}

function openFoodEntry(existing, dateKey) {
  const isNew = !existing;
  const date = dateKey || todayKey();
  const entry = existing ? { ...existing } : {
    id: uid(), name: '', kcal: 0, protein: 0, carbs: 0, fat: 0, time: timeNow(),
  };

  const backdrop = el('div', { class: 'modal-backdrop', onclick: e => { if (e.target === backdrop) close(); } });
  const close = () => backdrop.remove();

  const inputs = {};
  const makeNum = (key, label, unit) => {
    const input = el('input', {
      class: 'input input-num', type: 'number', min: '0', step: key === 'kcal' ? '1' : '0.1',
      inputmode: 'decimal',
      value: entry[key] ?? 0,
      oninput: e => { entry[key] = parseFloat(e.target.value) || 0; },
    });
    inputs[key] = input;
    return el('div', { class: 'field' },
      el('label', {}, `${label} (${unit})`),
      input,
    );
  };

  const modal = el('div', { class: 'modal' },
    el('h2', {}, isNew ? 'Ajouter un aliment' : 'Modifier l’aliment'),
    el('div', { class: 'field' },
      el('label', {}, 'Nom'),
      el('input', {
        class: 'input', type: 'text', value: entry.name,
        placeholder: 'Ex : Riz complet 100g',
        oninput: e => { entry.name = e.target.value; },
      }),
    ),
    makeNum('kcal', 'Calories', 'kcal'),
    el('div', { class: 'row' },
      makeNum('protein', 'Protéines', 'g'),
      makeNum('carbs', 'Glucides', 'g'),
      makeNum('fat', 'Lipides', 'g'),
    ),
    el('div', { class: 'row' },
      el('button', { class: 'btn', onclick: close }, 'Annuler'),
      el('button', {
        class: 'btn btn-primary',
        onclick: () => {
          if (!entry.name?.trim()) { toast('Donne un nom à l’aliment'); return; }
          const list = ensureNutritionDay(date);
          if (isNew) list.push(entry);
          else {
            const idx = list.findIndex(x => x.id === entry.id);
            if (idx >= 0) list[idx] = entry;
          }
          saveState();
          close();
          navigate('nutrition', { date });
        },
      }, 'Enregistrer'),
    ),
    el('div', { class: 'row mt-2' },
      el('button', {
        class: 'btn btn-sm btn-ghost',
        onclick: () => {
          if (!entry.name?.trim()) { toast('Donne un nom d’abord'); return; }
          if (!store.savedFoods) store.savedFoods = [];
          // évite les doublons par nom
          store.savedFoods = store.savedFoods.filter(f => f.name !== entry.name);
          store.savedFoods.unshift({
            id: uid(), name: entry.name,
            kcal: entry.kcal, protein: entry.protein,
            carbs: entry.carbs, fat: entry.fat,
          });
          if (store.savedFoods.length > 30) store.savedFoods.length = 30;
          saveState();
          toast('Aliment sauvegardé pour réutilisation');
        },
      }, '⭐ Sauvegarder'),
      !isNew ? el('button', {
        class: 'btn btn-sm btn-danger',
        onclick: () => {
          confirmDialog('Supprimer cet aliment ?', () => {
            const list = ensureNutritionDay(date);
            const idx = list.findIndex(x => x.id === entry.id);
            if (idx >= 0) list.splice(idx, 1);
            saveState();
            close();
            navigate('nutrition', { date });
          });
        },
      }, 'Supprimer') : null,
    ),
  );
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

function shiftDay(key, delta) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function prettyDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = todayKey();
  const yest = shiftDay(today, -1);
  if (key === today) return 'Aujourd’hui';
  if (key === yest) return 'Hier';
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' });
}

function timeNow() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ============================================================
// Section rang (intégrée à la page Progression)
// ============================================================
function buildRankSection() {
  const ranks = computeRanks(store);
  const wrap = el('div', { class: 'rank-section' });

  const overall = overallRank(ranks);
  if (overall) {
    wrap.appendChild(el('div', { class: 'overall-rank', style: `--rank-color: ${overall.color}; --rank-glow: ${overall.glow};` },
      el('img', {
        class: 'overall-rank-logo',
        src: RANK_LOGOS[overall.id],
        alt: overall.name,
        loading: 'lazy',
      }),
      el('div', {},
        el('div', { class: 'overall-rank-label' }, 'Rang global'),
        el('div', { class: 'overall-rank-name' }, overall.name),
      ),
    ));
  } else {
    wrap.appendChild(el('p', { class: 'muted text-center', style: 'padding: 8px 0;' },
      'Termine des séances avec des charges renseignées pour obtenir un rang.'));
  }

  // Diagramme corporel
  wrap.appendChild(buildBodyDiagram(ranks));

  // Liste détaillée
  const list = el('div', { class: 'rank-list' });
  for (const g of MUSCLE_GROUPS) {
    const r = ranks[g.id];
    const row = el('div', { class: 'rank-row' + (r ? '' : ' empty') },
      el('div', { class: 'rank-row-name' }, g.name),
      r
        ? el('div', { class: 'rank-row-info' },
            el('span', { class: 'rank-badge', style: `--rank-color: ${r.rank.color}; --rank-glow: ${r.rank.glow};` },
              el('img', { class: 'rank-badge-logo', src: RANK_LOGOS[r.rank.id], alt: '', loading: 'lazy' }),
              r.rank.name,
            ),
            el('span', { class: 'rank-row-meta' },
              `${Math.round(r.e1rm)} kg`,
              r.ratio ? ` · ${r.ratio.toFixed(2)}× PdC` : '',
            ),
          )
        : el('span', { class: 'rank-row-meta muted' }, '— pas encore de données'),
    );
    list.appendChild(row);
  }
  wrap.appendChild(list);

  if (!store.profile?.weight) {
    wrap.appendChild(el('p', { class: 'muted text-center', style: 'font-size: 12px; padding: 8px;' },
      '💡 Renseigne ton poids dans ton profil pour des rangs ajustés au ratio charge/poids de corps.'));
  }

  return wrap;
}

function buildBodyDiagram(ranks) {
  const wrap = el('div', { class: 'body-wrap' });
  const colorOf = g => (ranks[g]?.rank?.color) || null;
  const MUSCLE_REST = '#3a4154'; // muscle anatomique non ranké
  const SKIN = '#1f2330';        // tête / cou / genoux (structure)
  const STROKE = 'rgba(255,255,255,0.18)';

  // Mapping muscle du dataset → groupe de l'app
  const MAP = {
    chest: 'chest', abs: 'abs', obliques: 'abs',
    biceps: 'biceps', triceps: 'triceps', forearms: 'forearms',
    shoulders: 'shoulders', traps: 'traps', back: 'back',
    quadriceps: 'quadriceps', abductors: 'quadriceps',
    hamstrings: 'hamstrings', glutes: 'glutes', calves: 'calves',
    head: null, neck: null, knees: null,
  };

  function renderPolygons(data) {
    return data.map(({ muscle, points }) => {
      const groupId = MAP[muscle];
      const ranked = groupId ? colorOf(groupId) : null;
      let fill;
      if (groupId === null) fill = SKIN;       // structure (tête, cou, genoux)
      else if (ranked)      fill = ranked;     // muscle ranké → couleur du rang
      else                  fill = MUSCLE_REST;// muscle au repos
      const attrs = `fill="${fill}" stroke="${STROKE}" stroke-width="0.5" data-g="${groupId || ''}"`;
      return points.map(p => `<polygon points="${p}" ${attrs}/>`).join('');
    }).join('');
  }

  // ---------- Vue de FACE (anatomique, paths MIT body-highlighter) ----------
  const front = `<svg viewBox="0 0 100 220" xmlns="http://www.w3.org/2000/svg" class="body-diagram" aria-label="Vue de face">
    ${renderPolygons(anteriorData)}
  </svg>`;

  // ---------- Vue de DOS ----------
  const back = `<svg viewBox="0 0 100 220" xmlns="http://www.w3.org/2000/svg" class="body-diagram" aria-label="Vue de dos">
    ${renderPolygons(posteriorData)}
  </svg>`;

  // Toggle Front / Back
  const toggle = el('div', { class: 'body-toggle' },
    el('button', { type: 'button', class: 'body-toggle-btn active', 'data-view': 'front' }, 'Face'),
    el('button', { type: 'button', class: 'body-toggle-btn', 'data-view': 'back' }, 'Dos'),
  );

  const stage = el('div', { class: 'body-stage' });
  stage.innerHTML = front;

  toggle.querySelectorAll('.body-toggle-btn').forEach(btn => {
    btn.onclick = () => {
      toggle.querySelectorAll('.body-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      stage.innerHTML = btn.dataset.view === 'back' ? back : front;
    };
  });

  wrap.appendChild(toggle);
  wrap.appendChild(stage);
  return wrap;
}

// ============================================================
// Service Worker + auto-update
// ============================================================
// IMPORTANT : doit matcher CACHE_NAME dans sw.js et "version" dans version.json
const APP_VERSION = 'v15';

// Intervalle de poll pour les sessions longues (PWA ouverte des heures)
const VERSION_POLL_MS = 5 * 60 * 1000; // 5 min

let __forcingUpdate = false;

async function fetchRemoteVersion() {
  try {
    const resp = await fetch('./version.json', { cache: 'no-store' });
    if (!resp.ok) return null;
    const data = await resp.json();
    return (data && typeof data.version === 'string') ? data.version : null;
  } catch (_) {
    return null;
  }
}

async function forceFullUpdate(reason) {
  if (__forcingUpdate) return;
  __forcingUpdate = true;
  console.log('[NextRep] Force update:', reason);
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        try {
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          await reg.update();
        } catch (_) {}
      }
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch (e) {
    console.warn('[NextRep] forceFullUpdate error', e);
  }
  // Reload : avec les headers no-cache, le nouveau code sera récupéré.
  // On ajoute un query param de cache-busting pour les rares user-agents récalcitrants.
  const url = new URL(window.location.href);
  url.searchParams.set('_v', Date.now().toString(36));
  window.location.replace(url.toString());
}

async function checkVersionAndMaybeReload() {
  const remote = await fetchRemoteVersion();
  if (!remote) return;
  if (remote !== APP_VERSION) {
    await forceFullUpdate(`version.json=${remote} ≠ APP_VERSION=${APP_VERSION}`);
  }
}

function registerSW() {
  if (!('serviceWorker' in navigator)) {
    // Pas de SW : on peut quand même comparer la version au boot
    checkVersionAndMaybeReload();
    return;
  }
  window.addEventListener('load', () => {
    // 1) Check version dès le boot (avant même que le SW soit prêt)
    checkVersionAndMaybeReload();

    // 2) Poll périodique pour les sessions longues
    setInterval(checkVersionAndMaybeReload, VERSION_POLL_MS);
    // Et aussi à chaque retour de l'onglet au premier plan
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkVersionAndMaybeReload();
    });

    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
      // Vérifie une mise à jour à chaque chargement
      reg.update().catch(() => {});
      // Re-update aussi quand on repasse au premier plan
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });

      // Quand un nouveau SW est installé et en attente, on l'active aussitôt
      const promote = sw => {
        if (sw && sw.state === 'installed') {
          // Même s'il n'y a pas encore de controller, skipWaiting est sûr
          sw.postMessage({ type: 'SKIP_WAITING' });
        }
      };
      if (reg.waiting) promote(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => promote(nw));
      });

      // Quand le nouveau SW prend le contrôle, on recharge la page → nouvelle version
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });
    }).catch(err => console.warn('SW registration failed', err));
  });
}
