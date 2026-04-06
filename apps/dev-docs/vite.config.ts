import react from "@vitejs/plugin-react"
import mdx from "@mdx-js/rollup"
import rehypeMermaid from "rehype-mermaid"
import rehypePrism from "rehype-prism-plus"
import tailwindcss from "@tailwindcss/vite"
import path from "path"
import { defineConfig } from "vite"
import vike from "vike/plugin"

export default defineConfig({
  plugins: [
    mdx({
      mdExtensions: [".md", ".mdx"],
      // rehype-prism-plus typings don't align with mdx plugin types
      rehypePlugins: [rehypeMermaid, rehypePrism as unknown as any],
      providerImportSource: "@mdx-js/react",
    }),
    react({
      include: [/\.tsx$/, /\.mdx?$/],
    }),
    tailwindcss(),
    vike(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5401,
    open: true,
  },
})
