/* exercise-i18n.js — Traduction FR de la banque free-exercise-db
 *
 *  - Dictionnaires statiques pour les champs structurels (muscles, équipement,
 *    niveau, mécanique, catégorie)
 *  - Dictionnaire des noms d'exercices les plus courants
 *  - Traduction des instructions via MyMemory API (gratuite, 5000 mots/jour)
 *    avec cache localStorage par hash de texte.
 */

// ===== Muscles =====
const MUSCLES_FR = {
  abdominals:    'Abdominaux',
  abductors:     'Abducteurs',
  adductors:     'Adducteurs',
  biceps:        'Biceps',
  calves:        'Mollets',
  chest:         'Pectoraux',
  forearms:      'Avant-bras',
  glutes:        'Fessiers',
  hamstrings:    'Ischio-jambiers',
  lats:          'Grand dorsal',
  'lower back':  'Lombaires',
  'middle back': 'Milieu du dos',
  neck:          'Cou',
  quadriceps:    'Quadriceps',
  shoulders:     'Épaules',
  traps:         'Trapèzes',
  triceps:       'Triceps',
};

const EQUIPMENT_FR = {
  'body only':       'Poids du corps',
  machine:           'Machine',
  'medicine ball':   'Médecine-ball',
  cable:             'Câble / poulie',
  barbell:           'Barre',
  dumbbell:          'Haltère',
  bands:             'Élastique',
  kettlebells:       'Kettlebell',
  'exercise ball':   'Swiss ball',
  'foam roll':       'Rouleau mousse',
  'e-z curl bar':    'Barre EZ',
  other:             'Autre',
};

const LEVEL_FR = {
  beginner:     'Débutant',
  intermediate: 'Intermédiaire',
  expert:       'Avancé',
};

const FORCE_FR = {
  push:   'Pousser',
  pull:   'Tirer',
  static: 'Statique',
};

const MECHANIC_FR = {
  compound:  'Polyarticulaire',
  isolation: 'Isolation',
};

const CATEGORY_FR = {
  strength:     'Force',
  stretching:   'Étirement',
  plyometrics:  'Pliométrie',
  strongman:    'Strongman',
  powerlifting: 'Powerlifting',
  cardio:       'Cardio',
  'olympic weightlifting': 'Haltérophilie',
  crossfit:     'CrossFit',
};

// ===== Noms d'exercices courants (FR) =====
// Liste curée : on traduit les exercices les plus populaires. Le reste
// reste en anglais (fallback). Les clés sont en lowercase pour matcher
// indépendamment de la casse.
const NAMES_FR = {
  'barbell bench press':                  'Développé couché à la barre',
  'barbell incline bench press':          'Développé incliné à la barre',
  'barbell decline bench press':          'Développé décliné à la barre',
  'dumbbell bench press':                 'Développé couché haltères',
  'dumbbell incline bench press':         'Développé incliné haltères',
  'dumbbell flyes':                       'Écarté couché haltères',
  'incline dumbbell flyes':               'Écarté incliné haltères',
  'cable crossover':                      'Vis-à-vis à la poulie',
  'push-ups':                             'Pompes',
  'pushups':                              'Pompes',
  'wide-grip barbell bench press':        'Développé couché prise large',
  'close-grip barbell bench press':       'Développé couché prise serrée',
  'dips':                                 'Dips',
  'chest dip':                            'Dips poitrine',

  'pull-up':                              'Tractions',
  'pull ups':                             'Tractions',
  'chin-up':                              'Tractions supination',
  'wide-grip lat pulldown':               'Tirage poulie haute prise large',
  'close-grip front lat pulldown':        'Tirage poulie haute prise serrée',
  'bent over barbell row':                'Rowing barre buste penché',
  'one-arm dumbbell row':                 'Rowing haltère 1 bras',
  'seated cable rows':                    'Tirage horizontal poulie',
  't-bar row':                            'Rowing T-bar',
  'deadlift':                             'Soulevé de terre',
  'sumo deadlift':                        'Soulevé de terre sumo',
  'romanian deadlift':                    'Soulevé de terre roumain',
  'rack pulls':                           'Soulevé de terre depuis rack',
  'hyperextensions':                      'Extensions lombaires',
  'good morning':                         'Good morning',

  'standing military press':              'Développé militaire debout',
  'seated dumbbell press':                'Développé assis haltères',
  'arnold press':                         'Développé Arnold',
  'side lateral raise':                   'Élévations latérales',
  'front dumbbell raise':                 'Élévations frontales',
  'reverse flyes':                        'Oiseau (deltoïdes postérieurs)',
  'face pull':                            'Face pull',
  'upright row':                          'Rowing menton',
  'barbell shrug':                        'Shrug à la barre',
  'dumbbell shrug':                       'Shrug haltères',

  'barbell curl':                         'Curl à la barre',
  'standing dumbbell curl':               'Curl haltères debout',
  'incline dumbbell curl':                'Curl haltères incliné',
  'hammer curls':                         'Curl marteau',
  'preacher curl':                        'Curl pupitre',
  'concentration curls':                  'Curl concentration',
  'cable curl':                           'Curl à la poulie',
  'reverse barbell curl':                 'Curl inversé à la barre',

  'tricep pushdown':                      'Extensions triceps poulie',
  'tricep dumbbell kickback':             'Kickback triceps',
  'lying triceps press':                  'Barre au front',
  'skull crusher':                        'Skull crusher',
  'close-grip bench press':               'Développé couché prise serrée',
  'overhead triceps extension':           'Extension triceps au-dessus de la tête',
  'tricep dips':                          'Dips triceps',

  'wrist roller':                         'Rouleau poignet',
  'wrist curls':                          'Curl poignet',
  'reverse wrist curls':                  'Curl poignet inversé',

  'crunches':                             'Crunch',
  'sit-up':                               'Sit-up',
  'bicycle crunch':                       'Crunch bicyclette',
  'leg raises':                           'Relevés de jambes',
  'hanging leg raise':                    'Relevés de jambes suspendu',
  'plank':                                'Planche',
  'side bridge':                          'Gainage latéral',
  'russian twist':                        'Russian twist',
  'ab roller':                            'Roue abdominale',
  'cable crunch':                         'Crunch à la poulie',

  'barbell squat':                        'Squat à la barre',
  'front squat':                          'Squat avant',
  'goblet squat':                         'Goblet squat',
  'bulgarian split squat':                'Squat bulgare',
  'leg press':                            'Presse à cuisses',
  'leg extensions':                       'Leg extension',
  'dumbbell lunges':                      'Fentes haltères',
  'barbell lunge':                        'Fentes à la barre',
  'walking lunge':                        'Fentes marchées',
  'hack squat':                           'Hack squat',
  'sissy squat':                          'Sissy squat',

  'leg curl':                             'Leg curl',
  'lying leg curls':                      'Leg curl allongé',
  'seated leg curl':                      'Leg curl assis',
  'stiff-legged barbell deadlift':        'Soulevé de terre jambes tendues',
  'glute kickback':                       'Kickback fessier',
  'hip thrust':                           'Hip thrust',
  'glute bridge':                         'Pont fessier',
  'cable hip adduction':                  'Adduction hanche poulie',

  'standing calf raises':                 'Mollets debout',
  'seated calf raise':                    'Mollets assis',
  'donkey calf raises':                   'Mollets âne',
  'calf press':                           'Presse mollets',

  'burpees':                              'Burpees',
  'jumping jacks':                        'Jumping jacks',
  'mountain climber':                     'Grimpeur',
  'box jump':                             'Box jump',
};

// ===== Fonctions =====
export function translateMuscle(m)    { return MUSCLES_FR[(m || '').toLowerCase()]    || cap(m); }
export function translateEquipment(e) { return EQUIPMENT_FR[(e || '').toLowerCase()]  || cap(e); }
export function translateLevel(l)     { return LEVEL_FR[(l || '').toLowerCase()]      || cap(l); }
export function translateForce(f)     { return FORCE_FR[(f || '').toLowerCase()]      || cap(f); }
export function translateMechanic(m)  { return MECHANIC_FR[(m || '').toLowerCase()]   || cap(m); }
export function translateCategory(c)  { return CATEGORY_FR[(c || '').toLowerCase()]   || cap(c); }
export function translateName(n)      { return NAMES_FR[(n || '').toLowerCase()]      || n; }

function cap(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ===== Traduction des instructions via API MyMemory =====
const TRANSLATE_CACHE_KEY = 'nextrep.translateCache.v1';
const TRANSLATE_URL = 'https://api.mymemory.translated.net/get';

function loadTranslateCache() {
  try { return JSON.parse(localStorage.getItem(TRANSLATE_CACHE_KEY) || '{}'); }
  catch (_) { return {}; }
}
function saveTranslateCache(cache) {
  try { localStorage.setItem(TRANSLATE_CACHE_KEY, JSON.stringify(cache)); }
  catch (_) {}
}

function hash(s) {
  // FNV-1a 32 bits — assez pour identifier des textes uniques
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/**
 * Traduit un tableau d'instructions EN → FR. Cache en localStorage.
 * Retourne le tableau traduit (ou l'original si l'API échoue).
 */
export async function translateInstructions(instructions) {
  if (!Array.isArray(instructions) || instructions.length === 0) return instructions;
  const joined = instructions.join('\n---\n');
  const key = hash(joined);
  const cache = loadTranslateCache();
  if (cache[key]) return cache[key].split('\n---\n');

  try {
    // MyMemory a une limite ~500 chars/requête. On découpe si trop long.
    const parts = chunkText(joined, 480);
    const translated = [];
    for (const p of parts) {
      const url = `${TRANSLATE_URL}?q=${encodeURIComponent(p)}&langpair=en|fr`;
      const resp = await fetch(url);
      const data = await resp.json();
      const t = data?.responseData?.translatedText;
      if (!t) throw new Error('Empty translation');
      translated.push(t);
    }
    const out = translated.join('');
    cache[key] = out;
    saveTranslateCache(cache);
    return out.split('\n---\n').map(s => s.trim()).filter(Boolean);
  } catch (err) {
    console.warn('translateInstructions failed', err);
    return instructions;
  }
}

function chunkText(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const out = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + maxLen, text.length);
    // Coupe à la fin d'une phrase si possible
    if (end < text.length) {
      const dot = text.lastIndexOf('. ', end);
      if (dot > i) end = dot + 1;
    }
    out.push(text.slice(i, end));
    i = end;
  }
  return out;
}
