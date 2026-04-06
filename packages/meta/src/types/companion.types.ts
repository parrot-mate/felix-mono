import type { Voice } from "./types"

export interface CompanionProfile {
  name: string
  height: number
  weight: number
  age: number
  desc: string
  personality: string
  profession: string
  portrait: string
  image: string
  video: string
  voice: Voice
}
