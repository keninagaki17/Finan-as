
const CACHE="meu-saldo-v6-9-6-sem-aviso";

const ASSETS=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install",e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>c.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
      ))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  e.respondWith(
    fetch(e.request)
      .catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html")))
  );
});

self.addEventListener("push",e=>{
  let data={};
  try{ data=e.data ? e.data.json() : {}; }catch{}
  e.waitUntil(
    self.registration.showNotification(
      data.title || "Meu Saldo",
      {
        body:data.body || "Compra para confirmar.",
        icon:"./icon-192.png",
        badge:"./icon-192.png",
        tag:data.tag || "meu-saldo",
        renotify:true,
        data:{url:data.url || "./"}
      }
    )
  );
});

self.addEventListener("notificationclick",e=>{
  e.notification.close();
  const target=e.notification.data?.url || "./";
  e.waitUntil(
    clients.matchAll({type:"window",includeUncontrolled:true})
      .then(list=>{
        for(const c of list){
          if("focus" in c){
            c.navigate(target);
            return c.focus();
          }
        }
        return clients.openWindow(target);
      })
  );
});
