export function successResult(data?: any) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      // ...corsHeaders(),
    },
    body: JSON.stringify({
      success: true,
      data: data || null,
    }),
  }
}

export function errorResult(error: any, code: number = 500) {
  return {
    statusCode: code,
    headers: {
      "Content-Type": "application/json",
      // ...corsHeaders(),
    },
    body: JSON.stringify({
      success: false,
      message: error.toString(),
      stack: error.stack,
    }),
  }
}

export function corsHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", // Change to your domain if necessary
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "8640000",
  }
}
