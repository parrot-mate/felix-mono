import clsx from "clsx"
import React, { createContext, useContext, useState } from "react"

export type SnackbarKey = string | number
export type SnackbarVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"

export interface SnackbarOptions {
  variant?: SnackbarVariant
  autoHideDuration?: number
  action?: (key: SnackbarKey) => React.ReactNode
  key?: SnackbarKey
}

interface SnackbarContextType {
  enqueueSnackbar: (
    message: React.ReactNode,
    options?: SnackbarOptions
  ) => SnackbarKey
  closeSnackbar: (key?: SnackbarKey) => void
}

const SnackbarContext = createContext<SnackbarContextType>({
  enqueueSnackbar: () => {
    throw new Error("useSnackbar must be used within a SnackbarProvider")
  },
  closeSnackbar: () => {},
})

let externalClose: (key?: SnackbarKey) => void = () => {}
export const closeSnackbar = (key?: SnackbarKey) => externalClose(key)

const variantClass: Record<SnackbarVariant, string> = {
  default: "bg-gradient-parrot",
  success: "bg-gradient-parrot",
  error: "bg-red-600",
  warning: "bg-yellow-500 text-black",
  info: "bg-violet-50",
}

export interface SnackbarProviderProps {
  children: React.ReactNode
  maxSnack?: number
  autoHideDuration?: number
  action?: (key: SnackbarKey) => React.ReactNode
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({
  children,
  maxSnack = 3,
  autoHideDuration = 2000,
  action,
}) => {
  const [snacks, setSnacks] = useState<
    { key: SnackbarKey; message: React.ReactNode; options?: SnackbarOptions }[]
  >([])

  const enqueueSnackbar = (
    message: React.ReactNode,
    options?: SnackbarOptions
  ): SnackbarKey => {
    const key = options?.key ?? Date.now()
    setSnacks((prev) => {
      const next = [...prev, { key, message, options }]
      return next.slice(-maxSnack)
    })
    const hide = options?.autoHideDuration ?? autoHideDuration
    if (hide) {
      setTimeout(() => closeSnackbarInternal(key), hide)
    }
    return key
  }

  const closeSnackbarInternal = (key?: SnackbarKey) => {
    if (key === undefined) {
      setSnacks([])
    } else {
      setSnacks((prev) => prev.filter((s) => s.key !== key))
    }
  }

  externalClose = closeSnackbarInternal

  return (
    <SnackbarContext.Provider
      value={{ enqueueSnackbar, closeSnackbar: closeSnackbarInternal }}
    >
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[1103]">
        {snacks.map((snack) => (
          <div
            key={snack.key}
            className={clsx(
              "text-white px-4 py-2 rounded shadow flex items-center",
              variantClass[snack.options?.variant || "default"]
            )}
          >
            <div className="flex-1">{snack.message}</div>
            {action ? (
              action(snack.key)
            ) : (
              <button
                className="ml-2"
                onClick={() => closeSnackbarInternal(snack.key)}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </SnackbarContext.Provider>
  )
}

export const useSnackbar = () => useContext(SnackbarContext)
