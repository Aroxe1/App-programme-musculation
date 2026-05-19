/* ranks.js — système de rangs basé sur les performances
 *
 * Rangs (10 niveaux du plus bas au plus haut) :
 * Bronze < Argent < Or < Platine < Diamant < Émeraude < Maître < Grand Maître < Virtuose < Dieu Grec
 *
 * Chaque groupe musculaire reçoit un rang basé sur le meilleur 1RM estimé
 * (formule d'Epley : w × (1 + r/30)) normalisé par le poids de corps.
 * Sans poids de corps renseigné, on utilise des seuils absolus en kg.
 */

export const RANKS = [
  { id: 'bronze',       name: 'Bronze',       color: '#cd7f32', glow: 'rgba(205, 127, 50, 0.5)' },
  { id: 'argent',       name: 'Argent',       color: '#c0c0c0', glow: 'rgba(192, 192, 192, 0.5)' },
  { id: 'or',           name: 'Or',           color: '#ffd700', glow: 'rgba(255, 215, 0, 0.5)' },
  { id: 'platine',      name: 'Platine',      color: '#a7d8de', glow: 'rgba(167, 216, 222, 0.5)' },
  { id: 'diamant',      name: 'Diamant',      color: '#67e8f9', glow: 'rgba(103, 232, 249, 0.6)' },
  { id: 'emeraude',     name: 'Émeraude',     color: '#10b981', glow: 'rgba(16, 185, 129, 0.6)' },
  { id: 'maitre',       name: 'Maître',       color: '#a855f7', glow: 'rgba(168, 85, 247, 0.6)' },
  { id: 'grand-maitre', name: 'Grand Maître', color: '#ec4899', glow: 'rgba(236, 72, 153, 0.6)' },
  { id: 'virtuose',     name: 'Virtuose',     color: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)' },
  { id: 'dieu-grec',    name: 'Dieu Grec',    color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.8)' },
];

export const RANK_ICONS = {
  bronze: '🥉',
  argent: '🥈',
  or: '🥇',
  platine: '💠',
  diamant: '💎',
  emeraude: '🟢',
  maitre: '🟣',
  'grand-maitre': '🌹',
  virtuose: '🔥',
  'dieu-grec': '⚡',
};

// URL des logos PNG (générés via rank-logos/_generate.py)
export const RANK_LOGOS = {
  bronze:        'rank-logos/rank-bronze.png',
  argent:        'rank-logos/rank-argent.png',
  or:            'rank-logos/rank-or.png',
  platine:       'rank-logos/rank-platine.png',
  diamant:       'rank-logos/rank-diamant.png',
  emeraude:      'rank-logos/rank-emeraude.png',
  maitre:        'rank-logos/rank-maitre.png',
  'grand-maitre':'rank-logos/rank-grand-maitre.png',
  virtuose:      'rank-logos/rank-virtuose.png',
  'dieu-grec':   'rank-logos/rank-dieu-grec.png',
};

// Groupes musculaires disponibles
export const MUSCLE_GROUPS = [
  { id: 'chest',      name: 'Pectoraux',   emoji: '💪' },
  { id: 'back',       name: 'Dos',         emoji: '🔙' },
  { id: 'shoulders',  name: 'Épaules',     emoji: '🏔' },
  { id: 'biceps',     name: 'Biceps',      emoji: '💪' },
  { id: 'triceps',    name: 'Triceps',     emoji: '💪' },
  { id: 'forearms',   name: 'Avant-bras',  emoji: '🤜' },
  { id: 'abs',        name: 'Abdos',       emoji: '🧱' },
  { id: 'quadriceps', name: 'Quadriceps',  emoji: '🦵' },
  { id: 'hamstrings', name: 'Ischios',     emoji: '🦵' },
  { id: 'glutes',     name: 'Fessiers',    emoji: '🍑' },
  { id: 'calves',     name: 'Mollets',     emoji: '🦵' },
  { id: 'traps',      name: 'Trapèzes',    emoji: '🔺' },
];

// Seuils par groupe (e1RM en multiple du poids de corps).
// Index 0 → seuil pour Argent (Bronze = défaut)
// Index 8 → seuil pour Dieu Grec
const THRESHOLDS_BW = {
  chest:      [0.50, 0.70, 0.90, 1.10, 1.30, 1.50, 1.75, 2.00, 2.25],
  back:       [0.75, 1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75],
  shoulders:  [0.30, 0.45, 0.60, 0.75, 0.90, 1.05, 1.20, 1.35, 1.50],
  biceps:     [0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00],
  triceps:    [0.30, 0.45, 0.60, 0.75, 0.90, 1.05, 1.20, 1.35, 1.50],
  forearms:   [0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00],
  abs:        [0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00],
  quadriceps: [0.75, 1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75],
  hamstrings: [0.50, 0.75, 1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50],
  glutes:     [0.75, 1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75],
  calves:     [0.50, 0.75, 1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50],
  traps:      [0.40, 0.55, 0.70, 0.85, 1.00, 1.15, 1.30, 1.45, 1.60],
};

// Seuils absolus (en kg), utilisés si pas de poids de corps
const THRESHOLDS_ABS = {
  chest:      [40, 55, 70, 85, 100, 115, 135, 155, 175],
  back:       [60, 80, 100, 120, 140, 160, 180, 200, 220],
  shoulders:  [25, 35, 45, 60, 70, 80, 95, 110, 120],
  biceps:     [15, 22, 30, 40, 50, 60, 70, 80, 90],
  triceps:    [25, 35, 45, 60, 70, 80, 95, 110, 120],
  forearms:   [15, 22, 30, 40, 50, 60, 70, 80, 90],
  abs:        [15, 25, 35, 45, 55, 65, 75, 90, 105],
  quadriceps: [60, 80, 100, 120, 140, 160, 180, 200, 220],
  hamstrings: [40, 60, 80, 100, 120, 140, 160, 180, 200],
  glutes:     [60, 80, 100, 120, 140, 160, 180, 200, 220],
  calves:     [40, 60, 80, 100, 120, 140, 160, 180, 200],
  traps:      [30, 45, 60, 75, 90, 105, 120, 135, 150],
};

// Détermine le rang à partir de l'e1RM
export function rankFor(group, e1rm, bodyweight) {
  if (!e1rm || e1rm <= 0) return null; // pas de données → pas de rang
  const useBw = bodyweight && bodyweight > 0;
  const value = useBw ? e1rm / bodyweight : e1rm;
  const seuils = useBw ? THRESHOLDS_BW[group] : THRESHOLDS_ABS[group];
  if (!seuils) return RANKS[0];
  // Trouve le plus haut palier dépassé
  let idx = 0;
  for (let i = 0; i < seuils.length; i++) {
    if (value >= seuils[i]) idx = i + 1;
  }
  return RANKS[Math.min(idx, RANKS.length - 1)];
}

// Auto-détection des groupes musculaires à partir du nom d'exercice
// (utilisé pour les anciens exercices sans tag explicite)
const NAME_HINTS = [
  { match: /develop.*couche|bench|pec/i,       groups: ['chest', 'triceps', 'shoulders'] },
  { match: /develop.*incline/i,                groups: ['chest', 'shoulders'] },
  { match: /develop.*militaire|over.*head|ohp|epaule/i, groups: ['shoulders', 'triceps'] },
  { match: /ecart|pec.*deck|butterfly/i,       groups: ['chest'] },
  { match: /dips?\b/i,                         groups: ['chest', 'triceps'] },
  { match: /pomp|push.?up/i,                   groups: ['chest', 'triceps', 'shoulders'] },
  { match: /traction|pull.?up|chin.?up/i,      groups: ['back', 'biceps'] },
  { match: /tirage.*horizontal|row|rowing/i,   groups: ['back', 'biceps'] },
  { match: /tirage.*vertical|lat.*pull/i,      groups: ['back', 'biceps'] },
  { match: /souleve.*terre|deadlift/i,         groups: ['back', 'hamstrings', 'glutes'] },
  { match: /shrug|haussement/i,                groups: ['traps'] },
  { match: /curl/i,                            groups: ['biceps'] },
  { match: /extension.*triceps|skull|kickback/i, groups: ['triceps'] },
  { match: /elevation.*lat/i,                  groups: ['shoulders'] },
  { match: /elevation.*frontal/i,              groups: ['shoulders'] },
  { match: /face.?pull/i,                      groups: ['shoulders', 'back'] },
  { match: /squat/i,                           groups: ['quadriceps', 'glutes'] },
  { match: /fente|lunge/i,                     groups: ['quadriceps', 'glutes'] },
  { match: /press.*jambe|leg.*press/i,         groups: ['quadriceps', 'glutes'] },
  { match: /leg.*ext/i,                        groups: ['quadriceps'] },
  { match: /leg.*curl|ischio/i,                groups: ['hamstrings'] },
  { match: /hip.*thrust|fessier/i,             groups: ['glutes'] },
  { match: /mollet|calf/i,                     groups: ['calves'] },
  { match: /crunch|abdo|sit.?up|plank|gainage/i, groups: ['abs'] },
  { match: /forearm|avant.?bras|wrist/i,       groups: ['forearms'] },
];

export function detectGroups(exerciseName) {
  if (!exerciseName) return [];
  for (const h of NAME_HINTS) {
    if (h.match.test(exerciseName)) return h.groups;
  }
  return [];
}

// Calcule les rangs de tous les groupes musculaires à partir de l'historique.
// Retourne { [groupId]: { rank, e1rm, exercise } }
export function computeRanks(store) {
  const result = {};
  const bw = Number(store.profile?.weight) || 0;

  // Index des groupes déclarés par exercice (programmes + détection auto)
  const groupsByExName = new Map();
  for (const p of store.programs || []) {
    for (const ex of p.exercises || []) {
      const name = (ex.name || '').trim();
      if (!name) continue;
      const explicit = Array.isArray(ex.muscleGroups) ? ex.muscleGroups : [];
      const groups = explicit.length ? explicit : detectGroups(name);
      if (groups.length) groupsByExName.set(name.toLowerCase(), groups);
    }
  }

  // Parcourt toutes les séances enregistrées
  for (const s of store.sessions || []) {
    for (const ex of s.exercises || []) {
      const name = (ex.name || '').trim();
      if (!name) continue;
      // Groupes : explicites sur l'exercice de la session, sinon programmes, sinon auto
      let groups = Array.isArray(ex.muscleGroups) && ex.muscleGroups.length
        ? ex.muscleGroups
        : (groupsByExName.get(name.toLowerCase()) || detectGroups(name));
      if (!groups.length) continue;

      // Calcule le meilleur e1RM de cet exercice dans cette séance
      let bestE1rm = 0;
      for (const set of ex.sets || []) {
        const w = Number(set.weight) || 0;
        const r = Number(set.reps) || 0;
        if (w <= 0 || r <= 0) continue;
        const e = w * (1 + r / 30);
        if (e > bestE1rm) bestE1rm = e;
      }
      if (bestE1rm <= 0) continue;

      for (const g of groups) {
        const prev = result[g];
        if (!prev || bestE1rm > prev.e1rm) {
          result[g] = { e1rm: bestE1rm, exercise: name };
        }
      }
    }
  }

  // Attribue un rang à chaque groupe trouvé
  for (const g of Object.keys(result)) {
    result[g].rank = rankFor(g, result[g].e1rm, bw);
    result[g].ratio = bw > 0 ? result[g].e1rm / bw : null;
  }
  return result;
}

// Rang global = rang médian des groupes notés
export function overallRank(ranksByGroup) {
  const entries = Object.values(ranksByGroup).filter(r => r.rank);
  if (entries.length === 0) return null;
  const indices = entries
    .map(r => RANKS.findIndex(R => R.id === r.rank.id))
    .sort((a, b) => a - b);
  const median = indices[Math.floor(indices.length / 2)];
  return RANKS[median];
}
