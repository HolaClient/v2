self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('hc').then(function(cache) {
            return cache.addAll(['/']);
        })
    );
    self.skipWaiting();
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request).then(function(networkResponse) {
                return caches.open('hc').then(function(cache) {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        }).catch(function() {
            if (event.request.mode === 'navigate') {
                return caches.match('/assets/common/offline.html');
            }
        })
    );
});

self.addEventListener('activate', function(event) {
    var cacheWhitelist = ['hc'];
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});