import { AuthProviderV2, resolveAppId } from "@pmate/account-sdk"
import { Endpoints, HybridProvider, PipelineProvider, RtcProvider } from "@pmate/sdk"
import { SnackbarProvider } from "@pmate/uikit"
import type { MenuProps } from "antd"
import { ConfigProvider, Layout, Menu, theme } from "antd"
import "antd/dist/reset.css"
import React, { Suspense } from "react"
import ReactDOM from "react-dom/client"
import {
  HashRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom"
import "./index.css"
import AddPromptPage from "./page/prompt.add"
import RunPromptPage from "./page/prompt.run"
import { PromptsPage } from "./page/prompts"

const { Header, Content } = Layout
const menuItems = [{ key: "prompts", label: "Prompts", path: "/prompts" }]
const { darkAlgorithm } = theme

const DashboardHeader = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const selectedKey =
    menuItems.find((item) => location.pathname === item.path)?.key ?? ""

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    const item = menuItems.find((menuItem) => menuItem.key === key)
    if (!item) {
      return
    }
    navigate(item.path)
  }

  return (
    <Header className="flex items-center gap-6 border-b border-slate-800 bg-slate-950 px-6 py-3">
      <span className="text-lg font-mono tracking-widest text-slate-100">
        PMATE DASHBOARD
      </span>
      <ConfigProvider
        theme={{
          components: {
            Menu: {
              itemSelectedColor: "#ffffff",
              darkItemSelectedBg: "#1f2937",
              horizontalItemSelectedBg: "#111827",
            },
          },
        }}
      >
        <Menu
          mode="horizontal"
          theme="dark"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          items={menuItems.map(({ key, label }) => ({ key, label }))}
          className="flex-1 min-w-fit border-none bg-transparent text-slate-300 [&_.ant-menu-item-selected]:!text-primary-300 [&_.ant-menu-item]:!text-slate-300"
        />
      </ConfigProvider>
    </Header>
  )
}

const DashboardLayout = () => {
  return (
    <Layout className="h-screen bg-slate-950 text-slate-100 overflow-auto">
      <DashboardHeader />
      <Content className="bg-slate-950">
        <div className="mx-auto w-full max-w-6xl px-6 py-8 text-slate-100">
          <Routes>
            <Route
              path="/prompts"
              element={<PromptsPage />}
            />
            <Route
              path="/prompt/run"
              element={<RunPromptPage />}
            />
            <Route
              path="/prompt/add"
              element={<AddPromptPage />}
            />
            <Route path="/" element={<PromptsPage />} />
            <Route
              path="*"
              element={<div>404 No match: {window.location.hash}</div>}
            />
          </Routes>
        </div>
      </Content>
    </Layout>
  )
}

const AppRoutes = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: darkAlgorithm,
        token: {
          colorBgBase: "#0f172a",
          colorTextBase: "#e2e8f0",
          colorBorder: "#1e293b",
          colorPrimary: "#6366f1",
        },
        components: {
          Button: {
            colorPrimary: "#6366f1",
          },
        },
      }}
    >
      <SnackbarProvider>
        <HybridProvider endpoints={[Endpoints.hub]}>
          <PipelineProvider>
            <HashRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <AuthProviderV2
                app={resolveAppId()}
                authRoutes={[
                  "/",
                  "/prompts",
                  "/prompt/run",
                  "/prompt/add",
                ]}
                rtcProvider={RtcProvider}
              >
                <DashboardLayout />
              </AuthProviderV2>
            </HashRouter>
          </PipelineProvider>
        </HybridProvider>
      </SnackbarProvider>
    </ConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense>
      <AppRoutes />
    </Suspense>
  </React.StrictMode>
)
