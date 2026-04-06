import { z } from "zod"

const EnvSchema = z.object({
  PORT: z.coerce.number().default(8794),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  PMATE_AGENT_API_BASE_URL: z.string().default("https://agent-api.pmate.chat"),
  PMATE_AGENT_HUB_BASE_URL: z.string().default("https://hub.pmate.chat"),
  PMATE_AGENT_NAMESPACE: z.string().default("blueprint"),
  PMATE_AGENT_SUMMARY_NAME: z.string().default("blueprint-summary"),
  PMATE_TOKEN: z.string().optional(),
})

export type AppEnv = z.infer<typeof EnvSchema>

export function readEnv(): AppEnv {
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`)
  }
  return parsed.data
}
