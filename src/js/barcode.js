/* barcode.js — Scanner code-barres caméra + lookup Open Food Facts
 *
 * Stratégie :
 *  - Chargement lazy de html5-qrcode depuis CDN (~75 KB, MIT) au premier appel
 *  - Open Food Facts API publique (CC-BY-SA) : https://openfoodfacts.org
 */

const HTML5_QRCODE_URL = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';

let _libPromise = null;
function loadHtml5QrcodeLib() {
  if (window.Html5Qrcode) return Promise.resolve(window.Html5Qrcode);
  if (_libPromise) return _libPromise;
  _libPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = HTML5_QRCODE_URL;
    s.async = true;
    s.onload = () => window.Html5Qrcode
      ? resolve(window.Html5Qrcode)
      : reject(new Error('Html5Qrcode not loaded'));
    s.onerror = () => reject(new Error('Failed to load scanner library'));
    document.head.appendChild(s);
  });
  return _libPromise;
}

/** Ouvre la caméra et résout avec le code-barres détecté, ou rejette si annulé. */
export function scanBarcode() {
  return new Promise((resolve, reject) => {
    let scanner = null;
    let done = false;

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop scanner-backdrop';
    backdrop.innerHTML = `
      <div class="modal scanner-modal" role="dialog">
        <h2 class="scanner-title">Scanner un code-barres</h2>
        <p class="muted scanner-hint">Place le code dans le cadre. Bonne lumière conseillée.</p>
        <div class="scanner-reader"></div>
        <div class="scanner-or">— ou saisis le code à la main —</div>
        <div class="scanner-actions">
          <input class="input scanner-input" type="text" inputmode="numeric"
                 placeholder="Ex : 3760018850604"/>
          <button class="btn btn-primary scanner-ok" type="button">Valider</button>
        </div>
        <button class="btn btn-block mt-2 scanner-cancel" type="button">Annuler</button>
      </div>`;
    document.body.appendChild(backdrop);

    const $ = sel => backdrop.querySelector(sel);

    const finish = (val, err) => {
      if (done) return;
      done = true;
      const after = () => {
        backdrop.remove();
        if (err) reject(err); else resolve(val);
      };
      if (scanner && scanner.isScanning) scanner.stop().catch(() => {}).finally(after);
      else after();
    };

    $('.scanner-cancel').addEventListener('click', () => finish(null, new Error('Cancelled')));
    $('.scanner-ok').addEventListener('click', () => {
      const v = $('.scanner-input').value.trim();
      if (v) finish(v);
    });
    $('.scanner-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const v = e.target.value.trim();
        if (v) finish(v);
      }
    });

    // Lance la caméra de manière asynchrone : si elle échoue, les boutons
    // manuels restent utilisables.
    const reader = $('.scanner-reader');
    // Le lib html5-qrcode a besoin d'un id, on lui en donne un unique
    const readerId = 'scanner-reader-' + Date.now();
    reader.id = readerId;

    loadHtml5QrcodeLib().then(Html5Qrcode => {
      try {
        scanner = new Html5Qrcode(readerId);
        scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 160 } },
          decoded => finish(decoded),
          () => { /* erreurs de scan continues = silence */ }
        ).catch(() => {
          reader.innerHTML = '<p class="scanner-fallback">Caméra non disponible — saisis le code à la main.</p>';
        });
      } catch (_) {
        reader.innerHTML = '<p class="scanner-fallback">Caméra non disponible — saisis le code à la main.</p>';
      }
    }).catch(() => {
      reader.innerHTML = '<p class="scanner-fallback">Scanner indisponible (hors-ligne ?) — saisis le code à la main.</p>';
    });
  });
}

/**
 * Récupère un produit via son code-barres sur Open Food Facts.
 * Renvoie null si non trouvé. Macros normalisées pour 100 g/ml.
 */
export async function fetchProductByBarcode(code) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`
            + '?fields=product_name,brands,nutriments,image_front_small_url,serving_size';
  const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments || {};
  const name = [p.brands, p.product_name].filter(Boolean).join(' — ') || `Produit ${code}`;

  return {
    barcode: code,
    name,
    kcal: Math.round(Number(n['energy-kcal_100g']) || 0),
    protein: round1(Number(n.proteins_100g) || 0),
    carbs: round1(Number(n.carbohydrates_100g) || 0),
    fat: round1(Number(n.fat_100g) || 0),
    servingSize: p.serving_size || null,
    image: p.image_front_small_url || null,
  };
}

function round1(n) { return Math.round(n * 10) / 10; }
