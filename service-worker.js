const CACHE_NAME = "reef-log-pwa-v47";
const APP_SHELL = [
  "./",
  "index.html",
  "styles.css?v=auth-split-v1",
  "app.js?v=auth-split-v1",
  "manifest.webmanifest",
  "assets/backgrounds/saltwater-coral-open-hq.jpg",
  "assets/backgrounds/saltwater-coral-canyon-hq.jpg",
  "assets/backgrounds/saltwater-coral-cave-hq.jpg",
  "assets/backgrounds/saltwater-coral-pillars-hq.jpg",
  "assets/backgrounds/saltwater-coral-lagoon-hq.jpg",
  "assets/backgrounds/saltwater-coral-left-reef-hq.jpg",
  "assets/backgrounds/freshwater-rocks-hq.jpg",
  "assets/backgrounds/freshwater-driftwood-arch-hq.jpg",
  "assets/backgrounds/freshwater-jungle-path-hq.jpg",
  "assets/backgrounds/freshwater-stump-valley-hq.jpg",
  "assets/backgrounds/freshwater-center-plants-hq.jpg",
  "assets/backgrounds/freshwater-lily-path-hq.jpg",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (requestUrl.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.match(event.request)
      .then((cached) => cached || fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }))
  );
});

self.addEventListener("push", (event) => {
  const fallback = {
    title: "리프로그 알림",
    body: "오늘의 어항 관리 일정을 확인해 주세요."
  };
  const data = event.data ? event.data.json() : fallback;
  event.waitUntil(
    self.registration.showNotification(data.title || fallback.title, {
      body: data.body || fallback.body,
      icon: "assets/icons/icon-192.png",
      badge: "assets/icons/icon-192.png",
      data: { url: data.url || "./" }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "./";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const matched = clients.find((client) => client.url.includes(self.location.origin));
      if (matched) return matched.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});
