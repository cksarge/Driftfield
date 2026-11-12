// =============================================================
//  SERVICE WORKER — makes Driftfield playable offline.
//
//  On install it caches every game file listed below. Afterwards
//  the game loads from the cache first, so it works with no
//  internet at all. After changing files, run
//  `node tools/build-sw.mjs`: it rewrites FILES and CACHE_VERSION
//  so players get the update.
// =============================================================

const CACHE_VERSION = 'driftfield-ddb407e517';

const FILES = [
  './',
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/icons/icon.svg",
  "./css/animations.css",
  "./css/base.css",
  "./css/hud.css",
  "./css/panels.css",
  "./data/animals.js",
  "./data/bases.js",
  "./data/buildings.js",
  "./data/characters.js",
  "./data/clothing.js",
  "./data/crops.js",
  "./data/decorations.js",
  "./data/effects.js",
  "./data/events.js",
  "./data/festivals.js",
  "./data/index.js",
  "./data/islands.js",
  "./data/items.js",
  "./data/land.js",
  "./data/pieces.js",
  "./data/quests.js",
  "./data/recipes.js",
  "./data/story.js",
  "./data/traders.js",
  "./data/tutorial.js",
  "./data/zones.js",
  "./index.html",
  "./js/animals.js",
  "./js/art.js",
  "./js/audio.js",
  "./js/breeding.js",
  "./js/buildings.js",
  "./js/crafting.js",
  "./js/customize.js",
  "./js/day.js",
  "./js/events.js",
  "./js/exploration.js",
  "./js/farming.js",
  "./js/festivals.js",
  "./js/input.js",
  "./js/interact.js",
  "./js/island.js",
  "./js/items.js",
  "./js/main.js",
  "./js/mixing.js",
  "./js/navigation.js",
  "./js/needs.js",
  "./js/quests.js",
  "./js/render.js",
  "./js/save.js",
  "./js/state.js",
  "./js/story.js",
  "./js/time.js",
  "./js/trading.js",
  "./js/tutorial.js",
  "./js/ui/bag.js",
  "./js/ui/buildpanel.js",
  "./js/ui/craftpanel.js",
  "./js/ui/explorepanel.js",
  "./js/ui/journal.js",
  "./js/ui/menus.js",
  "./js/ui/mixpanel.js",
  "./js/ui/tradepanel.js",
  "./js/ui/ui.js",
  "./js/utils.js",
  "./manifest.json",
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Cache first, then network (and remember anything new we fetch).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((hit) => hit || fetch(event.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE_VERSION).then((c) => c.put(event.request, copy)); }
      return res;
    }).catch(() => caches.match('./index.html'))),
  );
});
