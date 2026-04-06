export const appendCacheBuster = (url: string) => {
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}t=${Date.now()}`
}
