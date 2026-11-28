/* 오프라인 캐시: 전시장 와이파이가 끊겨도 체험이 돌아가게 */
const V = 'expo-20261128-b5';
const FILES = ['./', 'index.html', 'config.js', 'platform-web.js', 'data.js', 'persona.js', 'content.js', 'adult.js', 'app.js', 'guide.js', 'qrcode.js', 'expo.js', 'study.js', 'balance.js', 'aicheck.js',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'logo.png', 'icons/crib.png', 'icons/prep.png', 'icons/awha.png', 'voice/guide.mp3',
  'char/thumbs.webp', 'char/point_left.webp', 'char/stop.webp', 'char/surprised.webp', 'char/think.webp', 'char/point_right2.webp', 'char/joy.webp', 'char/point_right.webp', 'char/compare.webp', 'char/jump.webp'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) {   // 글꼴 등 바깥 파일: 받은 것은 저장해 두고, 끊기면 저장본
    e.respondWith(caches.open(V).then(c => fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; }).catch(() => c.match(e.request))));
    return;
  }
  // 우리 파일: 먼저 네트워크(새 버전), 끊기면 저장본. ?v= 같은 꼬리는 떼고 찾음
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
