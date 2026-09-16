/* program-generator.js — Génération de programmes basée sur règles
 *
 * Phase 1 (actuelle) : règles déterministes selon questionnaire
 *   → Gratuit, instantané, prévisible
 *
 * Phase 2 (à venir, payante) : appel API LLM (OpenAI/Claude)
 *   → Vraie personnalisation, programme unique, conseils contextuels
 *
 * Le questionnaire est commun aux deux phases : c'est juste le moteur
 * de génération qui diffère.
 */

// Bibliothèque d'exercices par muscle et équipement
const POOL = {
  chest: {
    barbell:    [['Développé couché', 4, 8, 120], ['Développé incliné', 3, 10, 90], ['Développé couché prise serrée', 3, 10, 90]],
    dumbbell:   [['Développé incliné haltères', 4, 10, 90], ['Développé couché haltères', 4, 10, 90], ['Écarté couché haltères', 3, 12, 60]],
    bodyweight: [['Pompes', 4, 15, 60], ['Dips', 3, 10, 90], ['Pompes diamant', 3, 12, 60]],
  },
  back: {
    barbell:    [['Soulevé de terre', 3, 6, 180], ['Rowing barre buste penché', 4, 8, 120]],
    dumbbell:   [['Rowing haltère 1 bras', 4, 10, 90]],
    bodyweight: [['Tractions', 4, 8, 120], ['Tractions supination', 3, 10, 90]],
    cable:      [['Tirage poulie haute prise large', 4, 10, 90], ['Tirage horizontal poulie', 3, 12, 60]],
  },
  shoulders: {
    barbell:    [['Développé militaire', 4, 8, 120]],
    dumbbell:   [['Développé Arnold', 3, 10, 90], ['Élévations latérales', 4, 15, 45], ['Élévations frontales', 3, 12, 45]],
    bodyweight: [['Pompes piquées', 3, 10, 90]],
    cable:      [['Face pull', 3, 15, 60]],
  },
  biceps: {
    barbell:    [['Curl à la barre', 3, 10, 90], ['Curl pupitre', 3, 12, 60]],
    dumbbell:   [['Curl haltères incliné', 3, 12, 60], ['Curl marteau', 3, 12, 60]],
    bodyweight: [['Tractions supination', 3, 10, 90]],
  },
  triceps: {
    barbell:    [['Développé couché prise serrée', 3, 10, 90], ['Skull crusher', 3, 12, 60]],
    dumbbell:   [['Extension triceps au-dessus de la tête', 3, 12, 60]],
    bodyweight: [['Dips', 3, 10, 90], ['Pompes diamant', 3, 12, 60]],
    cable:      [['Extensions triceps poulie', 3, 12, 60]],
  },
  quadriceps: {
    barbell:    [['Squat à la barre', 4, 8, 180], ['Squat avant', 3, 10, 120], ['Fentes à la barre', 3, 10, 90]],
    dumbbell:   [['Fentes haltères', 3, 12, 90], ['Squat bulgare', 3, 12, 90]],
    machine:    [['Presse à cuisses', 3, 12, 90], ['Leg extension', 3, 15, 45]],
    bodyweight: [['Squat au poids du corps', 4, 20, 90], ['Fentes marchées', 3, 16, 60]],
  },
  hamstrings: {
    barbell:    [['Soulevé de terre roumain', 4, 10, 120]],
    machine:    [['Leg curl allongé', 3, 12, 60], ['Leg curl assis', 3, 12, 60]],
    bodyweight: [['Pont fessier', 3, 20, 60]],
  },
  glutes: {
    barbell:    [['Hip thrust', 4, 12, 90]],
    bodyweight: [['Pont fessier', 3, 20, 60], ['Squat bulgare', 3, 12, 90]],
  },
  calves: {
    machine:    [['Mollets debout', 4, 15, 60], ['Mollets assis', 3, 20, 45]],
    bodyweight: [['Mollets sur marche', 4, 25, 45]],
  },
  abs: {
    bodyweight: [['Planche', 3, 60, 45], ['Crunch', 3, 20, 45], ['Relevés de jambes suspendu', 3, 15, 60]],
    cable:      [['Crunch à la poulie', 3, 15, 45]],
  },
};

// Allocation jours → splits
const SPLITS = {
  2: [
    { name: 'Full Body A', muscles: ['quadriceps', 'chest', 'back', 'shoulders', 'biceps', 'abs'] },
    { name: 'Full Body B', muscles: ['hamstrings', 'glutes', 'chest', 'back', 'triceps', 'calves'] },
  ],
  3: [
    { name: 'Push', muscles: ['chest', 'shoulders', 'triceps'] },
    { name: 'Pull', muscles: ['back', 'biceps'] },
    { name: 'Legs', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abs'] },
  ],
  4: [
    { name: 'Upper A', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
    { name: 'Lower A', muscles: ['quadriceps', 'glutes', 'calves', 'abs'] },
    { name: 'Upper B', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
    { name: 'Lower B', muscles: ['hamstrings', 'glutes', 'quadriceps', 'calves'] },
  ],
  5: [
    { name: 'Pectoraux', muscles: ['chest', 'triceps'] },
    { name: 'Dos', muscles: ['back', 'biceps'] },
    { name: 'Jambes', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'] },
    { name: 'Épaules', muscles: ['shoulders'] },
    { name: 'Bras', muscles: ['biceps', 'triceps', 'forearms'] },
  ],
  6: [
    { name: 'Push 1', muscles: ['chest', 'shoulders', 'triceps'] },
    { name: 'Pull 1', muscles: ['back', 'biceps'] },
    { name: 'Legs 1', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'] },
    { name: 'Push 2', muscles: ['chest', 'shoulders', 'triceps'] },
    { name: 'Pull 2', muscles: ['back', 'biceps'] },
    { name: 'Legs 2', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'] },
  ],
};

// Multiplicateurs selon objectif (sets, reps, rest)
const GOAL_MODIFIERS = {
  force:        { setsMul: 1.0, repsRange: [3, 6],   restMul: 1.4 },
  hypertrophie: { setsMul: 1.0, repsRange: [8, 12],  restMul: 1.0 },
  endurance:    { setsMul: 1.0, repsRange: [15, 20], restMul: 0.7 },
  perte:        { setsMul: 1.1, repsRange: [10, 15], restMul: 0.6 },
  bien_etre:    { setsMul: 0.85, repsRange: [10, 12], restMul: 0.85 },
};

// Multiplicateurs selon niveau (nombre d'exercices par séance)
const LEVEL_EXO_COUNT = {
  beginner:     { perMuscleGroup: 1, maxPerSession: 5 },
  intermediate: { perMuscleGroup: 1, maxPerSession: 7 },
  advanced:     { perMuscleGroup: 2, maxPerSession: 9 },
};

/**
 * Génère un pack de programmes (un par jour de la semaine demandé)
 * @param {Object} answers - réponses au questionnaire
 *   { goal, level, daysPerWeek, equipment, focus? }
 */
export function generatePrograms(answers) {
  const goal = answers.goal || 'hypertrophie';
  const level = answers.level || 'intermediate';
  const days = Math.min(6, Math.max(2, parseInt(answers.daysPerWeek) || 3));
  const equipment = answers.equipment || ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight'];
  const focus = answers.focus || null; // muscle id à doubler en volume

  const split = SPLITS[days] || SPLITS[3];
  const goalMod = GOAL_MODIFIERS[goal];
  const levelMod = LEVEL_EXO_COUNT[level];

  const programs = split.map(day => {
    const muscleGroups = [...day.muscles];
    if (focus && muscleGroups.includes(focus)) {
      // Si focus défini, on duplique ce muscle pour avoir plus de volume
      muscleGroups.push(focus);
    }

    const exercises = [];
    const usedNames = new Set();
    for (const muscle of muscleGroups) {
      const pool = POOL[muscle] || {};
      const available = [];
      for (const eq of equipment) {
        if (pool[eq]) available.push(...pool[eq]);
      }
      if (available.length === 0) continue;

      // Prend N exercices selon le niveau
      const count = focus === muscle ? levelMod.perMuscleGroup + 1 : levelMod.perMuscleGroup;
      for (let i = 0; i < Math.min(count, available.length); i++) {
        const pick = available[i];
        if (usedNames.has(pick[0])) continue;
        usedNames.add(pick[0]);

        const [name, baseSets, baseReps, baseRest] = pick;
        const reps = randRange(goalMod.repsRange[0], goalMod.repsRange[1]);
        const sets = Math.max(2, Math.round(baseSets * goalMod.setsMul));
        const rest = Math.round(baseRest * goalMod.restMul);
        exercises.push({ name, sets, reps, restSeconds: rest, muscleGroups: [muscle] });

        if (exercises.length >= levelMod.maxPerSession) break;
      }
      if (exercises.length >= levelMod.maxPerSession) break;
    }

    return {
      name: `IA — ${day.name}`,
      description: `Généré automatiquement (${labelGoal(goal)} · ${labelLevel(level)})`,
      exercises,
    };
  });

  return {
    id: `ai-${Date.now()}`,
    name: `Programme IA — ${labelGoal(goal)}`,
    description: `${days} séances/semaine, objectif ${labelGoal(goal)}, niveau ${labelLevel(level)}.`,
    programs,
  };
}

function randRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function labelGoal(goal) {
  return ({
    force: 'Force', hypertrophie: 'Hypertrophie', endurance: 'Endurance',
    perte: 'Perte de gras', bien_etre: 'Bien-être',
  })[goal] || goal;
}
export function labelLevel(level) {
  return ({ beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé' })[level] || level;
}
