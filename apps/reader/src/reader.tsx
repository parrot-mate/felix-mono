import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./ReaderApp"
import "./index.css"

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/reader/sw.js")
      .then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope)
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err)
      })
  })
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
