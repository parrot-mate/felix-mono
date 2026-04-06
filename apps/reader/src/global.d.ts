declare global {
  interface Window {
    PmateBridge: {
      call: (functionName: string, params?: any) => Promise<any>
      __notify: (event: any) => void
    }
    isPmate: boolean
  }
}

export {}
