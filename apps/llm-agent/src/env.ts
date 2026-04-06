import { config } from "dotenv"
import path from "path"

config({
  path: [".env.local", ".env"].map((file) =>
    path.resolve(__dirname, `../${file}`),
  ),
})

function readRequired(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

function readOptional(name: string, fallback = "") {
  return process.env[name] || fallback
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "")
}

function readInt(name: string, fallback: number) {
  const raw = process.env[name]
  if (!raw) {
    return fallback
  }
  const value = Number(raw)
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a number`)
  }
  return value
}

export const env = {
  HUB_ENDPOINT: readRequired("HUB_ENDPOINT"),
  PMATE_TOKEN: readOptional("PMATE_TOKEN"),
  AGENT_SERVER_ID: readRequired("AGENT_SERVER_ID"),
  PROXY_URL: trimTrailingSlash(readOptional("PROXY_URL", "http://localhost:7001")),
  OPENAI_API_KEY: readOptional("OPENAI_API_KEY"),
  OPENAI_BASE_URL: `${trimTrailingSlash(readOptional("PROXY_URL", "http://localhost:7001"))}/openai/v1`,
  GEMINI_API_KEY: readOptional("GEMINI_API_KEY"),
  GEMINI_BASE_URL: `${trimTrailingSlash(readOptional("PROXY_URL", "http://localhost:7001"))}/gemini`,
  HEARTBEAT_INTERVAL_MS: readInt("HEARTBEAT_INTERVAL_MS", 30_000),
}
