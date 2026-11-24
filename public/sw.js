// Service worker minimal: menyimpan halaman bantuan krisis agar tetap bisa dibuka tanpa koneksi (FR-007).
const CACHE = "arka-help-v1";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/bantuan"])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => {
        if (url.pathname === "/bantuan") caches.open(CACHE).then((c) => c.put("/bantuan", res.clone()));
        return res;
      }).catch(() => caches.match("/bantuan"))
    );
  } else if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })));
  }
});
