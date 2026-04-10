import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./App"
import { BLUEPRINT_APP_ID } from "./auth"
import { BlueprintAuthProvider } from "./pmateAuth"
import "./styles.css"

if (typeof globalThis.process === "undefined") {
  ;(globalThis as typeof globalThis & { process?: { env: Record<string, string> } }).process = {
    env: {},
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BlueprintAuthProvider app={BLUEPRINT_APP_ID}>
      <App />
    </BlueprintAuthProvider>
  </React.StrictMode>,
)
