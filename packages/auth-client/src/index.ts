import {
  AuthLoginResponse,
  AuthRequest,
  AuthSession,
  CaptchaVerifyRequest,
  CaptchaVerifyResult,
  ServerResponse,
  VCodeIssueRequest,
  VCodeIssueResult,
} from "@pmate/meta"
import axios, { type AxiosInstance } from "axios"

export type AuthClientOptions = {
  token?: string
  headers?: HeadersInit
}

type AuthRequestInit = RequestInit & { token?: string }

export class AuthClient {
  private token?: string
  private headers?: HeadersInit
  private client: AxiosInstance

  constructor(options: AuthClientOptions = {}) {
    this.token = options.token
    this.headers = options.headers
    this.client = axios.create()
  }

  setToken(token?: string) {
    this.token = token
  }

  async requestChallenge(
    payload: VCodeIssueRequest,
    init: RequestInit = {}
  ): Promise<VCodeIssueResult> {
    return this.vcode(payload, init)
  }

  async vcode(
    payload: VCodeIssueRequest,
    init: RequestInit = {}
  ): Promise<VCodeIssueResult> {
    return this.requestAuth<VCodeIssueResult>("/vcode", {
      method: "POST",
      body: JSON.stringify(payload),
      ...init,
    })
  }

  async verifyCaptcha(
    payload: CaptchaVerifyRequest,
    init: RequestInit = {}
  ): Promise<CaptchaVerifyResult> {
    return this.requestAuth<CaptchaVerifyResult>("/captcha/verify", {
      method: "POST",
      body: JSON.stringify(payload),
      ...init,
    })
  }

  async login(
    request: AuthRequest,
    init: RequestInit = {}
  ): Promise<AuthLoginResponse> {
    const response = await this.requestAuth<AuthLoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify(request),
      token: request.nonce,
      ...init,
    })
    this.token = response.token
    return response
  }

  async logout(
    token?: string,
    init: RequestInit = {}
  ): Promise<{ success: boolean }> {
    const response = await this.requestAuth<{ success: boolean }>("/logout", {
      method: "POST",
      token,
      ...init,
    })
    if (token == null || token === this.token) {
      this.token = undefined
    }
    return response
  }

  async session(
    token?: string,
    init: RequestInit = {}
  ): Promise<AuthSession | null> {
    return this.requestAuth<AuthSession | null>("/session", {
      method: "GET",
      token,
      ...init,
    })
  }

  async get<T>(url: string, init: RequestInit = {}): Promise<T> {
    return this.requestUrl<T>(url, { ...init, method: "GET" })
  }

  async post<T>(
    url: string,
    body?: unknown,
    init: RequestInit = {}
  ): Promise<T> {
    return this.requestUrl<T>(url, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
      ...init,
    })
  }

  async put<T>(
    url: string,
    body?: unknown,
    init: RequestInit = {}
  ): Promise<T> {
    return this.requestUrl<T>(url, {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
      ...init,
    })
  }

  async delete<T>(url: string, init: RequestInit = {}): Promise<T> {
    return this.requestUrl<T>(url, { ...init, method: "DELETE" })
  }

  private resolveAuthUrl(path: string) {
    const base = "https://auth-api-v2.pmate.chat"
    const next = path.startsWith("/") ? path : `/${path}`
    return `${base}${next}`
  }

  private async requestAuth<T>(path: string, init: AuthRequestInit = {}) {
    return this.requestUrl<T>(this.resolveAuthUrl(path), init)
  }

  private async requestUrl<T>(url: string, init: AuthRequestInit = {}) {
    const { token, headers, body, method, signal } = init
    const resolvedToken = token ?? this.token
    const requestHeaders = {
      "Content-Type": "application/json",
      ...this.normalizeHeaders(this.headers),
      ...this.normalizeHeaders(headers),
      ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
    }

    try {
      const response = await this.client.request<ServerResponse<T>>({
        url,
        withCredentials: true,
        ...(method ? { method } : {}),
        ...(signal ? { signal } : {}),
        ...(body !== undefined ? { data: body } : {}),
        headers: requestHeaders,
      })
      const json = response.data
      if (!json?.success) {
        throw json
      }
      return json.data
    } catch (error) {
      const axiosError = error as { response?: { data?: ServerResponse<T> } }
      if (axiosError?.response?.data) {
        throw axiosError.response.data
      }
      throw error
    }
  }

  private normalizeHeaders(input?: HeadersInit) {
    if (!input) {
      return {}
    }
    if (Array.isArray(input)) {
      return Object.fromEntries(input)
    }
    if (input instanceof Headers) {
      return Object.fromEntries(input.entries())
    }
    return input
  }
}

export const client = new AuthClient()
