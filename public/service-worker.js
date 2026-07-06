// 킬스위치 서비스워커 — 기존 바닐라 PWA의 cache-first SW를 해제한다.
// 브라우저의 SW 업데이트 체크는 기존 SW의 fetch 핸들러와 HTTP 캐시를 우회하므로
// 같은 URL(/service-worker.js)에 이 파일을 두면 기존 설치 사용자에게 확실히 전달된다.
// 동작: 캐시 전체 삭제 → 자기 자신 unregister → 열려있는 창 강제 리로드.
// fetch 핸들러 없음 (네트워크에 일절 개입하지 않음).
// 기존 PWA 설치 사용자가 모두 전환될 때까지 수개월 유지할 것.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});
