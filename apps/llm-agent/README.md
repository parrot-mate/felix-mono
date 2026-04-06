# llm-agent

Standalone prompt agent powered by OpenAI SDK.

## Environment

- `HUB_ENDPOINT` required, agent hub websocket endpoint.
- `AGENT_SERVER_ID` required, agent identity for auth (example: `agent:summary`).
- `OPENAI_API_KEY` optional, required only when mapped provider is OpenAI.
- `GEMINI_API_KEY` optional, required when mapped provider is Gemini.
- `PMATE_TOKEN` optional.
- `PROXY_URL` optional, default `http://localhost:7001`.
  - OpenAI base URL is derived as `${PROXY_URL}/openai/v1`.
  - Gemini base URL is derived as `${PROXY_URL}/gemini`.
- `HEARTBEAT_INTERVAL_MS` optional, default `30000`.

Model mapping is fixed in `apps/llm-agent/src/model.def.ts`:
- `accuracy -> AgentModel[]`
- current runtime picks the first model in the mapped array.

## Input Payload

`client.prompt({ agentId, payload })` payload is variable values only.
The agent template (`instruction` and `prompt`) uses `{{var_name}}` placeholders.
`payload` must provide values for those variables.

```ts
Record<string, unknown>
```

Output shape:

```ts
{
  type: "text" | "json"
  content: any
}
```

## Run

```bash
pnpm --filter @pmate/llm-agent dev
```

## C2C (Vitest)

```bash
pnpm --filter @pmate/llm-agent test:c2c
```

## PM2

```bash
pnpm --filter @pmate/llm-agent pm2:start
pnpm --filter @pmate/llm-agent pm2:logs
```
