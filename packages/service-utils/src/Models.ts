import { Model, ModelNames, ModelType } from "@pmate/meta"

export const Models = {
  [ModelNames.DoubaoThinkingPro]: {
    key: ModelNames.DoubaoThinkingPro,
    apiKey: process.env.BYTE_API_KEY as string,
    endpoint: process.env.BYTE_ENDPOINT as string,
    type: ModelType.Chat,
  },
  [ModelNames.Ep20250515004555M6dgx]: {
    key: "doubao-1-5-pro-32k-250115",
    apiKey: process.env.BYTE_API_KEY as string,
    endpoint: process.env.BYTE_ENDPOINT as string,
    type: ModelType.Chat,
  },
  [ModelNames.DeepseekChat]: {
    key: ModelNames.DeepseekChat,
    apiKey: process.env.DEEPSEEK_API_KEY as string,
    endpoint: process.env.DEEPSEEK_ENDPOINT as string,
    type: ModelType.Chat,
  },
  [ModelNames.Gpt4oMini]: {
    key: ModelNames.Gpt4oMini,
    apiKey: process.env.OPENAI_API_KEY as string,
    endpoint: process.env.OPENAI_ENDPOINT as string,
    type: ModelType.Chat,
  },
  [ModelNames.Gpt4o]: {
    key: ModelNames.Gpt4o,
    apiKey: process.env.OPENAI_API_KEY as string,
    endpoint: process.env.OPENAI_ENDPOINT as string,
    type: ModelType.Chat,
  },
  [ModelNames.O1Preview]: {
    key: ModelNames.O1Preview,
    apiKey: process.env.OPENAI_API_KEY as string,
    endpoint: process.env.OPENAI_ENDPOINT as string,
    type: ModelType.Chat,
  },
  [ModelNames.Gpt41]: {
    key: ModelNames.Gpt41,
    apiKey: process.env.OPENAI_API_KEY as string,
    endpoint: process.env.OPENAI_ENDPOINT as string,
    type: ModelType.Chat,
  },
  [ModelNames.Gpt5Mini]: {
    key: ModelNames.Gpt5Mini,
    apiKey: process.env.OPENAI_API_KEY as string,
    endpoint: process.env.OPENAI_ENDPOINT as string,
    type: ModelType.Chat,
  },
  [ModelNames.Gpt5Nano]: {
    key: ModelNames.Gpt5Nano,
    apiKey: process.env.OPENAI_API_KEY as string,
    endpoint: process.env.OPENAI_ENDPOINT as string,
    type: ModelType.Chat,
  },
} as const satisfies Record<ModelNames, Model>
