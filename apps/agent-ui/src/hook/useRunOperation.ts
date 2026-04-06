import { useSnackbar } from "@pmate/uikit"
import { useState } from "react"

interface Options {
  successText?: string
}

export const useRunOperation = (fn: () => Promise<void>, options?: Options) => {
  const { enqueueSnackbar } = useSnackbar()
  const [loading, setLoading] = useState(false)

  const caller = async () => {
    setLoading(true)
    try {
      await fn()
      if (options?.successText) {
        enqueueSnackbar(options.successText, {
          variant: "success",
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      enqueueSnackbar(message, {
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    run: caller,
  }
}
