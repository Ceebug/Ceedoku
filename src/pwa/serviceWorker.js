const CACHE_NAME = 'ceedoku-cache-v5';

const ASSETS_TO_CACHE = [
    '../../',
    '../../index.html',
    '../../src/pwa/manifest.json',
    '../../src/js/puzzleGen.js',
    '../../src/js/script.js',
    '../../src/js/lib/TSparticles.confetti.js',
    '../../src/js/lib/FSJ.js',
    '../../src/js/lib/JSF.js',
    '../../src/css/style.css',
    '../../src/css/hoverPatch.css',
    '../../src/pwa/serviceWorker.js',
    '../../src/fonts/roboto/font.woff2',
    '../../src/fonts/ceedokumono/font.woff2',
    '../../src/images/trophy.png',
    '../../src/images/logo/wordmark.png',
    '../../src/images/logo/icon/128.png',
    '../../src/images/logo/icon/144.png',
    '../../src/images/logo/icon/resizable.svg',
    '../../src/images/logo/icon/maskable/48.png',
    '../../src/images/logo/icon/maskable/72.png',
    '../../src/images/logo/icon/maskable/96.png',
    '../../src/images/logo/icon/maskable/128.png',
    '../../src/images/logo/icon/maskable/192.png',
    '../../src/images/logo/icon/maskable/384.png',
    '../../src/images/logo/icon/maskable/512.png',
    '../../src/sounds/pop.ogg',
    '../../src/sounds/win.ogg'
];

// Helper function to detect mobile data / metered connections
function isMobileData() {
    const conn =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;

    if (!conn) return false;

    // Data Saver mode
    if (conn.saveData) return true;

    // Cellular connections
    const cellularTypes = ['cellular', '2g', '3g', '4g', '5g'];

    if (cellularTypes.includes(conn.type)) {
        return true;
    }

    // Slow connections
    if (
        conn.effectiveType === '2g' ||
        conn.effectiveType === '3g'
    ) {
        return true;
    }

    return false;
}


// 1. Install
// Pre-cache the essential files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );

    self.skipWaiting();
});


// 2. Activate
// Delete old cache versions
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});


// 3. Fetch
// Cache-first strategy with network fallback
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {

            // If we already have it cached,
            // return it immediately.
            if (cachedResponse) {

                // Update the cache in the background
                // when online and not using mobile data.
                if (navigator.onLine && !isMobileData()) {

                    fetch(event.request)
                        .then((networkResponse) => {

                            if (
                                networkResponse &&
                                networkResponse.status === 200
                            ) {
                                const responseClone =
                                    networkResponse.clone();

                                caches.open(CACHE_NAME).then((cache) => {
                                    cache.put(
                                        event.request,
                                        responseClone
                                    );
                                });
                            }

                        })
                        .catch(() => {
                            // Ignore background update failures
                        });
                }

                return cachedResponse;
            }


            // If the resource isn't cached,
            // fetch it from the network.
            return fetch(event.request)
                .then((networkResponse) => {

                    // Cache successful responses
                    if (
                        networkResponse &&
                        networkResponse.status === 200
                    ) {
                        const responseClone =
                            networkResponse.clone();

                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(
                                event.request,
                                responseClone
                            );
                        });
                    }

                    return networkResponse;
                })
                .catch(() => {

                    // If we're offline and the resource
                    // wasn't cached, try returning the
                    // offline page.
                    return caches.match('./index.html');
                });
        })
    );
});
