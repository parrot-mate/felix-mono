// esbuild.config.js

const esbuild = require("esbuild")

esbuild
  .build({
    entryPoints: ["src/index.ts"],
    outfile: "dist/index.js",
    bundle: true,
    format: "cjs",
    platform: "browser",
    external: ["proxy-agent", "ali-oss"],
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
