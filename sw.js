
/* Meu Saldo V6.10 — PWA e notificações */
const CACHE = "meu-saldo-v6-10-ciclos-animacoes";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Um ícone ausente não deve impedir a atualização do aplicativo.
    await Promise.allSettled(ASSETS.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("meu-saldo-") && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Nunca guardar em cache as requisições ao Supabase ou outros serviços externos.
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") {
        const home = await caches.match("./index.html");
        if (home) return home;
      }
      throw error;
    }
  })());
});

self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  event.waitUntil(self.registration.showNotification(data.title || "Meu Saldo", {
    body: data.body || "Compra para confirmar.",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    tag: data.tag || "meu-saldo",
    renotify: true,
    data: {url: data.url || "./"}
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const requested = event.notification.data?.url || "./";
  const target = new URL(requested, self.registration.scope);
  // Impede redirecionamento para domínio externo por payload de push.
  if (target.origin !== self.location.origin) return;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({type:"window", includeUncontrolled:true});
    for (const client of windows) {
      if ("focus" in client) {
        if ("navigate" in client) await client.navigate(target.href);
        return client.focus();
      }
    }
    return self.clients.openWindow(target.href);
  })());
});
