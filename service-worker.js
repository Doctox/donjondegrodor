const CACHE_NAME = "grodor-v181-village-sprite-ui2";

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
  "/assets/Background-Grodor.png",
  "/assets/Accueil/Background-Grodor.webp",
  "/assets/Accueil/Background-accueil-logo.png",
  "/assets/Donjon/Donjon-interieur.webp",
  "/assets/Donjon/Donjon-interieur-porte-1.png",
  "/assets/Donjon/Donjon-interieur-porte-2.png",
  "/assets/Donjon/Donjon-interieur-porte-3.png",
  "/assets/Donjon/geole-ferme.webp",
  "/assets/Donjon/geole-ouvert.webp",
  "/assets/Village/village.webp",
  "/assets/Village/cadre-village.png",
  "/assets/Village/bourse-vide-village.png",
  "/assets/Village/bourse-plein-village.png",
  "/assets/Village/inventaire-vide-village.png",
  "/assets/Village/inventaire-plein-village.png",
  "/assets/Arene/arene-1.webp",
  "/assets/Arene/arene-2.webp",
  "/assets/Arene/arene-3.webp",
  "/assets/Mini-jeu/pile-ou-face/pile-face-1.webp",
  "/assets/Mini-jeu/pile-ou-face/pile-face-2.webp",
  "/assets/Mini-jeu/pile-ou-face/pile-face-3.webp",
  "/assets/Mini-jeu/pile-ou-face/pile-face-4.webp",
  "/assets/Mini-jeu/pile-ou-face/pile-face-face.webp",
  "/assets/Mini-jeu/pile-ou-face/pile-face-pile.webp",
  "/assets/Mini-jeu/machine-a-sous/Machine-a-sous.webp",
  "/assets/Mini-jeu/machine-a-sous/Slot-1/Bourse-vide-slot-1.png",
  "/assets/Mini-jeu/machine-a-sous/Slot-1/Crane-slot-1.png",
  "/assets/Mini-jeu/machine-a-sous/Slot-1/Grodor-slot-1.png",
  "/assets/Mini-jeu/machine-a-sous/Slot-1/Po-slot-1.png",
  "/assets/Mini-jeu/machine-a-sous/Slot-2/Bourse-vide-slot-2.png",
  "/assets/Mini-jeu/machine-a-sous/Slot-2/Crane-slot-2.png",
  "/assets/Mini-jeu/machine-a-sous/Slot-2/Grodor-slot-2.png",
  "/assets/Mini-jeu/machine-a-sous/Slot-2/Po-slot-2.png",
  "/assets/Mini-jeu/machine-a-sous/Slot-3/Bourse-vide-slot-3.png",
  "/assets/Mini-jeu/machine-a-sous/Slot-3/Crane-slot-3.png",
  "/assets/Mini-jeu/machine-a-sous/Slot-3/Grodor-slot-3.png",
  "/assets/Mini-jeu/machine-a-sous/Slot-3/Po-slot-3.png",
  "/assets/Mini-jeu/Bonneteau/bonneteau-face-cache.webp",
  "/assets/Mini-jeu/Bonneteau/Slot-1/bonneteau-slot-1-bourse.png",
  "/assets/Mini-jeu/Bonneteau/Slot-1/bonneteau-slot-1-carte.png",
  "/assets/Mini-jeu/Bonneteau/Slot-1/bonneteau-slot-1-crane.png",
  "/assets/Mini-jeu/Bonneteau/Slot-1/bonneteau-slot-1-grodor.png",
  "/assets/Mini-jeu/Bonneteau/Slot-1/bonneteau-slot-1-po.png",
  "/assets/Mini-jeu/Bonneteau/Slot-2/bonneteau-slot-2-bourse.png",
  "/assets/Mini-jeu/Bonneteau/Slot-2/bonneteau-slot-2-carte.png",
  "/assets/Mini-jeu/Bonneteau/Slot-2/bonneteau-slot-2-crane.png",
  "/assets/Mini-jeu/Bonneteau/Slot-2/bonneteau-slot-2-grodor.png",
  "/assets/Mini-jeu/Bonneteau/Slot-2/bonneteau-slot-2-po.png",
  "/assets/Mini-jeu/Bonneteau/Slot-3/bonneteau-slot-3-bourse.png",
  "/assets/Mini-jeu/Bonneteau/Slot-3/bonneteau-slot-3-carte.png",
  "/assets/Mini-jeu/Bonneteau/Slot-3/bonneteau-slot-3-crane.png",
  "/assets/Mini-jeu/Bonneteau/Slot-3/bonneteau-slot-3-grodor.png",
  "/assets/Mini-jeu/Bonneteau/Slot-3/bonneteau-slot-3-po.png",
  "/assets/Mini-jeu/coffre-esquive/coffre_open.webp",
  "/assets/Mini-jeu/coffre-esquive/coffre_esquive.webp",
  "/assets/Mini-jeu/coffre-esquive/coffre_open-gagner.webp",
  "/assets/Mini-jeu/coffre-esquive/coffre_esquive-gagner.webp",
  "/assets/Mini-jeu/coffre-esquive/coffre_esquive-perdu.webp",
  "/assets/Mini-jeu/coffre-esquive/esquive-1-ok.png",
  "/assets/Mini-jeu/coffre-esquive/esquive-1-eclate.png",
  "/assets/Mini-jeu/coffre-esquive/esquive-2-ok.png",
  "/assets/Mini-jeu/coffre-esquive/esquive-2-eclate.png",
  "/assets/Mini-jeu/coffre-esquive/esquive-3-ok.png",
  "/assets/Mini-jeu/coffre-esquive/esquive-3-eclate.png",
  "/assets/Mini-jeu/coffre-esquive/esquive-4-ok.png",
  "/assets/Mini-jeu/coffre-esquive/esquive-4-eclate.png",
  "/assets/Mini-jeu/coffre-esquive/esquive-5-ok.png",
  "/assets/Mini-jeu/coffre-esquive/esquive-5-eclate.png",
  "/assets/Mini-jeu/coffre-esquive/esquive-6-ok.png",
  "/assets/Mini-jeu/coffre-esquive/esquive-6-eclate.png",
  "/assets/Ui/bourse-vide.png",
  "/assets/Ui/bourse-pleine.png",
  "/assets/Ui/cadre-etage.png",
  "/assets/Ui/cadre-effet.png",
  "/assets/Ui/cadre-gagner.png",
  "/assets/Ui/cadre-perdu.png",
  "/assets/Ui/cadre-score.png",
  "/assets/Ui/cadre-tentative.png",
  "/assets/Ui/cadre-storyboard.png",
  "/assets/Ui/cadre-storyboard-geole.png",
  "/assets/Ui/barre-de-vie/barre-de-vie-1-3.png",
  "/assets/Ui/barre-de-vie/barre-de-vie-2-4.png",
  "/assets/Ui/barre-de-vie/barre-de-vie-3-5.png",
  "/assets/Ui/barre-de-vie/barre-de-vie-4-6.png",
  "/assets/Ui/barre-de-vie/coeur-1-3.png",
  "/assets/Ui/barre-de-vie/coeur-2-3.png",
  "/assets/Ui/barre-de-vie/coeur-3-3.png",
  "/assets/Ui/barre-de-vie/coeur-1-4.png",
  "/assets/Ui/barre-de-vie/coeur-2-4.png",
  "/assets/Ui/barre-de-vie/coeur-3-4.png",
  "/assets/Ui/barre-de-vie/coeur-4-4.png",
  "/assets/Ui/barre-de-vie/coeur-1-5.png",
  "/assets/Ui/barre-de-vie/coeur-2-5.png",
  "/assets/Ui/barre-de-vie/coeur-3-5.png",
  "/assets/Ui/barre-de-vie/coeur-4-5.png",
  "/assets/Ui/barre-de-vie/coeur-5-5.png",
  "/assets/Ui/barre-de-vie/coeur-1-6.png",
  "/assets/Ui/barre-de-vie/coeur-2-6.png",
  "/assets/Ui/barre-de-vie/coeur-3-6.png",
  "/assets/Ui/barre-de-vie/coeur-4-6.png",
  "/assets/Ui/barre-de-vie/coeur-5-6.png",
  "/assets/Ui/barre-de-vie/coeur-6-6.png",
  "/assets/Ui/inventaire-vide.png",
  "/assets/Ui/inventaire-plein.png",
  "/assets/Ui/bon-effet.png",
  "/assets/Ui/mauvais-effet.png",
  "/assets/Ui/neutre-effet.png",
  "/assets/Ui/panneau-geole.png",
  "/assets/Ui/panneau-village.png",
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

  if (url.origin === self.location.origin && (url.pathname.endsWith(".js") || url.pathname.endsWith(".css"))) {
    event.respondWith(networkFirstStatic(request));
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

async function networkFirstStatic(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response && response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request, { ignoreSearch: true }))
      || Response.error();
  }
}
