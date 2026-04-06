import { resourceKey } from "@pmate/service-utils"
import { corsHeaders } from "../util/corsHeaders"

export async function handleRes(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as any
    const resKeys = await Promise.all(
      body.map(async (x) => {
        const grant = true
        return {
          success: grant,
          key: grant ? resourceKey(x.type, ...x.args) : "",
        }
      })
    )
    // Parse the incoming request JSON body
    // Your "generate prompt" logic here (placeholder below)
    return new Response(JSON.stringify({ data: resKeys, success: true }), {
      status: 200,
      headers: corsHeaders(),
    })
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 400,
        headers: corsHeaders(),
      }
    )
  }
}
