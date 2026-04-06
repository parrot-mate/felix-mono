export function withCors(handler: Function): Function {
  return async (request: Request, env?: any): Promise<Response> => {
    const response = await handler(request, env)

    // Add CORS headers to the response
    const headers = response.headers
    headers.set("Access-Control-Allow-Origin", "*")
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

    return new Response(response.body, { ...response, headers })
  }
}
