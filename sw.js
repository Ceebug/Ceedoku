const CACHE_NAME = 'sudoku-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// Helper function to detect mobile data/metered connections
function isMobileData() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return false; 

  // Detects Windows "Metered Connection" toggle or Mobile Hotspots
  if (conn.saveData) return true;

  // Detects cellular connections
  const cellularTypes = ['cellular', '2g', '3g', '4g', '5g'];
  if (cellularTypes.includes(conn.type)) return true;

  // Detects slow networks
  if (conn.effectiveType === '2g' || conn.effectiveType === '3g') return true;

  return false;
}

// 1. Save all files locally into phone memory on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Clear out any old versions if you update the cache name later
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
});

// 3. UPDATED MAGIC ZONE: Stale-While-Revalidate with Mobile Data Gatekeeping
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      
      // If we have a cached file, use it instantly for lightning-fast loading
      if (cachedResponse) {
        
        // Only fetch updates in the background if the user is ONLINE and NOT on mobile data
        if (navigator.onLine && !isMobileData()) {
          fetch(event.request).then((networkResponse) => {
            // Ensure the network response is valid before caching it
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {
            // Fail silently if network fails during background fetching
          });
        }
        
        return cachedResponse;
      }

      // Fallback: If asset wasn't precached, go to the network directly
      return fetch(event.request);
    })
  );
});
