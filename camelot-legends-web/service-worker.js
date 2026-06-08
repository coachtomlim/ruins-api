const CACHE_NAME = "camelot-legends-web-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./public/manifest.webmanifest",
  "./public/assets/icons/camelot-legends.svg",
  "./public/assets/recovered/characters-v2.png",
  "./public/assets/recovered/level-design-example.png",
  "./src/static/content-loader.js",
  "./src/static/game-core.js",
  "./src/static/main.js",
  "./src/static/pwa.js",
  "./src/static/save-load.js",
  "./src/static/styles.css",
  "./public/content/areas.json",
  "./public/content/asset-manifest.json",
  "./public/content/characters.json",
  "./public/content/dialogue.json",
  "./public/content/equipment.json",
  "./public/content/items.json",
  "./public/content/missions.json",
  "./public/content/scenes.json",
  "./public/content/skills.json",
  "./public/content/worlds.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

async function cacheResponse(request, response) {
  if (!response || !response.ok) return response;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    return await cacheResponse(request, await fetch(request));
  } catch {
    return caches.match(request);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  return cacheResponse(request, await fetch(request));
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request).then((response) => response || caches.match("./index.html")));
    return;
  }

  if (url.pathname.startsWith("/public/content/") || url.pathname.startsWith("/content/")) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});
