import { EchoAgentClient } from "./echoAgentClient"

const wsUrl = process.env.HUB_ENDPOINT || "wss://hub.pmate.chat"
const agentId = process.env.ECHO_AGENT_ID || "agent:echo"
const token = process.env.PMATE_TOKEN || "0mqZUi3-nwE95uhgRsnkqUkyHdDaxKkM"

async function main() {
  const agent = new EchoAgentClient({ wsUrl, agentId, token })
  await agent.start()
  console.log(`[echo-agent] connected and authenticated as ${agentId} -> ${wsUrl}`)

  const stop = () => {
    agent.stop()
    process.exit(0)
  }
  process.on("SIGINT", stop)
  process.on("SIGTERM", stop)
}

void main().catch((error) => {
  console.error("[echo-agent] failed to start", error)
  process.exit(1)
})
