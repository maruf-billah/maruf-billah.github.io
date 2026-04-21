const CACHE_NAME = 'lms-app-shell-v1';
const VIDEO_CACHE = 'lms-videos-v1';

// App shell files that should instantly load offline
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/landing.html',
    '/courses.html',
    '/course_details.html',
    '/module-detail.html',
    '/styles.css',
    '/app.js',
    '/manifest.json'
];

// 1. Install Event (Cache app shell immediately)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching App Shell');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// 2. Activate Event (Clean up old caches if we bump versions)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME && key !== VIDEO_CACHE) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// 3. Fetch Interceptor (Serve from Cache first, then Network)
self.addEventListener('fetch', (event) => {
    // Determine if the request is for a video currently stored
    if (event.request.url.endsWith('.mp4')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[Service Worker] Serving Video from Offline Cache:', event.request.url);
                    return cachedResponse;
                }
                // If not in cache, stream normally from the web
                return fetch(event.request);
            })
        );
        return;
    }

    // Default Stale-While-Revalidate for app shell and images
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Ignore cross-origin issues or bad requests from caching
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                // Cache the newly fetched version quietly in background
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                // If offline and not in cache, it will just fail gracefully
            });

            // Return cache immediately if we have it, else wait for network
            return cachedResponse || fetchPromise;
        })
    );
});

// Listen for PostMessage to manually command the SW to manually download a video
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_VIDEO') {
        const videoUrl = event.data.url;
        console.log('[Service Worker] Instructed to cache video:', videoUrl);

        event.waitUntil(
            caches.open(VIDEO_CACHE).then((cache) => {
                return fetch(videoUrl).then((response) => {
                    if (response.ok) {
                        return cache.put(videoUrl, response.clone())
                            .then(() => {
                                // Notify client it's done via BroadcastChannel or postMessage reply
                                event.ports[0].postMessage({
                                    status: 'SUCCESS',
                                    url: videoUrl
                                });
                            });
                    }
                });
            }).catch(err => {
                console.error('[Service Worker] Video caching failed', err);
                event.ports[0].postMessage({ status: 'ERROR', error: err });
            })
        );
    }
});
