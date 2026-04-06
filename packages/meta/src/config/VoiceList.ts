import type { Voice } from "../types"

const VoiceList_ = {
  OPEN_AI_Alloy: {
    name: "alloy",
    provider: "openai",
    gender: "M",
  },
  OPEN_AI_Ash: {
    name: "ash",
    provider: "openai",
    gender: "M",
  },
  OPEN_AI_Ballad: {
    name: "ballad",
    provider: "openai",
    gender: "M",
    instructions: "bright, young man voice",
  },
  OPEN_AI_Coral: {
    name: "coral",
    provider: "openai",
    gender: "F",
    instructions: "sweet, cute,naive voice",
  },
  OPEN_AI_Echo: {
    name: "echo",
    provider: "openai",
    gender: "M",
  },
  OPEN_AI_Fable: {
    name: "fable",
    provider: "openai",
    gender: "F",
  },
  OPEN_AI_Onyx: {
    name: "onyx",
    provider: "openai",
    gender: "M",
  },
  OPEN_AI_Nova: {
    name: "nova",
    provider: "openai",
    gender: "F",
    instructions: "mature, smooth, elegant, warm voice",
  },
  OPEN_AI_Sage: {
    name: "sage",
    provider: "openai",
    gender: "F",
  },
  OPEN_AI_Shimmer: {
    name: "shimmer",
    provider: "openai",
    gender: "F",
  },
  OPEN_AI_Verse: {
    name: "verse",
    provider: "openai",
    gender: "M",
    instructions: "elderly,mysterious wizzard voice",
  },
  KOKORO_af_heart: {
    name: "af_heart",
    provider: "kokoro",
    gender: "F",
  },
  KOKORO_af_alloy: {
    name: "af_alloy",
    provider: "kokoro",
    gender: "F",
  },
  KOKORO_af_aoede: {
    name: "af_aoede",
    provider: "kokoro",
    gender: "F",
  },
  KOKORO_af_bella: {
    name: "af_bella",
    provider: "kokoro",
    gender: "F",
  },
  KOKORO_af_jessica: {
    name: "af_jessica",
    provider: "kokoro",
    gender: "F",
  },
  KOKORO_af_kore: {
    name: "af_kore",
    provider: "kokoro",
    gender: "F",
  },
  KOKORO_af_nicole: {
    name: "af_nicole",
    provider: "kokoro",
    gender: "F",
  },
  KOKORO_af_nova: {
    name: "af_nova",
    provider: "kokoro",
    gender: "F",
  },
  KOKORO_af_river: {
    name: "af_river",
    provider: "kokoro",
    gender: "F",
  },
  KOKORO_af_sarah: {
    name: "af_sarah",
    provider: "kokoro",
    gender: "F",
  },
  KOKORO_af_sky: {
    name: "af_sky",
    provider: "kokoro",
    gender: "F",
  },
  KOKORO_am_adam: {
    name: "am_adam",
    provider: "kokoro",
    gender: "M",
  },
  KOKORO_am_echo: {
    name: "am_echo",
    provider: "kokoro",
    gender: "M",
  },
  KOKORO_am_eric: {
    name: "am_eric",
    provider: "kokoro",
    gender: "M",
  },
  KOKORO_am_fenrir: {
    name: "am_fenrir",
    provider: "kokoro",
    gender: "M",
  },
  KOKORO_am_liam: {
    name: "am_liam",
    provider: "kokoro",
    gender: "M",
  },
  KOKORO_am_michael: {
    name: "am_michael",
    provider: "kokoro",
    gender: "M",
  },
  KOKORO_am_onyx: {
    name: "am_onyx",
    provider: "kokoro",
    gender: "M",
  },
  KOKORO_am_puck: {
    name: "am_puck",
    provider: "kokoro",
    gender: "M",
  },
  KOKORO_am_santa: {
    name: "am_santa",
    provider: "kokoro",
    gender: "M",
  },
} satisfies Record<string, Omit<Voice, "key">>

export const VoiceList = Object.entries(VoiceList_).reduce(
  (acc, [key, value]) => {
    // @ts-ignore
    acc[key] = {
      ...value,
      key: key,
    }
    return acc
  },
  {} as Record<keyof typeof VoiceList_, Voice>
)
