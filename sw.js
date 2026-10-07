/* AquaGestión · service worker: permite abrir la app sin internet.
   Guarda index.html y la librería de Supabase. NUNCA guarda llamadas a la API. */
const CACHE = 'aquagestion-v2';
const CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all([
    c.add('./'), c.add('./index.html'), c.add('./manifest.json'),
    c.add('./icon-192.png'), c.add('./icon-512.png'), c.add('./icon-maskable-512.png'), c.add('./apple-touch-icon.png'),
    fetch(CDN, {mode:'no-cors'}).then(r => c.put(CDN, r)).catch(() => {})
  ])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if(e.request.method !== 'GET' || u.hostname.endsWith('supabase.co')) return;          // API y fotos: siempre a la red
  const esApp = u.origin === location.origin || e.request.url.startsWith('https://cdn.jsdelivr.net/npm/@supabase');
  if(!esApp) return;
  // Primero red (para recibir actualizaciones); si no hay internet, lo guardado
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; })
    .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html'))));
});
