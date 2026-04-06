import { useTranslation } from "@pmate/i18n"
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser"
import { useCallback, useEffect, useRef, useState } from "react"

type UseQrScannerOptions = {
  onScanSuccess?: (value: string) => void
}

export const useQrScanner = (options: UseQrScannerOptions = {}) => {
  const { onScanSuccess } = options
  const t = useTranslation()
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [hasStream, setHasStream] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  const stopScanner = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }
    controlsRef.current?.stop()
    controlsRef.current = null
    readerRef.current = null
    setHasStream(false)
  }, [])

  const handleScanSuccess = useCallback(
    (rawValue: string) => {
      const value = rawValue.trim()
      if (!value) return
      stopScanner()
      setScannerOpen(false)
      onScanSuccess?.(value)
    },
    [onScanSuccess, stopScanner]
  )

  const startScanner = useCallback(async () => {
    setScanError(null)
    if (typeof window === "undefined") {
      setScanError(t("QR scanning is unavailable in this environment"))
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError(t("Camera access is not supported on this device"))
      return
    }

    try {
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current ?? undefined,
        (result, error, controls) => {
          if (result?.getText()) {
            handleScanSuccess(result.getText())
            controls?.stop()
            return
          }
          if (error && error.name !== "NotFoundException") {
            console.error(error)
          }
        }
      )

      controlsRef.current = controls
      setHasStream(true)
    } catch (err) {
      console.error(err)
      setScanError(t("Unable to access the camera"))
    }
  }, [handleScanSuccess, t])

  const scanImageFile = useCallback(
    async (file: File | null) => {
      if (!file) return
      setScanError(null)
      try {
        const reader = readerRef.current ?? new BrowserMultiFormatReader()
        readerRef.current = reader
        const imageUrl = URL.createObjectURL(file)
        try {
          const result = await reader.decodeFromImageUrl(imageUrl)
          const text = result?.getText()?.trim()
          if (text) {
            handleScanSuccess(text)
          } else {
            setScanError(t("No QR code found in the selected image"))
          }
        } finally {
          URL.revokeObjectURL(imageUrl)
        }
      } catch (err) {
        console.error(err)
        setScanError(t("Unable to read QR code from the selected image"))
      }
    },
    [handleScanSuccess, t]
  )

  useEffect(() => {
    if (!scannerOpen) {
      stopScanner()
      return
    }
    startScanner()
    return () => {
      stopScanner()
    }
  }, [scannerOpen, startScanner, stopScanner])

  const openScanner = useCallback(() => {
    setScanError(null)
    setScannerOpen(true)
  }, [])

  const closeScanner = useCallback(() => {
    setScannerOpen(false)
    stopScanner()
  }, [stopScanner])

  return {
    videoRef,
    hasStream,
    scanError,
    scannerOpen,
    openScanner,
    closeScanner,
    scanImageFile,
  }
}
