import "dotenv/config"
import { Elysia } from "elysia"
import { node } from "@elysiajs/node"
import { cors } from "@elysiajs/cors"
import { z } from "zod"
import { readEnv } from "./lib/env.js"
import { BlueprintAgentClient, BlueprintAgentError } from "./lib/agentClient.js"
import { generateProposalDoc, scoreProposal, summarizeProposal } from "./lib/blueprintService.js"

const env = readEnv()

const app = new Elysia({ adapter: node() })
  .use(
    cors({
      origin: [env.CORS_ORIGIN, "http://localhost:5173", "http://localhost:5174"],
      credentials: true,
    }),
  )
  .get("/", () => ({ ok: true, service: "blueprint-api" }))

const ProposalSchema = z.object({
  productName: z.string().min(1),
  productGoal: z.string().min(1),
  background: z.string().min(1),
  techStack: z.string().min(1),
  uiStyle: z.string().min(1),
  uiReferenceUrl: z.string().optional(),
  language: z.enum(["zh", "en"]).default("zh"),
  targetUsers: z.string().optional(),
  currentSolution: z.string().optional(),
  userPain: z.string().optional(),
  usageScenarios: z.string().optional(),
  usageFrequency: z.string().optional(),
  timePressure: z.string().optional(),
  coreFeatures: z.string().optional(),
  mustHaveFeatures: z.string().optional(),
  optionalFeatures: z.string().optional(),
  userInputs: z.string().optional(),
  systemOutputs: z.string().optional(),
  outputFormat: z.string().optional(),
  timeRequirements: z.string().optional(),
  platformLimits: z.string().optional(),
  technicalLimits: z.string().optional(),
  successDefinition: z.string().optional(),
  metrics: z.string().optional(),
  uncertainties: z.string().optional(),
  failureRisks: z.string().optional(),
  externalData: z.string().optional(),
  apiDependencies: z.string().optional(),
  usageMode: z.string().optional(),
  workflowMode: z.string().optional(),
  generateDocs: z.string().optional(),
  exportNeeded: z.string().optional(),
  editableNeeded: z.string().optional(),
  extras: z.record(
    z.array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    ),
  ).optional(),
})

function createAgentClient() {
  return new BlueprintAgentClient({
    namespace: env.PMATE_AGENT_NAMESPACE,
    agentApiBaseUrl: env.PMATE_AGENT_API_BASE_URL,
    hubBaseUrl: env.PMATE_AGENT_HUB_BASE_URL,
    token: env.PMATE_TOKEN,
  })
}

function buildErrorBody(error: unknown) {
  if (error instanceof BlueprintAgentError) {
    return {
      ok: false as const,
      error: error.message,
      debug: error.debug,
    }
  }

  return {
    ok: false as const,
    error: error instanceof Error ? error.message : String(error),
  }
}

app.post("/api/blueprint/summarize", async ({ body, set }) => {
  const parsed = ProposalSchema.safeParse(body)
  if (!parsed.success) {
    set.status = 400
    return { ok: false, error: "Invalid input" }
  }

  try {
    const result = await summarizeProposal(createAgentClient(), env.PMATE_AGENT_SUMMARY_NAME, parsed.data)
    return { ok: true, data: result.data, debug: result.debug }
  } catch (error) {
    set.status = 502
    return buildErrorBody(error)
  }
})

app.post("/api/blueprint/score", async ({ body, set }) => {
  const parsed = ProposalSchema.safeParse(body)
  if (!parsed.success) {
    set.status = 400
    return { ok: false, error: "Invalid input" }
  }

  try {
    const score = await scoreProposal(createAgentClient(), env.PMATE_AGENT_SUMMARY_NAME, parsed.data)
    return { ok: true, data: score.data, debug: score.debug }
  } catch (error) {
    set.status = 502
    return buildErrorBody(error)
  }
})

app.post("/api/blueprint/markdown", async ({ body, set }) => {
  const parsed = ProposalSchema.extend({
    docType: z.enum(["prdLite", "scenarios"]),
  }).safeParse(body)

  if (!parsed.success) {
    set.status = 400
    return { ok: false, error: "Invalid input" }
  }

  try {
    const markdown = await generateProposalDoc(
      createAgentClient(),
      env.PMATE_AGENT_SUMMARY_NAME,
      parsed.data,
      parsed.data.docType,
    )
    return { ok: true, data: { docType: parsed.data.docType, markdown: markdown.data }, debug: markdown.debug }
  } catch (error) {
    set.status = 502
    return buildErrorBody(error)
  }
})

app.listen(env.PORT)
console.log(`[blueprint-api] running on http://localhost:${env.PORT}`)
