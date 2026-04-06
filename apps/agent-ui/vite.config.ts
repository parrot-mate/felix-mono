import react from "@vitejs/plugin-react"
import { parse } from "dotenv"
import { existsSync, readFileSync } from "node:fs"
import path from "path"
import { defineConfig, loadEnv } from "vite"

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
  const staticPath = env.STATIC_PATH || "/"
  const plugins = [react(), tailwindcss()]
  return {
    plugins,
    define: {
      "process.env": JSON.stringify({
        ...process.env,
        ...defineEnv,
      }),
    },
    server: {
      port: 5210,
      open: false,
    },
    optimizeDeps: {
      include: ["date-fns/format"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@pmate/account-sdk": path.resolve(
          __dirname,
          "../../packages/account-sdk/src"
        ),
        "@sdk": path.resolve(__dirname, "../../packages/sdk/src"),
      },
    },
    base: staticPath,
    publicDir: "./public",
    build: {
      outDir: "dist",
      rollupOptions: {
        input: {
          agent: path.resolve(__dirname, "index.html"),
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
