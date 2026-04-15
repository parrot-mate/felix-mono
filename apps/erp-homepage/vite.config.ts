import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [react(), tailwindcss()],
    define: {
      "process.env": JSON.stringify({
        ...process.env,
        ...env,
      }),
    },
    server: {
      port: 5174,
      open: false,
      proxy: {
        "^/chains/[^/]+/namespaces/": {
          target: "https://qaidx.pmate.chat",
          changeOrigin: true,
        },
        "^/chains/[^/]+(?:/logs|/blocks(?:/.*)?|$)": {
          target: "https://qablk01.pmate.chat",
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@pmate/meta": path.resolve(__dirname, "src/lib/metaCompat.ts"),
        "@pmate/store": path.resolve(
          __dirname,
          "node_modules/@pmate/store/src"
        ),
        qs: path.resolve(__dirname, "node_modules/qs/lib/index.js"),
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/setupTests.ts",
      globals: true,
      include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    },
  }
})
