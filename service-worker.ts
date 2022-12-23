const sw = self as unknown as ServiceWorkerGlobalScope;

const cacheName = "happyflyer-v1";
const contentToCache = ["/", "/index.html", "/index.js", "/style.css"];

sw.addEventListener("install", (e) => {
  console.log("[Service Worker] Install");

  e.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      console.log("[Service Worker] Caching all: app shell and content");
      await cache.addAll(contentToCache);
    })()
  );
});

sw.addEventListener("fetch", (e) => {
  console.log(`[Service Worker] Fetching resource: ${e.request.url}`);

  e.respondWith(
    fetch(e.request)
      .then(function (response) {
        const copy = response.clone();
        caches.open(cacheName).then(function (cache) {
          console.log(`[Service Worker] Caching resource: ${e.request.url}`);
          cache.put(e.request, copy);
        });
        return response;
      })
      .catch(function () {
        return caches.match(e.request);
      }) as Promise<Response>
  );
});

sw.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key === cacheName) {
            return;
          }
          console.log(`[Service Worker] Deleting cache: ${key}`);
          return caches.delete(key);
        })
      );
    })
  );
});
