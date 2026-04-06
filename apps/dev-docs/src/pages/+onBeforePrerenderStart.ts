import { getAllDocPaths } from "./docsContent"

export const onBeforePrerenderStart = async () => {
  return getAllDocPaths()
}
