import { useSnackbar } from "@pmate/uikit"
import { useState } from "react"

interface Options {
  successText: string
}
export const useRunOperation = (fn: () => Promise<void>, options?: Options) => {
  const { enqueueSnackbar } = useSnackbar()
  const [loading, setLoading] = useState(false)

  const caller = async () => {
    setLoading(true)
    try {
      await fn()
      if (options?.successText) {
        enqueueSnackbar(options.successText || "Success", {
          variant: "success",
        })
      }
    } catch (e: any) {
      console.error(e)
      enqueueSnackbar(e.toString(), {
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
