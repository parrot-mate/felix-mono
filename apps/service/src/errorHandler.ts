import { ErrorRequestHandler, RequestHandler } from "express"
import { ServiceError } from "@pmate/service-core"

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof ServiceError) {
    return res.status(err.httpCode || 500).json({
      success: false,
      message: err.message,
      code: err.bizCode,
    })
  }
  res.status(500).json({
    success: false,
    message: err.message ? err.message : err,
    path: req.path,
  })
}

export const asyncHandler = (
  fn: (...args: any[]) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    const params = req.body
    Promise.resolve(fn(params, req, res))
      .then((data) => {
        res.json({ success: true, data })
      })
      .catch((ex: any) => {
        console.error(ex)
        next(ex)
      })
  }
}
