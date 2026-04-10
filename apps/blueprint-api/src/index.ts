import "dotenv/config"
import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { z } from "zod"
import { readEnv } from "./lib/env.js"
import { BlueprintAgentClient, BlueprintAgentError, getLocalAuthStatus, tryReadSessionToken } from "./lib/agentClient.js"
import {
  assertDeliveryPlanReviewed,
  generateFormalSpec,
  generateFormalSpecLocally,
  generateProposalDoc,
  generateProposalDocLocally,
  scoreProposal,
  summarizeProposal,
  summarizeProposalLocally,
} from "./lib/blueprintService.js"

const env = readEnv()
const allowedOrigins = new Set([
  env.CORS_ORIGIN,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
])

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

function resolveBearerToken(req: IncomingMessage) {
  const header = req.headers.authorization
  if (!header) return undefined
  const [scheme, token] = header.split(" ")
  if (scheme?.toLowerCase() !== "bearer") return undefined
  const normalized = token?.trim()
  return normalized || undefined
}

function createAgentClientForRequest(req: IncomingMessage) {
  return new BlueprintAgentClient({
    namespace: env.PMATE_AGENT_NAMESPACE,
    agentApiBaseUrl: env.PMATE_AGENT_API_BASE_URL,
    hubBaseUrl: env.PMATE_AGENT_HUB_BASE_URL,
    token: resolveBearerToken(req) ?? env.PMATE_TOKEN,
  })
}

function resolveAgentTokenForRequest(req: IncomingMessage) {
  return resolveBearerToken(req) ?? env.PMATE_TOKEN?.trim() ?? tryReadSessionToken()
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

function setCorsHeaders(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
    res.setHeader("Vary", "Origin")
  }

  res.setHeader("Access-Control-Allow-Credentials", "true")
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "content-type, authorization")
}

function sendJson(req: IncomingMessage, res: ServerResponse, status: number, body: unknown) {
  setCorsHeaders(req, res)
  res.statusCode = status
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.end(JSON.stringify(body))
}

async function readJsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
  }

  const raw = Buffer.concat(chunks).toString("utf8")
  if (!raw.trim()) return {}
  return JSON.parse(raw)
}

const server = createServer(async (req, res) => {
  try {
    if (!req.url || !req.method) {
      sendJson(req, res, 404, { ok: false, error: "Not found" })
      return
    }

    if (req.method === "OPTIONS") {
      setCorsHeaders(req, res)
      res.statusCode = 204
      res.end()
      return
    }

    if (req.method === "GET" && req.url === "/") {
      sendJson(req, res, 200, { ok: true, service: "blueprint-api" })
      return
    }

    if (req.method === "GET" && req.url === "/api/blueprint/auth-status") {
      const authStatus = getLocalAuthStatus()
      sendJson(req, res, authStatus.authenticated ? 200 : 401, {
        ok: authStatus.authenticated,
        data: authStatus.authenticated ? { authenticated: true } : undefined,
        error: authStatus.authenticated ? undefined : authStatus.error,
      })
      return
    }

    if (req.method !== "POST") {
      sendJson(req, res, 404, { ok: false, error: "Not found" })
      return
    }

    const body = await readJsonBody(req)

    if (req.url === "/api/blueprint/summarize") {
      const parsed = ProposalSchema.safeParse(body)
      if (!parsed.success) {
        sendJson(req, res, 400, { ok: false, error: "Invalid input" })
        return
      }

      try {
        const result = resolveAgentTokenForRequest(req)
          ? await summarizeProposal(createAgentClientForRequest(req), env.PMATE_AGENT_SUMMARY_NAME, parsed.data)
          : summarizeProposalLocally(parsed.data)
        sendJson(req, res, 200, { ok: true, data: result.data, debug: result.debug })
      } catch (error) {
        sendJson(req, res, 502, buildErrorBody(error))
      }
      return
    }

    if (req.url === "/api/blueprint/score") {
      const parsed = ProposalSchema.safeParse(body)
      if (!parsed.success) {
        sendJson(req, res, 400, { ok: false, error: "Invalid input" })
        return
      }

      try {
        const score = resolveAgentTokenForRequest(req)
          ? await scoreProposal(createAgentClientForRequest(req), env.PMATE_AGENT_SUMMARY_NAME, parsed.data)
          : {
              data: {
                score: summarizeProposalLocally(parsed.data).data.score,
                reason: "当前处于本地无鉴权测试模式，评分由本地规则计算。",
              },
              debug: summarizeProposalLocally(parsed.data).debug,
            }
        sendJson(req, res, 200, { ok: true, data: score.data, debug: score.debug })
      } catch (error) {
        sendJson(req, res, 502, buildErrorBody(error))
      }
      return
    }

    if (req.url === "/api/blueprint/markdown") {
      const parsed = ProposalSchema.extend({
        docType: z.enum(["prdLite", "scenarios", "decisions", "deliveryPlan"]),
      }).safeParse(body)

      if (!parsed.success) {
        sendJson(req, res, 400, { ok: false, error: "Invalid input" })
        return
      }

      try {
        const markdown = resolveAgentTokenForRequest(req)
          ? await generateProposalDoc(
              createAgentClientForRequest(req),
              env.PMATE_AGENT_SUMMARY_NAME,
              parsed.data,
              parsed.data.docType,
            )
          : generateProposalDocLocally(parsed.data, parsed.data.docType)
        sendJson(req, res, 200, { ok: true, data: { docType: parsed.data.docType, markdown: markdown.data }, debug: markdown.debug })
      } catch (error) {
        sendJson(req, res, 502, buildErrorBody(error))
      }
      return
    }

    if (req.url === "/api/blueprint/formal-spec/check") {
      const parsed = z.object({
        docType: z.enum(["product", "develop", "qa", "deploy"]),
        deliveryPlanReviewed: z.boolean(),
      }).safeParse(body)

      if (!parsed.success) {
        sendJson(req, res, 400, { ok: false, error: "Invalid input" })
        return
      }

      try {
        assertDeliveryPlanReviewed(parsed.data.deliveryPlanReviewed, parsed.data.docType)
        sendJson(req, res, 200, { ok: true, data: { allowed: true } })
      } catch (error) {
        sendJson(req, res, 409, buildErrorBody(error))
      }
      return
    }

    if (req.url === "/api/blueprint/formal-spec/markdown") {
      const parsed = ProposalSchema.extend({
        docType: z.enum(["product", "develop", "qa", "deploy"]),
        deliveryPlanReviewed: z.boolean(),
      }).safeParse(body)

      if (!parsed.success) {
        sendJson(req, res, 400, { ok: false, error: "Invalid input" })
        return
      }

      try {
        const markdown = resolveAgentTokenForRequest(req)
          ? await generateFormalSpec(
              createAgentClientForRequest(req),
              env.PMATE_AGENT_SUMMARY_NAME,
              parsed.data,
              parsed.data.docType,
              parsed.data.deliveryPlanReviewed,
            )
          : generateFormalSpecLocally(parsed.data, parsed.data.docType, parsed.data.deliveryPlanReviewed)
        sendJson(req, res, 200, { ok: true, data: { docType: parsed.data.docType, markdown: markdown.data }, debug: markdown.debug })
      } catch (error) {
        const status =
          error instanceof Error && error.message.includes("delivery-plan.md must be reviewed first")
            ? 409
            : 502
        sendJson(req, res, status, buildErrorBody(error))
      }
      return
    }

    sendJson(req, res, 404, { ok: false, error: "Not found" })
  } catch (error) {
    sendJson(req, res, 500, buildErrorBody(error))
  }
})

server.listen(env.PORT, () => {
  console.log(`[blueprint-api] running on http://localhost:${env.PORT}`)
})
