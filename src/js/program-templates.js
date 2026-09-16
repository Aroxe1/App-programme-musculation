/* program-templates.js — Bibliothèque de programmes types prêts à importer
 *
 * Chaque entrée = UN programme NextRep (= une séance type).
 * Les "splits" multi-jours (PPL, Upper/Lower) sont représentés comme
 * plusieurs templates qu'on peut importer ensemble via un "pack".
 *
 * Format exercice : { name, sets, reps, restSeconds, muscleGroups }
 */

const ex = (name, sets, reps, restSeconds, muscleGroups) =>
  ({ name, sets, reps, restSeconds, muscleGroups });

export const TEMPLATE_PACKS = [
  // ============================================================
  {
    id: 'ppl-3',
    name: 'Push Pull Legs — 3 jours',
    description: 'Le classique : Push (poussée), Pull (tirage), Legs (jambes). Idéal pour intermédiaires, 3 séances/semaine.',
    level: 'intermediate',
    daysPerWeek: 3,
    badge: '🔥 Populaire',
    programs: [
      {
        name: 'PPL — Push',
        description: 'Pectoraux, épaules, triceps',
        exercises: [
          ex('Développé couché', 4, 8, 120, ['chest', 'triceps', 'shoulders']),
          ex('Développé incliné haltères', 3, 10, 90, ['chest', 'shoulders']),
          ex('Dips', 3, 10, 90, ['chest', 'triceps']),
          ex('Développé militaire', 4, 8, 120, ['shoulders', 'triceps']),
          ex('Élévations latérales', 3, 15, 60, ['shoulders']),
          ex('Extensions triceps poulie', 3, 12, 60, ['triceps']),
        ],
      },
      {
        name: 'PPL — Pull',
        description: 'Dos, biceps, trapèzes',
        exercises: [
          ex('Tractions', 4, 8, 120, ['back', 'biceps']),
          ex('Rowing barre buste penché', 4, 8, 120, ['back', 'biceps']),
          ex('Tirage horizontal poulie', 3, 10, 90, ['back', 'biceps']),
          ex('Face pull', 3, 15, 60, ['shoulders', 'back']),
          ex('Curl à la barre', 3, 10, 90, ['biceps']),
          ex('Curl marteau', 3, 12, 60, ['biceps', 'forearms']),
        ],
      },
      {
        name: 'PPL — Legs',
        description: 'Quadriceps, ischios, fessiers, mollets',
        exercises: [
          ex('Squat à la barre', 4, 8, 180, ['quadriceps', 'glutes']),
          ex('Soulevé de terre roumain', 4, 10, 120, ['hamstrings', 'glutes', 'back']),
          ex('Presse à cuisses', 3, 12, 90, ['quadriceps', 'glutes']),
          ex('Leg curl allongé', 3, 12, 60, ['hamstrings']),
          ex('Mollets debout', 4, 15, 60, ['calves']),
          ex('Crunch à la poulie', 3, 15, 60, ['abs']),
        ],
      },
    ],
  },

  // ============================================================
  {
    id: 'upper-lower',
    name: 'Upper / Lower — 4 jours',
    description: 'Haut du corps 2x/semaine, bas du corps 2x/semaine. Idéal pour progression rapide en intermédiaire.',
    level: 'intermediate',
    daysPerWeek: 4,
    programs: [
      {
        name: 'Upper — Force',
        description: 'Haut du corps, focus charges lourdes',
        exercises: [
          ex('Développé couché', 4, 6, 180, ['chest', 'triceps', 'shoulders']),
          ex('Rowing barre buste penché', 4, 6, 180, ['back', 'biceps']),
          ex('Développé militaire', 3, 8, 120, ['shoulders', 'triceps']),
          ex('Tractions', 3, 8, 120, ['back', 'biceps']),
          ex('Curl à la barre', 3, 10, 90, ['biceps']),
          ex('Extensions triceps poulie', 3, 12, 60, ['triceps']),
        ],
      },
      {
        name: 'Lower — Force',
        description: 'Bas du corps, focus charges lourdes',
        exercises: [
          ex('Squat à la barre', 4, 6, 180, ['quadriceps', 'glutes']),
          ex('Soulevé de terre', 4, 5, 180, ['back', 'hamstrings', 'glutes']),
          ex('Presse à cuisses', 3, 10, 90, ['quadriceps', 'glutes']),
          ex('Leg curl', 3, 10, 90, ['hamstrings']),
          ex('Mollets debout', 4, 12, 60, ['calves']),
          ex('Planche', 3, 60, 45, ['abs']),
        ],
      },
      {
        name: 'Upper — Volume',
        description: 'Haut du corps, focus hypertrophie',
        exercises: [
          ex('Développé incliné haltères', 4, 10, 90, ['chest', 'shoulders']),
          ex('Tirage poulie haute prise large', 4, 10, 90, ['back', 'biceps']),
          ex('Écarté couché haltères', 3, 12, 60, ['chest']),
          ex('Rowing haltère 1 bras', 3, 12, 60, ['back', 'biceps']),
          ex('Élévations latérales', 4, 15, 45, ['shoulders']),
          ex('Curl haltères incliné', 3, 12, 60, ['biceps']),
          ex('Dips', 3, 12, 60, ['chest', 'triceps']),
        ],
      },
      {
        name: 'Lower — Volume',
        description: 'Bas du corps, focus hypertrophie',
        exercises: [
          ex('Squat avant', 4, 10, 120, ['quadriceps', 'glutes']),
          ex('Hip thrust', 4, 12, 90, ['glutes', 'hamstrings']),
          ex('Fentes haltères', 3, 12, 60, ['quadriceps', 'glutes']),
          ex('Leg extension', 3, 15, 45, ['quadriceps']),
          ex('Leg curl assis', 3, 15, 45, ['hamstrings']),
          ex('Mollets assis', 4, 20, 45, ['calves']),
          ex('Crunch à la poulie', 3, 20, 45, ['abs']),
        ],
      },
    ],
  },

  // ============================================================
  {
    id: 'full-body-3',
    name: 'Full Body — 3 jours',
    description: 'Tout le corps à chaque séance. Idéal débutant et reprise après pause.',
    level: 'beginner',
    daysPerWeek: 3,
    badge: '⭐ Débutant',
    programs: [
      {
        name: 'Full Body — Séance A',
        exercises: [
          ex('Squat à la barre', 3, 10, 120, ['quadriceps', 'glutes']),
          ex('Développé couché', 3, 10, 120, ['chest', 'triceps', 'shoulders']),
          ex('Rowing barre buste penché', 3, 10, 120, ['back', 'biceps']),
          ex('Développé militaire', 3, 10, 90, ['shoulders', 'triceps']),
          ex('Planche', 3, 45, 45, ['abs']),
        ],
      },
      {
        name: 'Full Body — Séance B',
        exercises: [
          ex('Soulevé de terre', 3, 8, 180, ['back', 'hamstrings', 'glutes']),
          ex('Développé incliné haltères', 3, 10, 90, ['chest', 'shoulders']),
          ex('Tractions', 3, 8, 120, ['back', 'biceps']),
          ex('Fentes haltères', 3, 12, 90, ['quadriceps', 'glutes']),
          ex('Mollets debout', 3, 15, 60, ['calves']),
        ],
      },
      {
        name: 'Full Body — Séance C',
        exercises: [
          ex('Presse à cuisses', 3, 12, 90, ['quadriceps', 'glutes']),
          ex('Dips', 3, 10, 90, ['chest', 'triceps']),
          ex('Tirage horizontal poulie', 3, 10, 90, ['back', 'biceps']),
          ex('Élévations latérales', 3, 15, 60, ['shoulders']),
          ex('Curl à la barre', 3, 10, 60, ['biceps']),
          ex('Crunch à la poulie', 3, 15, 45, ['abs']),
        ],
      },
    ],
  },

  // ============================================================
  {
    id: '5x5',
    name: 'Stronglifts 5×5 — 3 jours',
    description: 'Programme force minimaliste. 5 exercices, 5 séries de 5 reps. Idéal pour gagner en force.',
    level: 'beginner',
    daysPerWeek: 3,
    badge: '💪 Force',
    programs: [
      {
        name: '5×5 — Séance A',
        exercises: [
          ex('Squat à la barre', 5, 5, 180, ['quadriceps', 'glutes']),
          ex('Développé couché', 5, 5, 180, ['chest', 'triceps', 'shoulders']),
          ex('Rowing barre buste penché', 5, 5, 180, ['back', 'biceps']),
        ],
      },
      {
        name: '5×5 — Séance B',
        exercises: [
          ex('Squat à la barre', 5, 5, 180, ['quadriceps', 'glutes']),
          ex('Développé militaire', 5, 5, 180, ['shoulders', 'triceps']),
          ex('Soulevé de terre', 1, 5, 240, ['back', 'hamstrings', 'glutes']),
        ],
      },
    ],
  },

  // ============================================================
  {
    id: 'bro-split-5',
    name: 'Bro Split — 5 jours',
    description: 'Un groupe musculaire par séance. Bon pour l\'hypertrophie avancée et la spécialisation.',
    level: 'intermediate',
    daysPerWeek: 5,
    programs: [
      {
        name: 'Bro — Pectoraux',
        exercises: [
          ex('Développé couché', 4, 8, 120, ['chest']),
          ex('Développé incliné haltères', 4, 10, 90, ['chest']),
          ex('Écarté couché haltères', 3, 12, 60, ['chest']),
          ex('Dips', 3, 10, 90, ['chest', 'triceps']),
          ex('Pompes', 3, 20, 60, ['chest']),
        ],
      },
      {
        name: 'Bro — Dos',
        exercises: [
          ex('Tractions', 4, 8, 120, ['back']),
          ex('Rowing barre buste penché', 4, 10, 90, ['back']),
          ex('Tirage poulie haute prise large', 3, 12, 90, ['back']),
          ex('Rowing haltère 1 bras', 3, 12, 60, ['back']),
          ex('Tirage horizontal poulie', 3, 12, 60, ['back']),
          ex('Shrug à la barre', 3, 15, 60, ['traps']),
        ],
      },
      {
        name: 'Bro — Jambes',
        exercises: [
          ex('Squat à la barre', 4, 8, 180, ['quadriceps', 'glutes']),
          ex('Presse à cuisses', 4, 12, 120, ['quadriceps', 'glutes']),
          ex('Fentes haltères', 3, 12, 90, ['quadriceps', 'glutes']),
          ex('Leg curl', 3, 12, 60, ['hamstrings']),
          ex('Hip thrust', 3, 12, 90, ['glutes']),
          ex('Mollets debout', 4, 15, 45, ['calves']),
        ],
      },
      {
        name: 'Bro — Épaules',
        exercises: [
          ex('Développé militaire', 4, 8, 120, ['shoulders', 'triceps']),
          ex('Développé Arnold', 3, 10, 90, ['shoulders']),
          ex('Élévations latérales', 4, 15, 45, ['shoulders']),
          ex('Élévations frontales', 3, 12, 45, ['shoulders']),
          ex('Face pull', 3, 15, 60, ['shoulders', 'back']),
          ex('Shrug haltères', 3, 15, 45, ['traps']),
        ],
      },
      {
        name: 'Bro — Bras',
        exercises: [
          ex('Curl à la barre', 4, 10, 90, ['biceps']),
          ex('Curl haltères incliné', 3, 12, 60, ['biceps']),
          ex('Curl marteau', 3, 12, 60, ['biceps', 'forearms']),
          ex('Développé couché prise serrée', 4, 10, 90, ['triceps', 'chest']),
          ex('Extensions triceps poulie', 3, 12, 60, ['triceps']),
          ex('Skull crusher', 3, 12, 60, ['triceps']),
        ],
      },
    ],
  },

  // ============================================================
  {
    id: 'home-bodyweight',
    name: 'À la maison sans matériel',
    description: 'Programme complet au poids du corps. Aucun équipement nécessaire.',
    level: 'beginner',
    daysPerWeek: 3,
    badge: '🏠 Maison',
    programs: [
      {
        name: 'Maison — Haut du corps',
        exercises: [
          ex('Pompes', 4, 15, 60, ['chest', 'triceps', 'shoulders']),
          ex('Tractions', 4, 8, 120, ['back', 'biceps']),
          ex('Dips entre chaises', 3, 10, 90, ['triceps', 'chest']),
          ex('Pompes diamant', 3, 12, 60, ['triceps', 'chest']),
          ex('Planche', 3, 60, 45, ['abs']),
        ],
      },
      {
        name: 'Maison — Bas du corps',
        exercises: [
          ex('Squat au poids du corps', 4, 20, 90, ['quadriceps', 'glutes']),
          ex('Fentes marchées', 3, 16, 60, ['quadriceps', 'glutes']),
          ex('Pont fessier', 3, 20, 60, ['glutes', 'hamstrings']),
          ex('Squat bulgare', 3, 12, 60, ['quadriceps', 'glutes']),
          ex('Mollets sur marche', 4, 25, 45, ['calves']),
        ],
      },
      {
        name: 'Maison — Cardio HIIT',
        exercises: [
          ex('Burpees', 4, 15, 60, ['chest', 'quadriceps', 'shoulders']),
          ex('Jumping jacks', 4, 50, 30, ['calves']),
          ex('Grimpeur', 4, 30, 45, ['abs', 'shoulders']),
          ex('Squat sauté', 4, 15, 60, ['quadriceps', 'glutes']),
          ex('Planche', 3, 60, 45, ['abs']),
        ],
      },
    ],
  },
];

/** Renvoie un pack par son id. */
export function getTemplatePack(id) {
  return TEMPLATE_PACKS.find(p => p.id === id) || null;
}
