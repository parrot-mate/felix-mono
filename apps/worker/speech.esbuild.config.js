// esbuild.config.js

const esbuild = require("esbuild")

esbuild
  .build({
    entryPoints: ["src/speech/index.ts"],
    outfile: "dist/speech.js",
    bundle: true,
    format: "esm",
    platform: "browser",
    external: [],
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
