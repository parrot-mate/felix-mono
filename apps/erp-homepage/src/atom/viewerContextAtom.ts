import { atomWithStorage } from "jotai/utils"
import type { BusinessRole, Department } from "../types"

export type PreviewContext = {
  businessRole: BusinessRole
  department: Department
}

export const previewContextAtom = atomWithStorage<PreviewContext>(
  "erp-homepage:preview-context",
  {
    businessRole: "employee",
    department: "ops",
  }
)
