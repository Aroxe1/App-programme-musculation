/* exercise-db.js — Banque d'exercices avec descriptions + GIF/images
 *
 * Source : free-exercise-db (https://github.com/yuhonas/free-exercise-db)
 * Licence : Unlicense (domaine public)
 *
 * - JSON chargé une fois depuis le CDN jsdelivr (~600 KB), mis en cache localStorage
 * - Images servies à la demande depuis le même CDN
 * - Filtres : par texte (nom), par groupe musculaire principal
 *
 * Mapping muscles free-exercise-db → groupes NextRep
 *   chest        → chest
 *   shoulders    → shoulders
 *   biceps       → biceps
 *   triceps      → triceps
 *   forearms     → forearms
 *   abdominals   → abs
 *   lats / middle back / lower back / traps → back / traps
 *   glutes       → glutes
 *   hamstrings   → hamstrings
 *   quadriceps   → quadriceps
 *   calves       → calves
 *   neck         → traps
 */

const DB_URL = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json';
const IMG_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';
const CACHE_KEY = 'nextrep.exerciseDb.v1';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

let _exercises = null;
let _loadPromise = null;

/** Charge la base d'exercices (avec cache localStorage). */
export function loadExercises() {
  if (_exercises) return Promise.resolve(_exercises);
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    // Tente le cache localStorage d'abord
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ts, data } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL_MS && Array.isArray(data)) {
          _exercises = data;
          return data;
        }
      }
    } catch (_) {}

    // Sinon fetch depuis CDN
    const resp = await fetch(DB_URL);
    if (!resp.ok) throw new Error(`Failed to load exercise DB: HTTP ${resp.status}`);
    const data = await resp.json();
    _exercises = data;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch (_) { /* quota dépassé : on ignore, on rechargera */ }
    return data;
  })();

  return _loadPromise;
}

/** URL absolue d'une image d'exercice (les exos ont 0, 1 ou 2 images). */
export function exerciseImageUrl(exercise, index = 0) {
  if (!exercise?.images || !exercise.images[index]) return null;
  return IMG_BASE + exercise.images[index];
}

/**
 * Recherche full-text + filtre par groupe musculaire NextRep.
 * @param {string} query  Texte de recherche (nom)
 * @param {string|null} group  Groupe musculaire NextRep ou null
 */
export function searchExercises(query, group) {
  if (!_exercises) return [];
  const q = (query || '').trim().toLowerCase();
  const targetMuscles = group ? GROUP_TO_MUSCLES[group] : null;

  return _exercises.filter(ex => {
    if (q && !ex.name.toLowerCase().includes(q)) return false;
    if (targetMuscles) {
      const primary = (ex.primaryMuscles || []).map(m => m.toLowerCase());
      if (!primary.some(m => targetMuscles.includes(m))) return false;
    }
    return true;
  }).slice(0, 80); // limite à 80 résultats pour la perf
}

/** Mapping NextRep group → muscles free-exercise-db (lowercase). */
const GROUP_TO_MUSCLES = {
  chest:      ['chest'],
  shoulders:  ['shoulders'],
  biceps:     ['biceps'],
  triceps:    ['triceps'],
  forearms:   ['forearms'],
  abs:        ['abdominals'],
  back:       ['lats', 'middle back', 'lower back'],
  traps:      ['traps', 'neck'],
  glutes:     ['glutes'],
  hamstrings: ['hamstrings'],
  quadriceps: ['quadriceps'],
  calves:     ['calves'],
};

/** Liste des groupes pour les filtres UI. */
export const FILTER_GROUPS = [
  { id: null,         label: 'Tous' },
  { id: 'chest',      label: 'Pectoraux' },
  { id: 'back',       label: 'Dos' },
  { id: 'shoulders',  label: 'Épaules' },
  { id: 'biceps',     label: 'Biceps' },
  { id: 'triceps',    label: 'Triceps' },
  { id: 'forearms',   label: 'Avant-bras' },
  { id: 'abs',        label: 'Abdominaux' },
  { id: 'traps',      label: 'Trapèzes' },
  { id: 'quadriceps', label: 'Quadriceps' },
  { id: 'hamstrings', label: 'Ischios' },
  { id: 'glutes',     label: 'Fessiers' },
  { id: 'calves',     label: 'Mollets' },
];
