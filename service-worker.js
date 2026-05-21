const CACHE_NAME = "grodor-v3";

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/script.js",
  "/items.js",
  "/events.js",
  "/monsters.js",
  "/upgrades.js",
  "/manifest.webmanifest",
  "/supabase-config.js",
  "/vendor/supabase-js-v2.js",
  "/assets/icons/grodor-icon-192.png",
  "/assets/icons/grodor-icon-512.png",
  "/assets/icons/grodor-icon-maskable-192.png",
  "/assets/icons/grodor-icon-maskable-512.png",
  "/assets/Logo-Grodor.png",
  "/assets/Banniere-Grodor.png",
  "/assets/Donjon/Donjon-accueil.png",
  "/assets/Donjon/Donjon-interieur.png",
  "/assets/Donjon/Donjon-interieur-porte-1.png",
  "/assets/Donjon/Donjon-interieur-porte-2.png",
  "/assets/Donjon/Donjon-interieur-porte-3.png",
  "/assets/Donjon/geole-ferme.png",
  "/assets/Donjon/geole-ouvert.png",
  "/assets/Donjon/porte%20geole%20ferm%C3%A9.png",
  "/assets/Donjon/porte%20geole%20ouverte.png",
  "/assets/Village/village%20v0.2.png",
  "/assets/Arene/arene-1.png",
  "/assets/Arene/arene-2.png",
  "/assets/Arene/arene-3.png",
  "/assets/Ui/Bourse%20vide.png",
  "/assets/Ui/Bourse%20pleine.png",
  "/assets/Ui/inventaire%20vide.png",
  "/assets/Ui/inventaire%20plein.png",
  "/assets/Ui/coeur%20vide.png",
  "/assets/Ui/coeur%20plein.png",
  "/assets/Ui/po.png",
  "/assets/Ui/po-effet.png",
  "/assets/Hodor%20V0.1/Corps/Idle.png",
  "/assets/Hodor%20V0.1/Corps/question.png",
  "/assets/Hodor%20V0.1/Corps/fuite.png",
  "/assets/Hodor%20V0.1/Corps/degats.png",
  "/assets/Hodor%20V0.1/Corps/ko.png",
  "/assets/Hodor%20V0.1/Corps/mort.png",
  "/assets/Hodor%20V0.1/Corps/mort-mort.png",
  "/assets/Hodor%20V0.1/Corps/victoire.png",
  "/assets/Hodor%20V0.1/Corps/attaque-1.png",
  "/assets/Hodor%20V0.1/Corps/attaque-2.png",
  "/assets/Hodor%20V0.1/Corps/attaque-3.png",
  "/assets/Hodor%20V0.1/Corps/Marche/marche-1.png",
  "/assets/Hodor%20V0.1/Corps/Marche/marche-2.png",
  "/assets/Hodor%20V0.1/Corps/Marche/marche-3.png",
  "/assets/Hodor%20V0.1/Corps/Marche/marche-4.png",
  "/assets/Hodor%20V0.1/Stuff/Boulet/inv-Boulet.png",
  "/assets/Hodor%20V0.1/Stuff/Cailloux/inv-cailloux.png",
  "/assets/Hodor%20V0.1/Stuff/Casque/inv-casque.png",
  "/assets/Hodor%20V0.1/Stuff/Cape/inv-cape-casse.png",
  "/assets/Hodor%20V0.1/Stuff/Inventaire/inv-chaussette-porte-bonheur.png",
  "/assets/Hodor%20V0.1/Stuff/Gant/inv-gant-point-interieur.png",
  "/assets/Hodor%20V0.1/Stuff/Hache/inv-hache.png",
  "/assets/Hodor%20V0.1/Stuff/Medaillon%20du%20Presque-Heros/inv-medaillon.png",
  "/assets/Hodor%20V0.1/Stuff/Sandales%20de%20Panique/inv-sandale.png",
  "/assets/Hodor%20V0.1/Stuff/Slip%20de%20guerre/inv-slip-de-guerre.png",
  "/assets/Monstres/Rat/tete.png",
  "/assets/Monstres/Rat/corps.png",
  "/assets/Monstres/Rat/jambes.png",
  "/assets/Monstres/Squelette%20fatigue/tete.png",
  "/assets/Monstres/Squelette%20fatigue/corps.png",
  "/assets/Monstres/Squelette%20fatigue/jambes.png",
  "/assets/Monstres/Guard/Tete.png",
  "/assets/Monstres/Guard/corps.png",
  "/assets/Monstres/Guard/jambe.png"
];

function isSupabaseOrApiRequest(url) {
  return url.hostname.includes("supabase.co")
    || url.hostname.includes("supabase.in")
    || url.pathname.includes("/auth/")
    || url.pathname.includes("/rest/")
    || url.pathname.includes("/realtime/")
    || url.pathname.includes("/storage/v1/")
    || url.pathname.includes("/functions/v1/");
}

function isLocalStaticRequest(request, url) {
  return request.method === "GET"
    && url.origin === self.location.origin
    && (
      url.pathname === "/"
      || url.pathname.endsWith(".html")
      || url.pathname.endsWith(".css")
      || url.pathname.endsWith(".js")
      || url.pathname.endsWith(".json")
      || url.pathname.endsWith(".webmanifest")
      || url.pathname.startsWith("/assets/")
    );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || isSupabaseOrApiRequest(url)) {
    event.respondWith(fetch(request));
    return;
  }

  if (url.origin === self.location.origin && url.pathname.endsWith("/service-worker.js")) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (isLocalStaticRequest(request, url)) {
    event.respondWith(cacheFirstStatic(request));
  }
});

async function networkFirstPage(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put("/index.html", response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request, { ignoreSearch: true }))
      || (await cache.match("/index.html"))
      || Response.error();
  }
}

async function cacheFirstStatic(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}
