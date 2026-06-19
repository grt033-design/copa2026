/* ════ SERVICE WORKER copa2026-v4 ════
   Estratégia por tipo de recurso:
   - index.html  → SEMPRE da rede (nunca do cache) — dados de jogos mudam constantemente
   - flagcdn.com → cache primeiro (bandeiras não mudam)
   - manifest    → rede primeiro, cache fallback
   - resto       → rede primeiro, cache fallback
*/
const CACHE = 'copa2026-v4';
const FLAG_CACHE = 'flags-v1';

self.addEventListener('install', e => {
  // Pré-cacheia só o manifest e sw (NÃO o index.html — ele deve sempre vir da rede)
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['./manifest.json']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Remove todos os caches antigos
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE && k !== FLAG_CACHE)
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // ── Bandeiras: cache primeiro (nunca mudam)
  if (url.hostname === 'flagcdn.com') {
    e.respondWith(
      caches.open(FLAG_CACHE).then(c =>
        c.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            c.put(e.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // ── API Anthropic: nunca cachear
  if (url.hostname === 'api.anthropic.com') {
    e.respondWith(fetch(e.request));
    return;
  }

  // ── index.html: SEMPRE da rede, sem cache
  if (url.pathname.endsWith('index.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).catch(() =>
        caches.match('./index.html')
      )
    );
    return;
  }

  // ── Tudo mais: rede primeiro, cache como fallback offline
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
