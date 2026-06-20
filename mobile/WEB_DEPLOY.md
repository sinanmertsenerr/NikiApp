# Niki Web (PWA) — Deploy Runbook

The web app is the **same Expo codebase** as the mobile app, built for the browser
with react-native-web. It is a responsive, installable PWA that looks like the
mobile app (centered phone frame on desktop, full-screen on phones).

Test domain: **https://nikiapp.sinansener.com**

## Build
```bash
cd mobile
# EXPO_PUBLIC_API_URL is baked at BUILD time = your backend origin.
EXPO_PUBLIC_API_URL=https://niki.ieu.app npm run build:web
# -> produces mobile/dist/ (static SPA + manifest + service worker + icons)
```
`build:web` runs `expo export --platform web` then `scripts/inject-pwa.mjs`
(injects PWA head tags into dist/index.html and stamps the service-worker cache
version — `web.output: "single"` ignores `app/+html.tsx`).

## Docker
```bash
cd mobile
EXPO_PUBLIC_API_URL=https://niki.ieu.app \
  docker compose -f docker-compose.web.yml up -d --build
# nginx serves dist/ on :8080 with SPA fallback + gzip + cache headers
```
Or build the image directly with `Dockerfile.web` (same build-arg).

## Required at deploy
1. **HTTPS is mandatory** (camera/QR via getUserMedia, PWA install, service
   worker). Terminate TLS at a GCP HTTPS Load Balancer / Cloudflare forwarding to
   the container's :80, or enable the 443 block in `nginx.web.conf`.
2. **Backend CORS** — set `WEB_APP_URL=https://nikiapp.sinansener.com` on the
   backend. It is added to BOTH the REST CORS (main.ts) and the WebSocket gateway
   allowlist (events.gateway.ts), kept in sync.
3. **CSP** — `nginx.web.conf` ships a CSP with `connect-src` for
   `https://niki.ieu.app wss://niki.ieu.app`. If your API/socket origin differs,
   update it (must include both the https API and the wss socket origin) and
   verify in a browser — an over-tight CSP breaks API/socket calls.
4. **EXPO_PUBLIC_API_URL** must point at the reachable backend at build time
   (it is inlined; not read at runtime).

## Verified locally
- `tsc --noEmit` clean (mobile + backend)
- `expo export --platform web` succeeds; dist/ has manifest.json,
  service-worker.js, icons/, and PWA head tags in index.html
- backend `nest build` clean

## Done in the hardening pass
- **Refresh tokens hashed at rest** (sha256) with backward-compatible lookup
  (legacy raw tokens still work; no user lockout). — auth.service.ts +
  jwt-refresh.strategy.ts + refresh-token.util.ts
- **CSP/security headers actually delivered** (repeated per nginx location to beat
  add_header inheritance shadowing); SW registration moved to an external
  /sw-register.js so `script-src 'self'` allows it.
- **Desktop modals constrained to the phone frame** (transform containing block).

## Known / deferred — needs the live env or an owner decision (NOT blind-shipped)
- **Web tokens in localStorage** (XSS-exfiltratable) — standard SPA tradeoff, now
  mitigated by the delivered CSP + 15-min access TTL + single-use refresh rotation.
  Full hardening = httpOnly cookie refresh for web; it touches client api.ts +
  backend auth + native parity, so it must be runtime-tested (not shipped blind
  before this deploy).
- **Rate-limit storage is in-memory** — correct for a SINGLE backend instance
  (the likely initial deploy). For multi-instance, add a Redis ThrottlerStorage.
  NOTE: `@nest-lab/throttler-storage-redis` has a peer-dep conflict with this
  stack; enable with `--legacy-peer-deps` + a runtime test, or use a custom
  ioredis-backed storage. Deferred to avoid a blind boot-critical change.
- **Native device smoke test** — the socket/api refresh bug-fixes improve native;
  verify on a real iOS/Android build before the mobile store release.
- **Image assets** (~2.2MB of card PNGs, 1000–1024px) — re-encode to WebP with
  cwebp/pngquant (not available in this env) for a faster FIRST load; the service
  worker caches them after first visit, so impact is one-time.
- **Perf runtime numbers** — gzip ratio / LCP to be measured on the deployed host
  (`curl -I` for Content-Encoding + a Lighthouse run).
