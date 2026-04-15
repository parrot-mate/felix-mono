export * from "../../../../node_modules/.pnpm/@pmate+meta@1.1.5/node_modules/@pmate/meta/src/index"

type VoiceInput = {
  name: string
  provider: "openai" | "kokoro"
  gender: "F" | "M"
  instructions?: string
}

export function createVoice(input: VoiceInput) {
  return {
    ...input,
    key: `${input.provider}:${input.name}`,
  }
}
