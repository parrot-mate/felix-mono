import { config } from "dotenv"
import path from "path"
const envFile = path.resolve(__dirname, "../../.env.local")
config({ path: [".env.local"] })
