/* progress-photos.js — Photos de progression stockées en IndexedDB local
 *
 * Pourquoi IndexedDB et pas Firebase Storage ?
 *  - Gratuit, illimité (vs 5 GB Spark plan, payant ensuite)
 *  - Confidentialité maximale (les photos ne quittent jamais le téléphone)
 *  - Pas de bande passante consommée
 *  - Inconvénient : pas de synchro multi-appareils → on pourra migrer vers
 *    Firebase Storage plus tard si l'app a du succès
 *
 * Format : { id, date (ts), tag ('face'|'back'|'profile'|'other'), blob }
 */

const DB_NAME = 'nextrep-photos';
const STORE = 'photos';
const VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('date', 'date');
        store.createIndex('tag', 'tag');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Compresse une image File → Blob JPEG plus léger (max 1200px, qualité 0.82). */
export function compressImage(file, maxSide = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSide || height > maxSide) {
        if (width > height) {
          height = Math.round(height * (maxSide / width));
          width = maxSide;
        } else {
          width = Math.round(width * (maxSide / height));
          height = maxSide;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error('Compression failed'));
      }, 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

/** Ajoute une photo compressée. */
export async function addPhoto({ date, tag, blob }) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const photo = { id, date: date || Date.now(), tag: tag || 'other', blob };
    tx.objectStore(STORE).add(photo);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

/** Liste toutes les photos, triées par date desc. */
export async function listPhotos() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const photos = (req.result || []).sort((a, b) => b.date - a.date);
      resolve(photos);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Supprime une photo par id. */
export async function deletePhoto(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Renvoie une URL utilisable dans un <img src>. À révoquer après usage. */
export function blobUrl(blob) {
  return URL.createObjectURL(blob);
}

/** Compte le nombre de photos stockées. */
export async function countPhotos() {
  const list = await listPhotos();
  return list.length;
}
