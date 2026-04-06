import { Maybe, isMaybe } from "@pmate/utils"
import { ServerResponse } from "@pmate/meta"
import { cacheInMem } from "./cacheInMem"

const checkLink = async (url: string | Maybe<string>): Promise<boolean> => {
  if (isMaybe(url)) {
    if (url.isNothing()) {
      return false
    }
    url = url.unwrap()
  }
  try {
    const response = await fetch(url, { method: "HEAD" })
    return response.ok
  } catch {
    return false
  }
}

const cachedLinkCheck = cacheInMem(checkLink, "link", 60 * 60 * 1000)

export class Api {
  public static async get<T>(url: string): Promise<T | null> {
    const response = await fetch(url)
    if (!response.ok) {
      return null
    }
    const json = (await response.json()) as ServerResponse<T>
    return json.data ?? null
  }

  public static async post<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const json = (await response.json()) as ServerResponse<T>
    if (!json.success) {
      throw json
    }
    return json.data as T
  }

  public static async put<T>(url: string, body: unknown): Promise<Maybe<T>> {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const json = (await response.json()) as ServerResponse<T>
    if (!json.success) {
      throw json
    }
    return Maybe.Just<T>(json.data)
  }

  public static async getFile<T>(url: string): Promise<T | null>
  public static async getFile<T>(url: string, type: "json"): Promise<T | null>
  public static async getFile(url: string, type: "text"): Promise<string | null>
  public static async getFile<T>(url: string, type: "log"): Promise<Maybe<T[]>>
  public static async getFile<T>(
    url: string,
    type: "json" | "text" | "log" = "json"
  ): Promise<T | string | Maybe<T[]> | null> {
    try {
      const response = await fetch(url)
      if (type === "log") {
        if (!response.ok) {
          return Maybe.Nothing()
        }
        try {
          const text = await response.text()
          const logs = text
            .split("\n")
            .filter(Boolean)
            .map((line) => JSON.parse(line) as T)
          return Maybe.Just(logs)
        } catch {
          return Maybe.Nothing()
        }
      }
      if (!response.ok) {
        return null
      }
      if (type === "text") {
        return response.text()
      }
      return (await response.json()) as T
    } catch (error) {
      console.warn(error)
      return null
    }
  }

  public static exists(url: string | Maybe<string>): Promise<boolean> {
    return cachedLinkCheck(url)
  }
}
