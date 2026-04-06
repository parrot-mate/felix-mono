import react from "@vitejs/plugin-react"
import { parse } from "dotenv"
import crypto from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import path from "path"
import { defineConfig, loadEnv } from "vite"

// Plugin-legacy expects crypto.hash (Node 22+); polyfill for current Node runtime.
if (!(crypto as unknown as { hash?: unknown }).hash) {
  ;(crypto as Record<string, unknown>).hash = (
    algorithm: string,
    data: string | Uint8Array,
    encoding?: crypto.BinaryToTextEncoding
  ) =>
    crypto
      .createHash(algorithm)
      .update(data)
      .digest(encoding as any)
}

const stripLocalEnv = (
  mode: string,
  env: Record<string, string>
): Record<string, string> => {
  if (mode !== "production") {
    return env
  }

  const localEnvPath = path.resolve(process.cwd(), ".env.local")
  if (!existsSync(localEnvPath)) {
    return env
  }

  const localEnvKeys = Object.keys(parse(readFileSync(localEnvPath)))
  for (const key of localEnvKeys) {
    delete env[key]
    delete process.env[key]
  }

  return env
}

export default defineConfig(async ({ mode }) => {
  const tailwindcss = (await import("@tailwindcss/vite")).default
  const legacy = (await import("@vitejs/plugin-legacy")).default
  const env = stripLocalEnv(mode, loadEnv(mode, process.cwd(), ""))
  const publicEnvEntries = Object.entries(env).filter(([key]) =>
    key.startsWith("VITE_PUBLIC_")
  )
  console.log(publicEnvEntries)
  const defineEnv: Record<string, string> = {}
  for (const [key, value] of publicEnvEntries) {
    defineEnv[key] = value
    process.env[key] = value
  }
  const staticPath = "/"
  const isSupportLegacy = Boolean(env.SUPPORT_LEGACY)
  const plugins = [react(), tailwindcss()]
  if (isSupportLegacy) {
    plugins.push(
      legacy({
        targets: ["defaults", "Android >= 8", "iOS >= 10"],
        renderLegacyChunks: true,
        modernPolyfills: true,
      })
    )
  }

  return {
    plugins,
    define: {
      "process.env": JSON.stringify({
        ...process.env,
        ...defineEnv,
      }),
    },
    server: {
      open: "/index.html",
    },
    optimizeDeps: {
      include: ["date-fns/format"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@sdk": path.resolve(__dirname, "../../packages/sdk/src"),
        util: path.resolve(__dirname, "util"),
      },
    },
    base: staticPath,
    publicDir: "./public",
    build: {
      outDir: "dist",
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, "index.html"),
        },
        output: {
          entryFileNames: `assets/[name].[hash].js`,
          chunkFileNames: `assets/[name].[hash].js`,
          assetFileNames: `assets/[name].[hash].[ext]`,
        },
      },
    },
  }
})
