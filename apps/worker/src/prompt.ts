import { handleRes } from "./handlers/handleRes"
import { corsHeaders } from "./util/corsHeaders"

export default {
  async fetch(
    request: Request,
    env: any,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return handleOptions()
    }

    // Only accept POST on our routes
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders(),
      })
    }

    const url = new URL(request.url)

    switch (url.pathname) {
      case "/res":
        return handleRes(request)
      default:
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: corsHeaders(),
        })
    }
  },
}

function handleOptions(): Response {
  // Return a 204 response (No Content) with the necessary CORS headers
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
