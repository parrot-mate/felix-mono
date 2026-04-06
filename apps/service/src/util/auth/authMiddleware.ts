import type { Request, RequestHandler } from "express"
import {
  AuthIdentity,
  Session,
  SessionManager,
  unauthorized,
} from "@pmate/service-core"

export type AuthedRequest = {
  session?: Session
  authIdentity?: AuthIdentity
} & Request

export const requireSession: RequestHandler = async (req, _res, next) => {
  try {
    const token = getTokenFromRequest(req)
    const { session } = await SessionManager.verifyL3Token(token)
    ;(req as AuthedRequest).session = session
    ;(req as AuthedRequest).authIdentity = session.identity
    next()
  } catch (error) {
    next(error)
  }
}

const getTokenFromRequest = (req: Request) => {
  const authHeader = headerValue(req.headers.authorization)
  const cookieHeader = headerValue(req.headers.cookie)
  const token =
    SessionManager.readAuthorizationHeader(authHeader) ??
    SessionManager.readSessionCookie(cookieHeader)
  if (!token) {
    throw unauthorized("Missing session")
  }
  return token
}

const headerValue = (value: string | string[] | undefined | null) => {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }
  return value ?? null
}
