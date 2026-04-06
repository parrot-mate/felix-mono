import { BizErrorCode } from "@pmate/meta"

export class ServiceError extends Error {
  constructor(
    message: string,
    public httpCode: number = 500,
    public bizCode: BizErrorCode
  ) {
    super(message)
    this.name = "ServiceError"
  }
}
