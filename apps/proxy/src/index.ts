import type { Request, Response } from "express"
import express from "express"
import { fetch, ProxyAgent } from "undici"

const app = express()
const port = Number(process.env.PORT) || 7001
const OPENAI_BASE_URL = "https://api.openai.com"
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com"
const proxyAgent = new ProxyAgent("http://127.0.0.1:7892")
const DROP_REQUEST_HEADERS = new Set(["host", "content-length"])

function buildTargetUrl(baseUrl: string, req: Request) {
  const trimmedBase = baseUrl.replace(/\/+$/, "")
  const path = String(req.params.path || "").replace(/^\/+/, "")
  const queryIndex = req.originalUrl.indexOf("?")
  const query = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : ""
  const relativeUrl = `${path}${query}`
  return new URL(relativeUrl, `${trimmedBase}/`).toString()
}

function filterRequestHeaders(headers: Request["headers"]) {
  const forwarded: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase()
    if (DROP_REQUEST_HEADERS.has(lowerKey) || value === undefined) {
      continue
    }

    forwarded[key] = Array.isArray(value) ? value.join(",") : value
  }

  return forwarded
}

app.use(express.json({ limit: "1gb" }))
app.post("/openai/:path(*)", async (req, res) => {
  const targetUrl = buildTargetUrl(OPENAI_BASE_URL, req)
  try {
    await forwardPost(targetUrl, req, res)
  } catch (error) {
    console.error("Proxy request failed:", error)
    res.status(502).json({ error: "Failed to proxy request" })
  }
})

app.post("/gemini/:path(*)", async (req, res) => {
  const targetUrl = buildTargetUrl(GEMINI_BASE_URL, req)
  try {
    await forwardPost(targetUrl, req, res)
  } catch (error) {
    console.error("Proxy request failed:", error)
    res.status(502).json({ error: "Failed to proxy request" })
  }
})

async function forwardPost(targetUrl: string, req: Request, res: Response) {
  const requestBody = req.body === undefined ? undefined : JSON.stringify(req.body)
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: filterRequestHeaders(req.headers),
    body: requestBody,
    dispatcher: proxyAgent,
  })

  const contentType = response.headers.get("content-type")
  if (contentType) {
    res.setHeader("content-type", contentType)
  }

  const contentLength = response.headers.get("content-length")
  if (contentLength) {
    res.setHeader("content-length", contentLength)
  }

  const data = Buffer.from(await response.arrayBuffer())
  res.status(response.status).send(data)
}

app.listen(port, () => {
  console.log(`Proxy server is running on http://localhost:${port}`)
})
