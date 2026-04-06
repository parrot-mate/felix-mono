import qs from "query-string"

export const bookParam = () => {
  const params = qs.parseUrl(window.location.href).query
  return params.book as string
}
