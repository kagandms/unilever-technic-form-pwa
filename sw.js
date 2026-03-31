// Service Worker for Servis Formu PWA (Single File Edition)

const CACHE_NAME = 'servis-formu-v19-auth-session';
const urlsToCache = [
    '/',
    '/login.html',
    '/index.html',
    '/manifest.json?v=3',
    '/logo.png',
    '/kase.jpg',
    '/unilever_logo.webp',
    '/icons/unilever-icon-v3-192.png?v=3',
    '/icons/unilever-icon-v3-512.png?v=3',
    '/icons/apple-touch-icon-v3.png?v=3'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});
