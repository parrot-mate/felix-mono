export function pageURL() {
  const url = window.location.href
  return url.split("#")[0]
}
