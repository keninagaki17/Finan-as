const CACHE = "meu-saldo-flex-v5";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() =>
      caches
        .match(event.request)
        .then(response => response || caches.match("./index.html"))
    )
  );
});

self.addEventListener("push", event => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title || "Meu Saldo",
      {
        body: data.body || "Compra para confirmar.",
        icon: "./icon-192.png",
        badge: "./icon-192.png",
        tag: data.tag || "meu-saldo",
        renotify: true,
        data: {
          url: data.url || "./"
        }
      }
    )
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  const target =
    event.notification.data?.url || "./";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true
      })
      .then(list => {
        for (const client of list) {
          if ("focus" in client) {
            client.navigate(target);
            return client.focus();
          }
        }

        return clients.openWindow(target);
      })
  );
});
