// esbuild.config.js

const esbuild = require("esbuild")

esbuild
  .build({
    entryPoints: ["src/prompt.ts"],
    outfile: "dist/prompt.js",
    bundle: true,
    format: "esm",
    platform: "browser",
    external: ["proxy-agent"],
    define: {
      // If a library tries to access `location.protocol`
      location: "globalThis.location",
      // If a library references `window`
      window: "globalThis",
    },
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
