import { AuthProviderV2, resolveAppId } from "@pmate/account-sdk"
import { Endpoints, HybridProvider, PipelineProvider, RtcProvider } from "@pmate/sdk"
import { SnackbarProvider } from "@pmate/uikit"
import type { MenuProps } from "antd"
import {
  Avatar,
  Badge,
  Button,
  ConfigProvider,
  Input,
  Layout,
  Menu,
  Space,
  Tooltip,
  theme,
} from "antd"
import {
  AppstoreOutlined,
  CompassOutlined,
  DeploymentUnitOutlined,
  PlusOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons"
import "antd/dist/reset.css"
import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react"
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
import { ThemeToggle } from "./component/ThemeToggle"

const { Header, Sider, Content } = Layout
const { darkAlgorithm, defaultAlgorithm } = theme

const menuItems = [
  {
    key: "prompts",
    label: "Ops Library",
    path: "/prompts",
    icon: <AppstoreOutlined />,
  },
  {
    key: "create",
    label: "Forge Prompt",
    path: "/prompt/add",
    icon: <PlusOutlined />,
  },
]

const AppHeader = ({
  themeMode,
  onToggleTheme,
}: {
  themeMode: "light" | "dark"
  onToggleTheme: () => void
}) => {
  const location = useLocation()
  const navigate = useNavigate()

  const selectedKey = useMemo(() => {
    if (location.pathname.startsWith("/prompt")) {
      return "prompts"
    }
    return menuItems.find((item) => location.pathname === item.path)?.key ?? ""
  }, [location.pathname])

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    const item = menuItems.find((menuItem) => menuItem.key === key)
    if (!item) {
      return
    }
    navigate(item.path)
  }

  return (
    <Header className="agent-topbar">
      <div className="flex flex-1 items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="agent-orb">
            <ThunderboltOutlined className="text-lg" />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-wide text-[var(--ui-text)]">
              Atlas Agent
            </div>
            <div className="text-xs uppercase tracking-[0.4em] text-[var(--ui-text-muted)]">
              Navigation Core
            </div>
          </div>
        </div>
        <div className="hidden max-w-xl flex-1 lg:block">
          <Input
            prefix={<SearchOutlined className="text-[var(--ui-text-muted)]" />}
            placeholder="Search prompts, variables, or runs..."
            className="agent-search"
          />
        </div>
      </div>
      <Space size="middle">
        <Badge color="var(--ui-accent)" text="Live" />
        <Tooltip title="Quick create">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/prompt/add")}
          >
            New
          </Button>
        </Tooltip>
        <ThemeToggle
          checked={themeMode === "dark"}
          onChange={onToggleTheme}
        />
        <Avatar className="agent-avatar">AI</Avatar>
      </Space>
      <div className="w-full lg:hidden">
        <Menu
          mode="horizontal"
          theme={themeMode === "dark" ? "dark" : "light"}
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          items={menuItems.map(({ key, label, icon }) => ({
            key,
            label,
            icon,
          }))}
          className="agent-menu"
        />
      </div>
    </Header>
  )
}

const AppShell = ({
  themeMode,
  onToggleTheme,
}: {
  themeMode: "light" | "dark"
  onToggleTheme: () => void
}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const selectedKey = useMemo(() => {
    if (location.pathname.startsWith("/prompt")) {
      return "prompts"
    }
    return menuItems.find((item) => location.pathname === item.path)?.key ?? ""
  }, [location.pathname])

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    const item = menuItems.find((menuItem) => menuItem.key === key)
    if (!item) {
      return
    }
    navigate(item.path)
  }

  return (
    <Layout className="min-h-screen bg-[var(--ui-bg)] text-[var(--ui-text)]">
      <Sider width={280} className="hidden bg-transparent lg:block">
        <div className="flex h-full flex-col gap-6 p-6">
          <div className="agent-panel">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.3em] text-[var(--ui-text-muted)]">
                Mission Stack
              </span>
              <CompassOutlined className="text-[var(--ui-accent)]" />
            </div>
            <Menu
              mode="inline"
              theme={themeMode === "dark" ? "dark" : "light"}
              selectedKeys={[selectedKey]}
              onClick={handleMenuClick}
              items={menuItems.map(({ key, label, icon }) => ({
                key,
                label,
                icon,
              }))}
              className="agent-menu agent-menu--side"
            />
          </div>
          <div className="agent-panel">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[var(--ui-text-muted)]">
              <DeploymentUnitOutlined />
              Signal
            </div>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--ui-text)]">Pipeline Health</span>
                <span className="text-[var(--ui-accent-2)]">92%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--ui-surface-2)]">
                <div className="h-2 w-[92%] rounded-full bg-[var(--ui-accent-2)]" />
              </div>
              <div className="text-[var(--ui-text-muted)]">
                Last sync 2m ago · 18 active agents
              </div>
            </div>
          </div>
        </div>
      </Sider>
      <Layout className="bg-transparent">
        <AppHeader themeMode={themeMode} onToggleTheme={onToggleTheme} />
        <Content className="px-4 pb-10 pt-6 md:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <Routes>
              <Route path="/prompts" element={<PromptsPage />} />
              <Route path="/prompt/run" element={<RunPromptPage />} />
              <Route path="/prompt/add" element={<AddPromptPage />} />
              <Route path="/" element={<PromptsPage />} />
              <Route
                path="*"
                element={<div>404 No match: {window.location.hash}</div>}
              />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

const AppRoutes = () => {
  const [themeMode, setThemeMode] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "dark"
    }
    const stored = window.localStorage.getItem("agent-ui-theme")
    return stored === "light" ? "light" : "dark"
  })

  const handleToggleTheme = useCallback(() => {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"))
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    window.localStorage.setItem("agent-ui-theme", themeMode)
    document.documentElement.dataset.theme = themeMode
  }, [themeMode])

  const themeTokens = useMemo(
    () => ({
      colorPrimary: themeMode === "dark" ? "#ff6b35" : "#2f5aff",
      colorTextBase: themeMode === "dark" ? "#f1ede7" : "#1d1a16",
      colorBgBase: themeMode === "dark" ? "#0b0f14" : "#f6f3ee",
      colorBorder: themeMode === "dark" ? "#273240" : "#ded6cc",
      colorInfo: themeMode === "dark" ? "#38bdf8" : "#2563eb",
    }),
    [themeMode]
  )

  return (
    <ConfigProvider
      theme={{
        algorithm: themeMode === "dark" ? darkAlgorithm : defaultAlgorithm,
        token: themeTokens,
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
              {import.meta.env.DEV ? (
                <AppShell
                  themeMode={themeMode}
                  onToggleTheme={handleToggleTheme}
                />
              ) : (
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
                  <AppShell
                    themeMode={themeMode}
                    onToggleTheme={handleToggleTheme}
                  />
                </AuthProviderV2>
              )}
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
