import express from "express"
import axios from "axios"

const app = express()
const port = 7000

// Middleware to parse incoming JSON requests
app.use(express.json())

// OpenAI API URL
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

// Proxy route to forward requests to OpenAI API
app.post("/v1/chat/completions", async (req, res) => {
  try {
    // Extract Authorization header (Bearer token)
    const authorization = req.headers["authorization"]

    if (!authorization) {
      return res.status(400).json({ error: "Authorization header is missing" })
    }

    // Forward the request to OpenAI with the original Authorization header and all body params
    const response = await axios.post(
      OPENAI_API_URL,
      req.body, // Directly use the entire request body
      {
        headers: {
          Authorization: authorization, // Use the forwarded Authorization header
          "Content-Type": "application/json",
        },
      }
    )

    // Return the response from OpenAI
    res.json(response.data)
  } catch (error) {
    console.error("Error with OpenAI API request:", error)
    res.status(500).json({ error: "Failed to communicate with OpenAI" })
  }
})

app.listen(port, () => {
  console.log(`Proxy server is running on http://localhost:${port}`)
})
