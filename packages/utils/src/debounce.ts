export const debounce = (func: Function, wait: number) => {
  let timeout: any
  return function executedFunction(...args: any) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const throttle = (func: (...args: any[]) => void, limit: number) => {
  let inThrottle: boolean
  return function executedFunction(...args: any[]) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
