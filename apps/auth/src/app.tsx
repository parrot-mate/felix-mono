import React from "react"
import ReactDOM from "react-dom/client"
import { I18nextProvider, i18n } from "@pmate/account-sdk"
import { SnackbarProvider } from "@pmate/uikit"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AuthProviderV2, resolveAppId } from "@pmate/account-sdk"
import "./index.css"
import { LoginPage } from "./pages/login"
import { LogoutPage } from "./pages/logout"
import { AccountRoutes } from "./routes/AccountRoutes"

const AppRoutes = () => {
  const authRoutes = [
    "/select-profile",
    "/create-profile",
    "/edit-profile",
  ]
  return (
    <I18nextProvider i18n={i18n}>
      <SnackbarProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProviderV2 app={resolveAppId()} authRoutes={authRoutes}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/logout" element={<LogoutPage />} />
              <Route path="/" element={<LoginPage />} />
              {AccountRoutes()}
            </Routes>
          </AuthProviderV2>
        </BrowserRouter>
      </SnackbarProvider>
    </I18nextProvider>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>
)
