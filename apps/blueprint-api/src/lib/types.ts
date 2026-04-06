export type ProposalExtraField = {
  label: string
  value: string
}

export type ProposalInput = {
  productName: string
  productGoal: string
  background: string
  techStack: string
  uiStyle: string
  uiReferenceUrl?: string
  language: "zh" | "en"
  targetUsers?: string
  currentSolution?: string
  userPain?: string
  usageScenarios?: string
  usageFrequency?: string
  timePressure?: string
  coreFeatures?: string
  mustHaveFeatures?: string
  optionalFeatures?: string
  userInputs?: string
  systemOutputs?: string
  outputFormat?: string
  timeRequirements?: string
  platformLimits?: string
  technicalLimits?: string
  successDefinition?: string
  metrics?: string
  uncertainties?: string
  failureRisks?: string
  externalData?: string
  apiDependencies?: string
  usageMode?: string
  workflowMode?: string
  generateDocs?: string
  exportNeeded?: string
  editableNeeded?: string
  extras?: Record<string, ProposalExtraField[]>
}

export type SummaryResult = {
  score: number
  summary: string
  keyQuestions: string[]
}

export type ProposalScoreResult = {
  score: number
  reason: string
}

export type BlueprintDocType = "prdLite" | "scenarios"

export type GeneratedDocsResult = {
  prdLite: string
  scenarios: string
}

export type AgentDebugInfo = {
  agentId: string
  payload: Record<string, unknown>
  rawAgentResponse: unknown
  unwrappedAgentResponse: unknown
}
