/* strength-standards.js — Standards de force basés sur données réelles
 *
 * Source : strengthlevel.com (agrégation de millions de lifts déclarés).
 * Seuils en multiple du POIDS DE CORPS (BW), pour un homme adulte ~25-30 ans.
 * Adaptation femme/age/taille appliquée dynamiquement.
 *
 * Paliers (correspondance avec RANKS) :
 *   0  Bronze        → débutant complet
 *   1  Argent        → novice (1-2 mois)
 *   2  Or            → novice avancé (~6 mois)
 *   3  Platine       → intermédiaire (~1 an)
 *   4  Diamant       → intermédiaire avancé (~2-3 ans)
 *   5  Émeraude      → avancé (~4-5 ans)
 *   6  Maître        → avancé élite
 *   7  Grand Maître  → élite
 *   8  Virtuose      → world-class
 *   9  Dieu Grec     → top mondial
 */

// Standards par exercice (homme, ratio 1RM / poids de corps)
// Index 0 = seuil pour Argent, 8 = seuil pour Dieu Grec
export const EXERCISE_STANDARDS = {
  // Pectoraux
  'bench press':                [0.55, 0.75, 0.95, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50],
  'incline bench press':        [0.45, 0.65, 0.85, 1.10, 1.35, 1.60, 1.80, 2.05, 2.30],
  'decline bench press':        [0.55, 0.75, 1.00, 1.30, 1.55, 1.80, 2.05, 2.30, 2.55],
  'dumbbell bench press':       [0.20, 0.30, 0.40, 0.55, 0.70, 0.85, 0.95, 1.10, 1.20],
  'dumbbell flyes':             [0.15, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90],
  'push-ups':                   [0.45, 0.55, 0.70, 0.85, 1.00, 1.15, 1.30, 1.45, 1.60], // pseudo-BW
  'dips':                       [1.00, 1.15, 1.30, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75], // BW + lest

  // Dos
  'deadlift':                   [1.00, 1.50, 1.75, 2.25, 2.75, 3.00, 3.25, 3.50, 3.75],
  'sumo deadlift':              [1.00, 1.50, 1.75, 2.25, 2.75, 3.00, 3.25, 3.50, 3.75],
  'romanian deadlift':          [0.75, 1.00, 1.30, 1.65, 1.95, 2.20, 2.45, 2.70, 2.95],
  'bent over row':              [0.50, 0.70, 0.90, 1.15, 1.40, 1.65, 1.90, 2.15, 2.40],
  'pull-up':                    [1.00, 1.10, 1.25, 1.45, 1.65, 1.85, 2.10, 2.35, 2.60], // BW + lest
  'chin-up':                    [1.00, 1.15, 1.30, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75],
  'lat pulldown':               [0.55, 0.75, 0.95, 1.20, 1.45, 1.70, 1.90, 2.10, 2.30],
  'seated cable row':           [0.55, 0.75, 0.95, 1.20, 1.45, 1.70, 1.90, 2.10, 2.30],

  // Épaules
  'overhead press':             [0.35, 0.50, 0.65, 0.85, 1.05, 1.25, 1.40, 1.55, 1.70],
  'military press':             [0.35, 0.50, 0.65, 0.85, 1.05, 1.25, 1.40, 1.55, 1.70],
  'seated dumbbell press':      [0.15, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90],
  'arnold press':               [0.15, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90],
  'lateral raise':              [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45],

  // Biceps
  'barbell curl':               [0.25, 0.35, 0.45, 0.60, 0.75, 0.90, 1.00, 1.15, 1.30],
  'dumbbell curl':              [0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.55, 0.65, 0.75],
  'hammer curl':                [0.15, 0.20, 0.25, 0.35, 0.45, 0.55, 0.60, 0.70, 0.80],
  'preacher curl':              [0.20, 0.30, 0.40, 0.55, 0.70, 0.80, 0.90, 1.00, 1.15],

  // Triceps
  'close-grip bench press':     [0.45, 0.65, 0.85, 1.10, 1.35, 1.60, 1.80, 2.00, 2.25],
  'tricep pushdown':            [0.30, 0.45, 0.60, 0.80, 1.00, 1.20, 1.35, 1.50, 1.70],
  'skull crusher':              [0.30, 0.45, 0.60, 0.75, 0.90, 1.05, 1.20, 1.35, 1.50],

  // Jambes
  'squat':                      [0.75, 1.25, 1.50, 1.75, 2.25, 2.50, 2.75, 3.00, 3.25],
  'barbell squat':              [0.75, 1.25, 1.50, 1.75, 2.25, 2.50, 2.75, 3.00, 3.25],
  'front squat':                [0.60, 1.00, 1.20, 1.45, 1.85, 2.10, 2.35, 2.60, 2.85],
  'leg press':                  [1.50, 2.25, 2.75, 3.50, 4.25, 5.00, 5.75, 6.50, 7.25],
  'bulgarian split squat':      [0.40, 0.55, 0.70, 0.90, 1.10, 1.30, 1.50, 1.70, 1.90],
  'leg extension':              [0.50, 0.70, 0.90, 1.15, 1.40, 1.65, 1.85, 2.05, 2.25],
  'leg curl':                   [0.30, 0.45, 0.60, 0.80, 1.00, 1.20, 1.35, 1.50, 1.70],

  // Fessiers
  'hip thrust':                 [1.00, 1.50, 1.85, 2.25, 2.75, 3.10, 3.45, 3.80, 4.15],
  'glute bridge':               [0.75, 1.10, 1.40, 1.75, 2.10, 2.40, 2.70, 3.00, 3.30],

  // Mollets
  'standing calf raise':        [0.75, 1.00, 1.30, 1.65, 2.00, 2.30, 2.55, 2.80, 3.10],
  'seated calf raise':          [0.45, 0.65, 0.85, 1.10, 1.35, 1.60, 1.80, 2.00, 2.25],

  // Abdos (charge additionnelle au crunch/leg-raise lesté)
  'cable crunch':               [0.20, 0.30, 0.40, 0.55, 0.70, 0.85, 0.95, 1.10, 1.25],
  'hanging leg raise':          [0.00, 0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80],

  // Trapèzes
  'barbell shrug':              [0.65, 0.90, 1.15, 1.45, 1.75, 2.05, 2.30, 2.55, 2.80],

  // Avant-bras
  'wrist curl':                 [0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.55, 0.65, 0.75],
};

// Aliases : nom alternatif → nom canonique dans EXERCISE_STANDARDS
const ALIASES = {
  // FR → EN
  'développé couché':           'bench press',
  'developpe couche':           'bench press',
  'développé incliné':          'incline bench press',
  'developpe incline':          'incline bench press',
  'développé décliné':          'decline bench press',
  'développé militaire':        'overhead press',
  'developpe militaire':        'overhead press',
  'développé arnold':           'arnold press',
  'soulevé de terre':           'deadlift',
  'souleve de terre':           'deadlift',
  'soulevé de terre roumain':   'romanian deadlift',
  'soulevé de terre sumo':      'sumo deadlift',
  'rowing':                     'bent over row',
  'rowing barre':               'bent over row',
  'rowing barre buste penché':  'bent over row',
  'tractions':                  'pull-up',
  'tractions supination':       'chin-up',
  'tirage poulie haute':        'lat pulldown',
  'tirage horizontal':          'seated cable row',
  'tirage horizontal poulie':   'seated cable row',
  'élévations latérales':       'lateral raise',
  'elevations laterales':       'lateral raise',
  'curl à la barre':            'barbell curl',
  'curl haltères':              'dumbbell curl',
  'curl marteau':               'hammer curl',
  'curl pupitre':               'preacher curl',
  'développé couché prise serrée': 'close-grip bench press',
  'extensions triceps poulie':  'tricep pushdown',
  'squat à la barre':           'squat',
  'squat avant':                'front squat',
  'presse à cuisses':           'leg press',
  'squat bulgare':              'bulgarian split squat',
  'leg extension':              'leg extension',
  'mollets debout':             'standing calf raise',
  'mollets assis':              'seated calf raise',
  'shrug à la barre':           'barbell shrug',
  'crunch à la poulie':         'cable crunch',
  'relevés de jambes suspendu': 'hanging leg raise',
  'pompes':                     'push-ups',
  'pompe':                      'push-ups',
};

/** Renvoie la clé normalisée d'un exercice s'il existe un standard, ou null. */
export function findStandardKey(exerciseName) {
  if (!exerciseName) return null;
  const lower = exerciseName.trim().toLowerCase();
  // 1) Match exact dans STANDARDS
  if (EXERCISE_STANDARDS[lower]) return lower;
  // 2) Match exact dans ALIASES
  if (ALIASES[lower]) return ALIASES[lower];
  // 3) Match contient (ex : "Barbell Bench Press" → "bench press")
  for (const k of Object.keys(EXERCISE_STANDARDS)) {
    if (lower.includes(k)) return k;
  }
  for (const [alias, canonical] of Object.entries(ALIASES)) {
    if (lower.includes(alias)) return canonical;
  }
  return null;
}

/**
 * Renvoie les seuils ajustés selon le profil (sexe / âge / taille).
 *  - Sexe femme : ratio ~0.65 sur haut, 0.75 sur bas
 *  - Âge : pic à 25-30 ans, baisse ~0.5%/an après 30
 *  - Taille : très léger ajustement (les grands sont mécaniquement désavantagés
 *    sur certains lifts polyarticulaires)
 */
export function adjustedThresholds(standardKey, profile) {
  const base = EXERCISE_STANDARDS[standardKey];
  if (!base) return null;
  const gender = (profile?.gender || '').toLowerCase();
  const age = Number(profile?.age) || 28;
  const height = Number(profile?.height) || 175;

  // 1) Coefficient sexe
  let genderCoef = 1;
  if (gender === 'female') {
    // Haut du corps plus pénalisé que bas du corps
    const isLowerBody = /squat|deadlift|leg|calf|hip|glute|lunge|bulgarian/.test(standardKey);
    genderCoef = isLowerBody ? 0.75 : 0.65;
  }

  // 2) Coefficient âge (referent 25-30 ans)
  let ageCoef = 1;
  if (age > 30) ageCoef = Math.max(0.6, 1 - (age - 30) * 0.005);
  else if (age < 18) ageCoef = 0.85; // les seuils ado sont plus bas

  // 3) Coefficient taille — léger, surtout pour les très grands sur full body lifts
  //    Référence 175 cm. Au-delà de 190 cm ou en-dessous de 160 cm, micro-ajustement.
  let heightCoef = 1;
  if (height > 0) {
    const isFullBody = /squat|deadlift|bench press|overhead press/.test(standardKey);
    if (isFullBody) heightCoef = Math.pow(175 / height, 0.15); // très subtil
  }

  const k = genderCoef * ageCoef * heightCoef;
  return base.map(v => +(v * k).toFixed(3));
}
