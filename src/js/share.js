/* share.js — Partage de programmes via lien encodé (sans backend)
 *
 *  - Le programme est sérialisé en JSON, compressé via LZ-String et encodé URL-safe
 *  - Lien : <origin>/#share/<encoded>
 *  - Quand on ouvre le lien, on décode et on propose d'importer
 *
 *  LZ-String : MIT, https://github.com/pieroxy/lz-string
 */

const LZ_URL = 'https://cdn.jsdelivr.net/npm/lz-string@1.5.0/+esm';

let _lzPromise = null;
function loadLZ() {
  if (!_lzPromise) _lzPromise = import(LZ_URL).then(m => m.default || m);
  return _lzPromise;
}

/**
 * Encode un programme en string URL-safe pour partage.
 * On retire les champs internes (id, userId, etc.) pour ne garder
 * que ce qui est utile à l'import côté receveur.
 */
export async function encodeProgramForSharing(program) {
  const payload = {
    v: 1,
    name: program.name || 'Programme partagé',
    description: program.description || '',
    exercises: (program.exercises || []).map(e => ({
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      restSeconds: e.restSeconds,
      muscleGroups: e.muscleGroups || [],
      libraryRef: e.libraryRef || null,
    })),
  };
  const LZ = await loadLZ();
  return LZ.compressToEncodedURIComponent(JSON.stringify(payload));
}

/** Décode une string partagée → payload de programme. Renvoie null si invalide. */
export async function decodeSharedProgram(encoded) {
  try {
    const LZ = await loadLZ();
    const json = LZ.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const payload = JSON.parse(json);
    if (payload?.v !== 1 || !Array.isArray(payload.exercises)) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

/** Construit l'URL complète à partager pour un programme. */
export async function buildShareUrl(program) {
  const encoded = await encodeProgramForSharing(program);
  return `${location.origin}${location.pathname}#share/${encoded}`;
}

/**
 * Tente de partager via l'API Web Share native (mobile), sinon copie
 * dans le presse-papier. Renvoie 'shared' | 'copied' | 'fallback'.
 */
export async function shareOrCopy(url, programName) {
  // Web Share API : disponible sur la majorité des mobiles modernes
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${programName} — NextRep`,
        text: `Découvre mon programme « ${programName} » sur NextRep`,
        url,
      });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
      // sinon on tombe en fallback presse-papier
    }
  }
  // Presse-papier
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch (_) {
    return 'fallback';
  }
}

/** Récupère un éventuel lien #share/... dans l'URL courante. Renvoie le payload décodé ou null. */
export async function checkIncomingShareLink() {
  const hash = location.hash || '';
  const m = hash.match(/^#share\/(.+)$/);
  if (!m) return null;
  const payload = await decodeSharedProgram(m[1]);
  // Nettoie l'URL pour ne pas reimporter au refresh
  history.replaceState(null, '', location.pathname + location.search);
  return payload;
}
