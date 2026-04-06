import { env } from "./env"
import { createLlmPromptAgent } from "./runtime"

const agent = createLlmPromptAgent({
  wsUrl: env.HUB_ENDPOINT,
  token: env.PMATE_TOKEN,
  heartbeatIntervalMs: env.HEARTBEAT_INTERVAL_MS,
})

async function main() {
  await agent.start()
  console.log("[llm-agent] started", {
    hub: env.HUB_ENDPOINT,
    asAgentId: env.AGENT_SERVER_ID,
  })
}

void main().catch((error) => {
  console.error("[llm-agent] failed to start", error)
  process.exit(1)
})

const stop = () => {
  agent.stop()
  process.exit(0)
}
process.on("SIGINT", stop)
process.on("SIGTERM", stop)
