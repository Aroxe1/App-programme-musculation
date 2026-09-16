/* i18n.js — Internationalisation simple sans dépendance
 *
 *  Usage :
 *    import { t, setLang, getLang } from './i18n.js';
 *    t('auth.login')               → "Connexion" (en FR)
 *    t('common.deleted', { name }) → "« Bench Press » supprimé"
 *
 *  La langue est :
 *    1) Celle stockée dans localStorage si l'user en a choisi une
 *    2) Sinon, celle du navigateur (navigator.language) si supportée
 *    3) Sinon, FR par défaut
 *
 *  Pour ajouter une langue :
 *    - Crée une entrée dans DICTIONARIES avec les clés traduites
 *    - Ajoute-la à AVAILABLE_LANGUAGES
 *
 *  Pour ajouter une nouvelle string :
 *    - Choisis une clé hiérarchique (ex : 'session.start')
 *    - Ajoute la traduction dans CHAQUE dictionnaire
 *    - Remplace le texte hardcodé par t('session.start')
 */

export const AVAILABLE_LANGUAGES = [
  { code: 'fr', label: 'Français',  flag: '🇫🇷' },
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'es', label: 'Español',   flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch',   flag: '🇩🇪' },
];

const LANG_KEY = 'nextrep.lang';
const DEFAULT_LANG = 'fr';

const DICTIONARIES = {
  fr: {
    common: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      close: 'Fermer',
      back: 'Retour',
      yes: 'Oui',
      no: 'Non',
      confirm: 'Confirmer',
      loading: 'Chargement…',
      synced: 'Synchronisé',
    },
    nav: {
      programs: 'Programmes',
      session: 'Séance',
      nutrition: 'Nutrition',
      history: 'Historique',
      rank: 'Rang',
    },
    auth: {
      title_login: 'Connecte-toi pour retrouver tes programmes',
      title_signup: 'Crée un compte pour synchroniser tes séances',
      tab_login: 'Connexion',
      tab_signup: 'Inscription',
      with_google: 'Continuer avec Google',
      or: 'ou',
      email: 'Email',
      password: 'Mot de passe',
      password_confirm: 'Confirmer le mot de passe',
      display_name: 'Nom affiché (optionnel)',
      login_btn: 'Se connecter',
      signup_btn: 'Créer le compte',
      forgot: 'Mot de passe oublié ?',
      accept_cgu: 'J\'accepte les',
      and_privacy: 'et la',
      cgu: 'CGU',
      privacy: 'Politique de confidentialité',
    },
    account: {
      title: 'Mon compte',
      profile: 'Mon profil (taille, poids…)',
      my_data: 'Mes données',
      records: 'Mes records',
      library: 'Bibliothèque d\'exercices',
      photos: 'Photos de progression',
      management: 'Gestion',
      export: 'Exporter mes données (JSON)',
      sync: 'Forcer la synchronisation',
      account: 'Compte',
      logout: 'Se déconnecter',
      delete_account: 'Supprimer mon compte',
      language: 'Langue',
    },
    programs: {
      title: 'Programmes',
      empty_title: 'Aucun programme',
      empty_hint: 'Démarre vite avec un programme tout fait, génère-le avec l\'IA, ou crée-le toi-même.',
      templates: 'Programmes prêts',
      generate_ai: 'Générer avec l\'IA',
      create_manual: 'Créer manuellement',
      add_exercise: 'Ajouter un exercice',
      start_session: 'Démarrer une séance',
      share: 'Partager',
      pick_library: 'Choisir depuis la bibliothèque',
      add_manual: 'Saisir manuellement',
    },
    greeting: {
      morning: 'Bonjour',
      afternoon: 'Bon après-midi',
      evening: 'Bonsoir',
      night: 'Bonne nuit',
    },
    streak: {
      label: 'Série',
      one_day: 'jour d\'affilée',
      many_days: 'jours d\'affilée',
      start: 'démarre ta série',
    },
  },

  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      yes: 'Yes',
      no: 'No',
      confirm: 'Confirm',
      loading: 'Loading…',
      synced: 'Synced',
    },
    nav: {
      programs: 'Programs',
      session: 'Workout',
      nutrition: 'Nutrition',
      history: 'History',
      rank: 'Rank',
    },
    auth: {
      title_login: 'Log in to find your programs',
      title_signup: 'Create an account to sync your workouts',
      tab_login: 'Log in',
      tab_signup: 'Sign up',
      with_google: 'Continue with Google',
      or: 'or',
      email: 'Email',
      password: 'Password',
      password_confirm: 'Confirm password',
      display_name: 'Display name (optional)',
      login_btn: 'Log in',
      signup_btn: 'Create account',
      forgot: 'Forgot password?',
      accept_cgu: 'I accept the',
      and_privacy: 'and the',
      cgu: 'Terms',
      privacy: 'Privacy Policy',
    },
    account: {
      title: 'My account',
      profile: 'My profile (height, weight…)',
      my_data: 'My data',
      records: 'My records',
      library: 'Exercise library',
      photos: 'Progress photos',
      management: 'Management',
      export: 'Export my data (JSON)',
      sync: 'Force sync',
      account: 'Account',
      logout: 'Log out',
      delete_account: 'Delete my account',
      language: 'Language',
    },
    programs: {
      title: 'Programs',
      empty_title: 'No program yet',
      empty_hint: 'Start quickly with a ready-made plan, generate one with AI, or build it yourself.',
      templates: 'Ready-made plans',
      generate_ai: 'Generate with AI',
      create_manual: 'Build manually',
      add_exercise: 'Add an exercise',
      start_session: 'Start workout',
      share: 'Share',
      pick_library: 'Pick from library',
      add_manual: 'Type manually',
    },
    greeting: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      night: 'Good night',
    },
    streak: {
      label: 'Streak',
      one_day: 'day in a row',
      many_days: 'days in a row',
      start: 'start your streak',
    },
  },

  es: {
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Modificar',
      close: 'Cerrar',
      back: 'Volver',
      yes: 'Sí',
      no: 'No',
      confirm: 'Confirmar',
      loading: 'Cargando…',
      synced: 'Sincronizado',
    },
    nav: {
      programs: 'Programas',
      session: 'Sesión',
      nutrition: 'Nutrición',
      history: 'Historial',
      rank: 'Rango',
    },
    auth: {
      title_login: 'Inicia sesión para recuperar tus programas',
      title_signup: 'Crea una cuenta para sincronizar tus sesiones',
      tab_login: 'Iniciar sesión',
      tab_signup: 'Registrarse',
      with_google: 'Continuar con Google',
      or: 'o',
      email: 'Correo',
      password: 'Contraseña',
      password_confirm: 'Confirmar contraseña',
      display_name: 'Nombre mostrado (opcional)',
      login_btn: 'Iniciar sesión',
      signup_btn: 'Crear cuenta',
      forgot: '¿Contraseña olvidada?',
      accept_cgu: 'Acepto los',
      and_privacy: 'y la',
      cgu: 'Términos',
      privacy: 'Política de privacidad',
    },
    account: {
      title: 'Mi cuenta',
      profile: 'Mi perfil (altura, peso…)',
      my_data: 'Mis datos',
      records: 'Mis récords',
      library: 'Biblioteca de ejercicios',
      photos: 'Fotos de progreso',
      management: 'Gestión',
      export: 'Exportar mis datos (JSON)',
      sync: 'Forzar sincronización',
      account: 'Cuenta',
      logout: 'Cerrar sesión',
      delete_account: 'Eliminar mi cuenta',
      language: 'Idioma',
    },
    programs: {
      title: 'Programas',
      empty_title: 'Sin programa',
      empty_hint: 'Empieza con un plan listo, genera uno con IA, o créalo tú mismo.',
      templates: 'Planes listos',
      generate_ai: 'Generar con IA',
      create_manual: 'Crear manualmente',
      add_exercise: 'Añadir un ejercicio',
      start_session: 'Empezar sesión',
      share: 'Compartir',
      pick_library: 'Elegir de la biblioteca',
      add_manual: 'Escribir manualmente',
    },
    greeting: {
      morning: 'Buenos días',
      afternoon: 'Buenas tardes',
      evening: 'Buenas noches',
      night: 'Buenas noches',
    },
    streak: {
      label: 'Racha',
      one_day: 'día seguido',
      many_days: 'días seguidos',
      start: 'empieza tu racha',
    },
  },

  de: {
    common: {
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      close: 'Schließen',
      back: 'Zurück',
      yes: 'Ja',
      no: 'Nein',
      confirm: 'Bestätigen',
      loading: 'Laden…',
      synced: 'Synchronisiert',
    },
    nav: {
      programs: 'Programme',
      session: 'Training',
      nutrition: 'Ernährung',
      history: 'Verlauf',
      rank: 'Rang',
    },
    auth: {
      title_login: 'Melde dich an, um deine Programme zu finden',
      title_signup: 'Erstelle ein Konto, um deine Trainings zu synchronisieren',
      tab_login: 'Anmelden',
      tab_signup: 'Registrieren',
      with_google: 'Mit Google fortfahren',
      or: 'oder',
      email: 'E-Mail',
      password: 'Passwort',
      password_confirm: 'Passwort bestätigen',
      display_name: 'Anzeigename (optional)',
      login_btn: 'Anmelden',
      signup_btn: 'Konto erstellen',
      forgot: 'Passwort vergessen?',
      accept_cgu: 'Ich akzeptiere die',
      and_privacy: 'und die',
      cgu: 'AGB',
      privacy: 'Datenschutzerklärung',
    },
    account: {
      title: 'Mein Konto',
      profile: 'Mein Profil (Größe, Gewicht…)',
      my_data: 'Meine Daten',
      records: 'Meine Rekorde',
      library: 'Übungsbibliothek',
      photos: 'Fortschrittsfotos',
      management: 'Verwaltung',
      export: 'Meine Daten exportieren (JSON)',
      sync: 'Synchronisierung erzwingen',
      account: 'Konto',
      logout: 'Abmelden',
      delete_account: 'Mein Konto löschen',
      language: 'Sprache',
    },
    programs: {
      title: 'Programme',
      empty_title: 'Noch kein Programm',
      empty_hint: 'Starte schnell mit einem fertigen Plan, generiere einen mit KI oder erstelle ihn selbst.',
      templates: 'Fertige Pläne',
      generate_ai: 'Mit KI generieren',
      create_manual: 'Manuell erstellen',
      add_exercise: 'Übung hinzufügen',
      start_session: 'Training starten',
      share: 'Teilen',
      pick_library: 'Aus Bibliothek wählen',
      add_manual: 'Manuell eingeben',
    },
    greeting: {
      morning: 'Guten Morgen',
      afternoon: 'Guten Tag',
      evening: 'Guten Abend',
      night: 'Gute Nacht',
    },
    streak: {
      label: 'Serie',
      one_day: 'Tag in Folge',
      many_days: 'Tage in Folge',
      start: 'starte deine Serie',
    },
  },
};

function detectInitialLang() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && DICTIONARIES[stored]) return stored;
  } catch (_) {}
  const nav = (navigator.language || '').slice(0, 2).toLowerCase();
  if (DICTIONARIES[nav]) return nav;
  return DEFAULT_LANG;
}

let currentLang = detectInitialLang();

export function getLang() { return currentLang; }

export function setLang(lang) {
  if (!DICTIONARIES[lang]) return;
  currentLang = lang;
  try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
  document.documentElement.lang = lang;
}

/** Récupère une traduction par sa clé pointée (ex : 'auth.login'). */
export function t(key, params) {
  const dict = DICTIONARIES[currentLang] || DICTIONARIES[DEFAULT_LANG];
  const parts = key.split('.');
  let val = dict;
  for (const p of parts) {
    val = val?.[p];
    if (val == null) break;
  }
  // Fallback : si la clé n'existe pas dans la langue choisie, on tente FR
  if (val == null && currentLang !== DEFAULT_LANG) {
    let fbVal = DICTIONARIES[DEFAULT_LANG];
    for (const p of parts) fbVal = fbVal?.[p];
    val = fbVal;
  }
  if (val == null) return key; // Renvoie la clé brute si rien trouvé
  if (params) {
    return val.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? '');
  }
  return val;
}

// Définit la langue HTML au boot
document.documentElement.lang = currentLang;
