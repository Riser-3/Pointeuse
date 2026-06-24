const CACHE_NAME = "pointeuse-507h-v1";

// Liste de tous les fichiers dont l'application a besoin pour fonctionner hors ligne
const ASSETS_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json",
    // On met en cache les liens CDN de Bootstrap !
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
];

// Étape 1 : Installation (Téléchargement de tous les fichiers dans le cache)
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Mise en cache des fichiers...");
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Étape 2 : Interception (Lecture depuis le cache quand tu es hors ligne)
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Si le fichier est dans le cache, on le donne. Sinon, on va sur internet.
            return cachedResponse || fetch(event.request);
        })
    );
});