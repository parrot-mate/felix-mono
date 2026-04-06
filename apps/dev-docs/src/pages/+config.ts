import vikeReact from "vike-react/config"
import type { Config } from "vike/types"

const DEFAULT_DOC_PATH = "/guide/environment-setup"

export default {
  extends: vikeReact,
  prerender: true,
  redirects: {
    "/": `/en${DEFAULT_DOC_PATH}`,
    "/en": `/en${DEFAULT_DOC_PATH}`,
    "/cn": `/cn${DEFAULT_DOC_PATH}`,
  },
} satisfies Config
