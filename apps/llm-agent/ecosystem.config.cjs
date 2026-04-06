module.exports = {
  apps: [
    {
      name: "llm-agent",
      cwd: __dirname,
      script: "bun",
      args: "run src/index.ts",
      interpreter: "none",
      env: {
        HUB_ENDPOINT: "wss://hub.pmate.chat",
        AGENT_SERVER_ID: "llm-01",
        PROXY_URL: "http://localhost:7001",
      },
    },
  ],
}
