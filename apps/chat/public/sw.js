// public/sw.js
const META_CACHE = "meta-cache"
const STATIC_CACHE = "static-cache-v1"

// Immediately activate this service worker upon installation
self.addEventListener("install", (e) => {
  self.skipWaiting()
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== META_CACHE)
            .map((key) => caches.delete(key))
        )
      )
  )
})

// Name of the cache for .meta files

/**
 * Implements Stale-While-Revalidate for .meta files:
 * 1. Serve from cache if present.
 * 2. Fetch from network in the background, update the cache for next time.
 */
self.addEventListener("fetch", (event) => {
  // Only handle requests for .meta files
  const request = event.request
  const url = new URL(request.url)
  if (event.request.url.endsWith(".meta")) {
    event.respondWith(staleWhileRevalidate(event.request))
  }

  const dest = request.destination
  const isDocument = dest === "document" || url.pathname.endsWith(".html")
  const isScript = dest === "script" || url.pathname.endsWith(".js")
  const isStyle = dest === "style" || url.pathname.endsWith(".css")

  const isHtmlFile = url.pathname.endsWith(".html")
  const isJsFile = url.pathname.endsWith(".js")
  const isCssFile = url.pathname.endsWith(".css")

  if (
    isDocument ||
    isScript ||
    isStyle ||
    isHtmlFile ||
    isJsFile ||
    isCssFile
  ) {
    event.respondWith(networkFirst(request))
  }
})

async function staleWhileRevalidate(request) {
  try {
    const cache = await caches.open(META_CACHE)
    const cachedResponse = await cache.match(request)

    // Kick off a fetch request in the background
    const fetchPromise = fetch(request).then((networkResponse) => {
      // Update the cache with the fresh version
      cache.put(request, networkResponse.clone())
      return networkResponse
    })

    // If there's a cached version, return it immediately
    // If not, wait for the network.
    return cachedResponse || fetchPromise
  } catch (ex) {
    console.warn("Error in staleWhileRevalidate:", ex)
  }
}

async function networkFirst(request) {
  const cache = await caches.open(STATIC_CACHE)
  try {
    const response = await fetch(request)
    // update cache in background
    cache.put(request, response.clone())
    return response
  } catch (err) {
    // offline — serve from cache if we have it
    const cached = await cache.match(request)
    if (cached) return cached

    // if it was a navigation request, fall back to our shell
    if (request.mode === "navigate") {
      return cache.match("/")
    }

    // nothing left — throw so the browser can handle it (e.g. show its own error)
    throw err
  }
}
