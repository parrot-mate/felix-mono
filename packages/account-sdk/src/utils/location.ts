const LOCATION_CHANGE_EVENT = "pmate:locationchange"

const ensureLocationEvents = () => {
  const history = window.history as History & { __pmatePatched?: boolean }
  if (history.__pmatePatched) {
    return
  }
  history.__pmatePatched = true
  const notify = () => window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT))
  const wrap = (type: "pushState" | "replaceState") => {
    const original = history[type]
    history[type] = function (...args) {
      const result = original.apply(
        history,
        args as Parameters<History["pushState"]>
      )
      notify()
      return result
    } as History["pushState"]
  }
  wrap("pushState")
  wrap("replaceState")
  window.addEventListener("popstate", notify)
}

export const subscribeToLocationChange = (listener: () => void) => {
  ensureLocationEvents()
  window.addEventListener(LOCATION_CHANGE_EVENT, listener)
  return () => window.removeEventListener(LOCATION_CHANGE_EVENT, listener)
}

export const getWindowPathname = () => window.location.pathname

export const getWindowSearch = () => window.location.search
