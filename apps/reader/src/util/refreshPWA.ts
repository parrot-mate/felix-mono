export function refreshPWA() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then((unregistered) => {
            if (unregistered) {
              console.log("Service worker unregistered, refreshing the app.")
              // Reload the page to fetch the latest content
              window.location.reload()
            }
          })
        })
      })
      .catch((error) => {
        console.error("Error while unregistering service workers:", error)
      })
    window.location.reload()
  } else {
    console.log("No service worker detected, reloading the app.")
    // Reload the page to refresh the PWA
    window.location.reload()
  }
}
