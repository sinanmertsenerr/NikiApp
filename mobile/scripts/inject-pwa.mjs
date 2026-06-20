// Post-export PWA injection for the Expo web build.
// web.output is "single" (SPA), where Expo Router does NOT apply app/+html.tsx,
// so we inject the PWA <head> tags + service-worker registration into the
// generated dist/index.html after `expo export`. Idempotent.
import { readFileSync, writeFileSync, existsSync } from 'fs';

const FILE = 'dist/index.html';

if (!existsSync(FILE)) {
  console.error(`[inject-pwa] ${FILE} not found — run "expo export --platform web" first.`);
  process.exit(1);
}

let html = readFileSync(FILE, 'utf8');

// 1) viewport-fit=cover (notch-safe full-bleed) + lang=tr
html = html.replace(
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />',
);
html = html.replace('<html lang="en">', '<html lang="tr">');

// 2) PWA + iOS add-to-home-screen tags and the service-worker registration.
const HEAD = `
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#000000" />
    <meta name="application-name" content="Niki The Cat" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Niki The Cat" />
    <style>
      :focus-visible { outline: 2px solid #0a84ff; outline-offset: 2px; }
      [role="button"], a, button { cursor: pointer; }
      /* Fill the entire viewport (incl. the PWA safe-area / home-indicator) so the
         app reaches the bottom with no empty strip. height:100% chain is required
         or the flex:1 app root collapses to content height and leaves a gap.
         Colour follows the system scheme so the filled area matches the app. */
      html, body, #root { height: 100%; background-color: #ffffff; }
      @media (prefers-color-scheme: dark) { html, body, #root { background-color: #000000; } }
      html, body { margin: 0; min-height: 100%; overscroll-behavior: none; }
      #root { display: flex; flex-direction: column; }
    </style>
    <script src="/sw-register.js" defer></script>`;

if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', `${HEAD}\n  </head>`);
}

writeFileSync(FILE, html);
console.log('[inject-pwa] PWA head tags + service worker injected into', FILE);

// Stamp the service worker cache version with the content-hashed entry bundle
// name so each release busts the old cache (no stale builds).
const SW = 'dist/service-worker.js';
const entryMatch = html.match(/entry-([a-f0-9]+)\.js/);
if (entryMatch && existsSync(SW)) {
  const version = `niki-${entryMatch[1].slice(0, 12)}`;
  let sw = readFileSync(SW, 'utf8');
  sw = sw.replace(/const CACHE_VERSION = '[^']*';/, `const CACHE_VERSION = '${version}';`);
  writeFileSync(SW, sw);
  console.log('[inject-pwa] service worker CACHE_VERSION set to', version);
}
