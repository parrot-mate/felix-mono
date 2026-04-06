import { config } from "dotenv"
import path from "path"
config({
  path: [".env.local", ".env"].map((file) =>
    path.resolve(__dirname, `../${file}`)
  ),
})
