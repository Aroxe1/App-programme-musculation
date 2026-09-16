/* icons.js — Icônes SVG inline, style Lucide (line, currentColor)
 *
 * Sourcing : paths inspirés de Lucide (https://lucide.dev, ISC license).
 * Tous les SVG utilisent stroke="currentColor", donc la couleur s'hérite
 * du texte parent : tu peux donc styler avec `color: var(--accent)` etc.
 *
 * Usage :
 *   icon('library')        → string HTML
 *   icon('library', 18)    → string HTML avec taille custom
 *   iconEl('library')      → élément SVG (pour appendChild)
 */

const PATHS = {
  library:     '<path d="M3 4v16h4M21 4v16h-4M3 12h18M7 4v16M17 4v16"/>',
  camera:      '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  warning:     '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  wrench:      '<path d="M14.7 6.3a4 4 0 0 1 5 5l-9 9-5-5 9-9z"/><line x1="14" y1="6" x2="20" y2="12"/>',
  chart:       '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  dumbbell:    '<path d="M6.5 6.5h11M17.5 6.5v11M6.5 6.5v11M3 11h2M3 13h2M19 11h2M19 13h2"/>',
  cog:         '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  tag:         '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  check:       '<polyline points="20 6 9 17 4 12"/>',
  clipboard:   '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
  barbell:     '<path d="M14.4 14.4 9.6 9.6M18.66 17.66 17.95 16.95M5.34 6.34 4.63 5.63M2 19l3 3M22 5l-3-3M6.34 5.34l11.32 11.32M15 22l3-3M9 2 6 5"/>',
  star:        '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  meat:        '<path d="M20 12c0-4-3-7-7-7s-7 3-7 7c0 3 2 5 4 5 1 0 2-.5 2-2 0-2 2-3 2-3 1 2 2 3 4 3 1 0 2-1 2-3z"/><circle cx="9" cy="11" r="1"/>',
  wheat:       '<path d="M12 22V8M9 4l3 4 3-4M7 8c0 2 2 4 5 4M17 8c0 2-2 4-5 4M7 14c0 2 2 4 5 4M17 14c0 2-2 4-5 4"/>',
  avocado:     '<path d="M12 2C7 2 4 6 4 11s4 11 8 11 8-6 8-11-3-9-8-9z"/><circle cx="12" cy="14" r="3" fill="currentColor"/>',
  globe:       '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  sparkle:     '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
  trash:       '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
  user:        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  bell:        '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  plus:        '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  play:        '<polygon points="5 3 19 12 5 21 5 3"/>',
  info:        '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  send:        '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  party:       '<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01M22 2 17 7l3 3 5-5-3-3z"/><path d="m18 7-3 3M11 9l5 5"/>',
  trophy:      '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  refresh:     '<path d="M21 12a9 9 0 0 0-15.36-6.36L3 8"/><path d="M3 4v4h4"/><path d="M3 12a9 9 0 0 0 15.36 6.36L21 16"/><path d="M21 20v-4h-4"/>',
  // Logo Google officiel (multi-color) — pas de currentColor ici
  google:      '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>',
  logout:      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  // Émojis "muscle" alimentaires plus pertinents
  protein:     '<path d="M4 14a4 4 0 0 1 0-8h8a8 8 0 0 1 8 8v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><line x1="9" y1="9" x2="9" y2="14"/>',
};

function build(name, size = 16, extraClass = '') {
  const p = PATHS[name];
  if (!p) return '';
  const cls = `icon icon-${name}${extraClass ? ' ' + extraClass : ''}`;
  // Le logo Google est multi-color (pas de stroke), on garde son fill natif
  if (name === 'google') {
    return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  }
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

/** Retourne le HTML string d'une icône (utilisable dans innerHTML / template). */
export function icon(name, size = 16, extraClass = '') {
  return build(name, size, extraClass);
}

/** Retourne un élément SVG (utilisable dans appendChild / el(...)). */
export function iconEl(name, size = 16, extraClass = '') {
  const wrap = document.createElement('span');
  wrap.innerHTML = build(name, size, extraClass);
  return wrap.firstChild;
}
