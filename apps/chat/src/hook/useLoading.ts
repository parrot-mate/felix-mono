import { useCallback, useEffect, useState } from "react"

type LoadingFN<T> = (...args: any[]) => Promise<T>

interface LoadingOptions {
  showLoadingFirst: boolean
  autoLoad: boolean
}

const defaultOptions: LoadingOptions = {
  showLoadingFirst: false,
  autoLoad: true,
}

export const useLoading = function <T>(
  fn: LoadingFN<T>,
  deps: any[],
  options?: Partial<LoadingOptions>
) {
  const _options: LoadingOptions = { ...defaultOptions, ...options }
  const [loading, setLoading] = useState<boolean>(_options.showLoadingFirst)
  const [data, setData] = useState<T | null>(null)

  const load = useCallback(async (...args: any[]) => {
    setLoading(true)
    setData(null)
    try {
      const data = await fn(...args)
      setData(data)
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    if (_options?.autoLoad) {
      load()
    }
  }, deps)
  return {
    load,
    loading,
    data,
    setLoading,
  }
}
