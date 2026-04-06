import { BizErrorCode } from "@pmate/meta"
import { ServiceError } from "../ServiceError"

export const unauthorized = (message: string) =>
  new ServiceError(message, 401, BizErrorCode.AUTH_ERROR)
