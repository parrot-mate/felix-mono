import "./env"
import "./globalerror"

import { createAgentUiApiApp } from "./app"

const PORT = process.env.AGENT_UI_API_PORT || process.env.PORT || 5795
const app = createAgentUiApiApp()
app.listen(PORT)
console.log(`Agent UI API server is running on port ${PORT}`)
