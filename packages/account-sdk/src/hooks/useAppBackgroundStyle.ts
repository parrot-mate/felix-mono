import { useEffect, useMemo, useState } from "react"
import { getAppConfig } from "../app.config"
import { getWindowSearch, subscribeToLocationChange } from "../utils/location"

export const useAppBackgroundStyle = () => {
  const [search, setSearch] = useState(getWindowSearch())
  useEffect(() => {
    const update = () => setSearch(getWindowSearch())
    const unsubscribe = subscribeToLocationChange(update)
    return () => unsubscribe()
  }, [])
  const appParam = useMemo(
    () => new URLSearchParams(search).get("app"),
    [search]
  )

  return useMemo(
    () => ({ background: getAppConfig(appParam).background }),
    [appParam]
  )
}
