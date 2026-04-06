export class HttpContext {
  private path: string
  private method: string
  private origin: string
  private rawEvent: any
  private rawEventString?: string
  private headerMap: Record<string, string> = {}
  private cachedBodyBuffer?: Buffer
  private parsedJsonBody?: any | null
  constructor(event: string | Buffer, private callback: any) {
    if (typeof event === "string") {
      this.rawEventString = event
      this.rawEvent = JSON.parse(event)
    } else if (Buffer.isBuffer(event)) {
      this.rawEventString = event.toString("utf8")
      this.rawEvent = JSON.parse(this.rawEventString)
    } else {
      this.rawEvent = event
    }
    const path =
      this.rawEvent.rawPath ??
      this.rawEvent.path ??
      this.rawEvent.requestContext?.path ??
      this.rawEvent.requestContext?.resourcePath ??
      "/"
    this.method = this.rawEvent.requestContext?.http?.method ?? "GET"
    this.path = path
    const headers = this.rawEvent.headers || {}
    Object.keys(headers || {}).forEach((key) => {
      this.headerMap[key.toLowerCase()] = headers[key]
    })
    this.origin = this.getHeader("origin") ?? ""
  }

  public getHeaders(): Record<string, string> {
    return this.rawEvent.headers || {}
  }

  public getHeader(name: string): string | undefined {
    return this.headerMap[name.toLowerCase()]
  }

  public getQuery(): Record<string, string> {
    return this.rawEvent.queryStringParameters || {}
  }

  public getBodyBuffer(): Buffer {
    if (this.cachedBodyBuffer) {
      return this.cachedBodyBuffer
    }
    const body = this.rawEvent.body || ""
    const isBase64 = !!this.rawEvent.isBase64Encoded
    this.cachedBodyBuffer = Buffer.from(body, isBase64 ? "base64" : "utf8")
    return this.cachedBodyBuffer
  }

  public tryGetJsonBody<T>(): T | null {
    if (this.parsedJsonBody !== undefined) {
      return this.parsedJsonBody as T | null
    }
    const buffer = this.getBodyBuffer()
    if (!buffer.length) {
      this.parsedJsonBody = null
      return null
    }
    try {
      const text = buffer.toString("utf8")
      if (!text) {
        this.parsedJsonBody = null
        return null
      }
      this.parsedJsonBody = JSON.parse(text)
    } catch (err) {
      this.parsedJsonBody = null
    }
    return this.parsedJsonBody as T | null
  }

  public getOrigin(): string {
    return this.origin
  }

  public getPath(): string {
    return this.path
  }

  public getMethod() {
    return this.method
  }

  public getRawEvent<T = any>(): T {
    return this.rawEvent as T
  }

  public sendSucc(data?: any, code: number = 200) {
    if (code === 204) {
      this.callback(null, {
        statusCode: code,
        headers: { "Content-Type": "application/json" },
      })
      return
    }

    this.callback(null, {
      statusCode: code,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        data: data || null,
      }),
    })
  }

  public sendError(error: any, code: number = 500) {
    let eventString: string | null = this.rawEventString ?? null
    if (!eventString) {
      try {
        eventString = JSON.stringify(this.rawEvent)
      } catch (err) {
        eventString = "[unserializable event]"
      }
    }
    this.callback(null, {
      statusCode: code,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        message: error.toString(),
        stack: error.stack,
        event: eventString,
      }),
    })
  }
}
