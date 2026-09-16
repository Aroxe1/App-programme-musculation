/* records.js — Records personnels (PR) basés sur l'historique des séances
 *
 * PR = pour un exercice donné, la meilleure performance jamais réalisée.
 * Mesure : 1RM estimé via formule Epley : weight × (1 + reps/30)
 *  → permet de comparer 80kg×5 vs 100kg×1 par exemple
 *
 * Les séries comptent uniquement si :
 *  - done = true
 *  - weight > 0 et reps > 0
 */

/** Calcule le 1RM estimé d'une série (poids × (1 + reps/30)). */
export function estimate1RM(weight, reps) {
  const w = Number(weight) || 0;
  const r = Number(reps) || 0;
  if (w <= 0 || r <= 0) return 0;
  return w * (1 + r / 30);
}

/**
 * Calcule tous les PR à partir des sessions passées.
 * @param {Array} sessions
 * @returns {Object} { [exerciseName]: { name, weight, reps, e1rm, date, sessionId } }
 */
export function computePersonalRecords(sessions) {
  const records = {};
  for (const session of (sessions || [])) {
    if (!session?.exercises) continue;
    for (const exo of session.exercises) {
      const name = (exo.name || '').trim();
      if (!name) continue;
      for (const set of (exo.sets || [])) {
        if (!set?.done) continue;
        const w = Number(set.weight) || 0;
        const r = Number(set.reps) || 0;
        if (w <= 0 || r <= 0) continue;
        const e1rm = estimate1RM(w, r);
        const prev = records[name];
        if (!prev || e1rm > prev.e1rm) {
          records[name] = {
            name,
            weight: w,
            reps: r,
            e1rm: Math.round(e1rm * 10) / 10,
            date: session.date,
            sessionId: session.id,
          };
        }
      }
    }
  }
  return records;
}

/**
 * Vérifie si une nouvelle série (weight × reps) bat le PR actuel d'un exercice.
 * Renvoie l'ancien PR si battu, sinon null.
 */
export function checkPRBeaten(exerciseName, weight, reps, sessionsBeforeThis) {
  const w = Number(weight) || 0;
  const r = Number(reps) || 0;
  if (w <= 0 || r <= 0) return null;
  const newE1rm = estimate1RM(w, r);
  const records = computePersonalRecords(sessionsBeforeThis);
  const prev = records[exerciseName.trim()];
  // Pas de PR précédent : on n'annonce pas (premier essai n'est pas un "record battu")
  if (!prev) return null;
  if (newE1rm > prev.e1rm + 0.01) return prev;
  return null;
}
