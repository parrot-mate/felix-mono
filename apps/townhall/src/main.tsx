import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./App"
import { TOWNHALL_APP_ID } from "./auth"
import { TownhallAuthProvider } from "./pmateAuth"
import "./styles.css"

if (typeof globalThis.process === "undefined") {
  ;(globalThis as typeof globalThis & { process?: { env: Record<string, string> } }).process = {
    env: {},
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TownhallAuthProvider app={TOWNHALL_APP_ID}>
      <App />
    </TownhallAuthProvider>
  </React.StrictMode>,
)
