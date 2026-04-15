import { useAtom, useAtomValue } from "jotai"
import { useEffect, useMemo, useState } from "react"
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
} from "react-router-dom"
import { previewContextAtom } from "./atom/viewerContextAtom"
import { businessRoleOptions, departmentOptions } from "./data/options"
import {
  AuthProviderV2,
  accountStateAtom,
  profileAtom,
  useAuthApp,
} from "./lib/authCompat"
import {
  createNavigationId,
  filterNavigationItems,
  groupNavigationItems,
  parseCsvList,
  readMockViewerContext,
  serializeCsvList,
} from "./lib/navigation"
import {
  blockchainConfig,
  navigationTopic,
} from "./lib/blockchainClient"
import {
  getNavigationRepository,
  type NavigationInput,
  type NavigationPatch,
  type NavigationRepository,
} from "./lib/navigationRepository"
import type { BusinessRole, Department, NavigationItem, ViewerContext } from "./types"

const ERP_APP_ID = "felix:erp-homepage"

type NavigationFormValue = {
  id?: string
  name: string
  description: string
  url: string
  group: string
  icon: string
  openMode: "same-tab" | "new-tab"
  roles: string
  departments: string
}

type NavigationStore = {
  items: NavigationItem[]
  loading: boolean
  saving: boolean
  error: string
  repositoryKind: NavigationRepository["kind"]
  reload: () => Promise<void>
  saveItem: (formValue: NavigationFormValue, actorId?: string) => Promise<NavigationItem | undefined>
  deleteItem: (id: string) => Promise<void>
  reset: () => Promise<void>
}

type ThemeMode = "dark" | "light"

const emptyFormValue: NavigationFormValue = {
  name: "",
  description: "",
  url: "",
  group: "日常办公",
  icon: "NW",
  openMode: "same-tab",
  roles: "",
  departments: "",
}

const THEME_STORAGE_KEY = "erp-homepage:theme"

function isMockAuthEnabled() {
  if (typeof window === "undefined") {
    return false
  }
  return new URLSearchParams(window.location.search).get("mockAuth") === "1"
}

function buildViewerContext(
  mockViewer: ViewerContext | null,
  authenticatedName: string | undefined,
  accountId: string | undefined,
  avatar: string | undefined,
  profileRole: string | undefined,
  businessRole: BusinessRole,
  department: Department
): ViewerContext {
  if (mockViewer) {
    return mockViewer
  }

  return {
    name: authenticatedName || "Authenticated User",
    accountId,
    avatar,
    profileRole,
    businessRole,
    department,
    source: "auth",
    authenticated: Boolean(authenticatedName || accountId),
  }
}

function openAttrs(openMode: "same-tab" | "new-tab") {
  if (openMode === "new-tab") {
    return {
      target: "_blank",
      rel: "noopener noreferrer",
    }
  }

  return {
    target: "_self",
    rel: undefined,
  }
}

function toNavigationInput(formValue: NavigationFormValue): NavigationInput {
  return {
    id: formValue.id || createNavigationId(formValue.name),
    name: formValue.name.trim(),
    description: formValue.description.trim(),
    url: formValue.url.trim(),
    group: formValue.group.trim(),
    icon: formValue.icon.trim().slice(0, 4).toUpperCase() || "NW",
    openMode: formValue.openMode,
    visibility: {
      roles: parseCsvList(formValue.roles, businessRoleOptions),
      departments: parseCsvList(formValue.departments, departmentOptions),
    },
  }
}

function toFormValue(item: NavigationItem | undefined): NavigationFormValue {
  if (!item) {
    return emptyFormValue
  }

  return {
    ...item,
    roles: serializeCsvList(item.visibility?.roles),
    departments: serializeCsvList(item.visibility?.departments),
  }
}

function sortNavigationItems(items: NavigationItem[]) {
  return [...items].sort((left, right) => {
    if (left.group !== right.group) {
      return left.group.localeCompare(right.group, "zh-CN")
    }
    return left.name.localeCompare(right.name, "zh-CN")
  })
}

function resolveInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark"
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme
  }

  if (typeof window.matchMedia !== "function") {
    return "dark"
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
}

function useThemeMode() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => resolveInitialTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode
    document.documentElement.style.colorScheme = themeMode
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }, [themeMode])

  const toggleThemeMode = () => {
    setThemeMode((current) => (current === "dark" ? "light" : "dark"))
  }

  return {
    themeMode,
    toggleThemeMode,
  }
}

function useNavigationStore(mockMode: boolean): NavigationStore {
  const repository = useMemo(() => getNavigationRepository(mockMode), [mockMode])
  const [items, setItems] = useState<NavigationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const reload = async () => {
    setLoading(true)
    setError("")
    try {
      setItems(await repository.list())
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [repository])

  const scheduleReload = () => {
    if (repository.kind !== "blockchain") {
      return
    }
    window.setTimeout(() => {
      void reload()
    }, 4_000)
  }

  const saveItem = async (formValue: NavigationFormValue, actorId?: string) => {
    const input = toNavigationInput(formValue)
    if (!input.name || !input.description || !input.url || !input.group) {
      setError("请先填写名称、描述、链接和分组。")
      return undefined
    }

    setSaving(true)
    setError("")
    try {
      const saved = formValue.id
        ? await repository.update(
            {
              ...(input as NavigationPatch),
              id: formValue.id,
            },
            actorId
          )
        : await repository.create(input, actorId)
      setItems((current) =>
        sortNavigationItems([
          saved,
          ...current.filter((item) => item.id !== saved.id),
        ])
      )
      scheduleReload()
      return saved
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
      return undefined
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (id: string) => {
    setSaving(true)
    setError("")
    try {
      await repository.delete(id)
      setItems((current) => current.filter((item) => item.id !== id))
      scheduleReload()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
    } finally {
      setSaving(false)
    }
  }

  const reset = async () => {
    if (!repository.reset) {
      return
    }
    setSaving(true)
    setError("")
    try {
      await repository.reset()
      setItems(await repository.list())
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
    } finally {
      setSaving(false)
    }
  }

  return {
    items,
    loading,
    saving,
    error,
    repositoryKind: repository.kind,
    reload,
    saveItem,
    deleteItem,
    reset,
  }
}

const ViewerContextPanel = ({
  viewer,
  repositoryKind,
}: {
  viewer: ViewerContext
  repositoryKind: NavigationRepository["kind"]
}) => {
  const [previewContext, setPreviewContext] = useAtom(previewContextAtom)
  const authApp = useAuthApp({ app: ERP_APP_ID })

  return (
    <section className="hero-shell">
      <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-5">
          <p className="eyebrow">Townhall Command Center</p>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Townhall 正在汇总你的业务入口、身份上下文与访问状态。
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              首页保留现有导航数据流，但界面切换为 Townhall 风格的 command center。
              真实模式仍然读取远程 indexer，`mockAuth=1` 继续用于本地演示和测试。
            </p>
          </div>
        </div>
        <div className="grid min-w-full gap-3 sm:grid-cols-3 xl:min-w-[460px]">
          <div className="metric-card">
            <span className="metric-label">当前用户</span>
            <strong className="metric-value">{viewer.name}</strong>
            <span className="metric-helper">
              {viewer.source === "auth" ? "real SSO profile" : "mock preview"}
            </span>
          </div>
          <div className="metric-card">
            <span className="metric-label">业务上下文</span>
            <strong className="metric-value">{viewer.businessRole}</strong>
            <span className="metric-helper">{viewer.department}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">数据源</span>
            <strong className="metric-value">{repositoryKind}</strong>
            <span className="metric-helper">
              {repositoryKind === "blockchain"
                ? `${blockchainConfig.chainId} · ${navigationTopic}`
                : "local mock storage"}
            </span>
          </div>
        </div>
      </div>

      <div className="command-shell mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="field-shell" htmlFor="preview-role">
            <span className="field-label">业务角色预览</span>
            <select
              id="preview-role"
              className="field-input"
              value={previewContext.businessRole}
              onChange={(event) =>
                setPreviewContext((current) => ({
                  ...current,
                  businessRole: event.target.value as BusinessRole,
                }))
              }
            >
              {businessRoleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field-shell" htmlFor="preview-department">
            <span className="field-label">部门预览</span>
            <select
              id="preview-department"
              className="field-input"
              value={previewContext.department}
              onChange={(event) =>
                setPreviewContext((current) => ({
                  ...current,
                  department: event.target.value as Department,
                }))
              }
            >
              {departmentOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link className="action-link" to="/">
            返回首页
          </Link>
          <Link className="action-link action-link--dark" to="/admin">
            打开管理台
          </Link>
          {viewer.source === "auth" ? (
            <>
              <button
                type="button"
                className="action-link"
                onClick={() => authApp.updateProfile({ step: "nickname" })}
              >
                编辑 Profile
              </button>
              <button
                type="button"
                className="action-link"
                onClick={() => authApp.logout()}
              >
                退出登录
              </button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}

const HomePage = ({
  viewer,
  store,
}: {
  viewer: ViewerContext
  store: NavigationStore
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const visibleItems = useMemo(
    () => filterNavigationItems(store.items, viewer, searchTerm),
    [store.items, searchTerm, viewer]
  )
  const groupedItems = useMemo(() => groupNavigationItems(visibleItems), [visibleItems])
  const spotlightGroups = groupedItems.slice(0, 4)

  return (
    <div className="space-y-6">
      <ViewerContextPanel viewer={viewer} repositoryKind={store.repositoryKind} />

      <section className="panel-shell">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-1">
            <p className="eyebrow">Mission Deck</p>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
              Townhall Workspace
            </h2>
            <p className="text-sm text-slate-300">
              按业务角色、部门与搜索词筛选当前可见入口，页面继续以现有导航配置为唯一数据源。
            </p>
          </div>
          <label className="search-shell" htmlFor="erp-homepage-search">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Search
            </span>
            <input
              id="erp-homepage-search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="search-input"
              placeholder="搜索名称、描述或分组"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="status-pill">Business role: {viewer.businessRole}</span>
          <span className="status-pill">Department: {viewer.department}</span>
          <span className="status-pill">Visible items: {visibleItems.length}</span>
          <span className="status-pill">
            {store.loading ? "Loading remote data" : "Ready"}
          </span>
        </div>

        {store.error ? (
          <div className="error-banner mt-6">{store.error}</div>
        ) : null}

        {store.loading ? (
          <div className="empty-state" role="status">
            <h3 className="text-lg font-semibold text-white">正在加载导航配置</h3>
            <p className="max-w-md text-sm leading-7 text-slate-300">
              如果你当前在真实模式下，这一步会从 indexer 拉取导航项物化结果。
            </p>
          </div>
        ) : groupedItems.length === 0 ? (
          <div className="empty-state" role="status">
            <h3 className="text-lg font-semibold text-white">没有找到可见导航项</h3>
            <p className="max-w-md text-sm leading-7 text-slate-300">
              当前业务角色、部门或搜索词下没有匹配结果。你可以调整预览上下文，
              或在管理台新增一个满足当前可见规则的入口。
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {spotlightGroups.length ? (
              <section className="command-shell space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">频道概览</h3>
                    <p className="text-sm text-slate-300">按当前视角优先显示最相关的分组入口。</p>
                  </div>
                  <div className="hidden text-xs uppercase tracking-[0.24em] text-cyan-200/70 md:block">
                    Active Channels
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {spotlightGroups.map((group) => (
                    <div key={group.group} className="channel-pill">
                      <span>{group.group}</span>
                      <strong>{group.items.length}</strong>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            {groupedItems.map((group) => (
              <section key={group.group} className="space-y-4" aria-label={group.group}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{group.group}</h3>
                    <p className="text-sm text-slate-400">{group.items.length} 个入口</p>
                  </div>
                  <div className="hidden text-xs uppercase tracking-[0.25em] text-slate-500 md:block">
                    Grouped Access
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((item) => {
                    const attrs = openAttrs(item.openMode)
                    return (
                      <a
                        key={item.id}
                        href={item.url}
                        target={attrs.target}
                        rel={attrs.rel}
                        className={`nav-card ${item.openMode === "new-tab" ? "nav-card--external" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="nav-icon" aria-hidden="true">
                            {item.icon}
                          </div>
                          <span className="open-mode-pill">
                            {item.openMode === "new-tab" ? "New Tab" : "Same Tab"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-lg font-semibold text-white">{item.name}</h4>
                          <p className="text-sm leading-7 text-slate-300">{item.description}</p>
                        </div>
                        <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-sm text-slate-400">
                          <span>{item.group}</span>
                          <span className="font-semibold text-cyan-200">打开入口</span>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

const AdminPage = ({
  actorId,
  store,
}: {
  actorId?: string
  store: NavigationStore
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formValue, setFormValue] = useState<NavigationFormValue>(emptyFormValue)

  useEffect(() => {
    if (!store.items.length) {
      setSelectedId(null)
      setIsCreating(true)
      setFormValue(emptyFormValue)
      return
    }

    if (isCreating) {
      return
    }

    if (!selectedId || !store.items.some((item) => item.id === selectedId)) {
      const next = store.items[0]
      setSelectedId(next?.id ?? null)
      setFormValue(toFormValue(next))
      return
    }

    const current = store.items.find((item) => item.id === selectedId)
    if (current) {
      setFormValue(toFormValue(current))
    }
  }, [isCreating, selectedId, store.items])

  const handleSelect = (itemId: string) => {
    setIsCreating(false)
    setSelectedId(itemId)
    setFormValue(toFormValue(store.items.find((item) => item.id === itemId)))
  }

  const handleSave = async () => {
    const saved = await store.saveItem(formValue, actorId)
    if (saved) {
      setIsCreating(false)
      setSelectedId(saved.id)
      setFormValue(toFormValue(saved))
    }
  }

  const handleDelete = async () => {
    if (!selectedId) {
      return
    }
    await store.deleteItem(selectedId)
  }

  const handleCreateNew = () => {
    setIsCreating(true)
    setSelectedId(null)
    setFormValue(emptyFormValue)
  }

  return (
    <div className="space-y-6">
      <section className="hero-shell">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="eyebrow">Townhall Control Room</p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
              通过 Townhall 管理导航目录与可见性规则。
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
              真实模式会把导航项写到 `@pmate/store` 的 `Namespace.table()`，并从 indexer
              读取物化列表。`mockAuth=1` 仍然使用本地仓储，便于开发和测试。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="action-link action-link--dark" onClick={handleCreateNew}>
              新增导航项
            </button>
            <button type="button" className="action-link" onClick={() => void store.reload()}>
              刷新
            </button>
            {store.repositoryKind === "mock" ? (
              <button type="button" className="action-link" onClick={() => void store.reset()}>
                重置默认配置
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {store.error ? <div className="error-banner">{store.error}</div> : null}

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="panel-shell">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">导航项列表</h2>
            <span className="status-pill">
              {store.loading ? "loading" : `${store.items.length} items`}
            </span>
          </div>
          <div className="space-y-3">
            {store.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`list-item ${selectedId === item.id ? "list-item--active" : ""}`}
                onClick={() => handleSelect(item.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-left font-semibold text-white">{item.name}</span>
                  <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {item.icon}
                  </span>
                </div>
                <div className="mt-2 text-left text-xs leading-6 text-slate-400">
                  {item.group} · {item.openMode}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="panel-shell">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {isCreating ? "新增导航项" : "编辑导航项"}
              </h2>
              <p className="text-sm text-slate-300">
                真实模式会等待 indexer 收敛后再回写界面，因此保存会比本地模式慢一些。
              </p>
            </div>
            <div className="flex gap-3">
              {!isCreating && formValue.id ? (
                <button
                  type="button"
                  className="action-link action-link--danger"
                  onClick={() => void handleDelete()}
                  disabled={store.saving}
                >
                  删除
                </button>
              ) : null}
              <button
                type="button"
                className="action-link action-link--dark"
                onClick={() => void handleSave()}
                disabled={store.saving}
              >
                {store.saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-shell" htmlFor="nav-name">
              <span className="field-label">名称</span>
              <input
                id="nav-name"
                className="field-input"
                value={formValue.name}
                onChange={(event) =>
                  setFormValue((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label className="field-shell" htmlFor="nav-group">
              <span className="field-label">分组</span>
              <input
                id="nav-group"
                className="field-input"
                value={formValue.group}
                onChange={(event) =>
                  setFormValue((current) => ({ ...current, group: event.target.value }))
                }
              />
            </label>
            <label className="field-shell md:col-span-2" htmlFor="nav-description">
              <span className="field-label">描述</span>
              <textarea
                id="nav-description"
                className="field-input field-textarea"
                value={formValue.description}
                onChange={(event) =>
                  setFormValue((current) => ({ ...current, description: event.target.value }))
                }
              />
            </label>
            <label className="field-shell md:col-span-2" htmlFor="nav-url">
              <span className="field-label">目标链接</span>
              <input
                id="nav-url"
                className="field-input"
                value={formValue.url}
                onChange={(event) =>
                  setFormValue((current) => ({ ...current, url: event.target.value }))
                }
              />
            </label>
            <label className="field-shell" htmlFor="nav-icon">
              <span className="field-label">图标缩写</span>
              <input
                id="nav-icon"
                className="field-input"
                value={formValue.icon}
                onChange={(event) =>
                  setFormValue((current) => ({ ...current, icon: event.target.value }))
                }
              />
            </label>
            <label className="field-shell" htmlFor="nav-open-mode">
              <span className="field-label">打开方式</span>
              <select
                id="nav-open-mode"
                className="field-input"
                value={formValue.openMode}
                onChange={(event) =>
                  setFormValue((current) => ({
                    ...current,
                    openMode: event.target.value as "same-tab" | "new-tab",
                  }))
                }
              >
                <option value="same-tab">same-tab</option>
                <option value="new-tab">new-tab</option>
              </select>
            </label>
            <label className="field-shell" htmlFor="nav-roles">
              <span className="field-label">可见角色</span>
              <input
                id="nav-roles"
                className="field-input"
                value={formValue.roles}
                onChange={(event) =>
                  setFormValue((current) => ({ ...current, roles: event.target.value }))
                }
                placeholder="employee, manager"
              />
            </label>
            <label className="field-shell" htmlFor="nav-departments">
              <span className="field-label">可见部门</span>
              <input
                id="nav-departments"
                className="field-input"
                value={formValue.departments}
                onChange={(event) =>
                  setFormValue((current) => ({ ...current, departments: event.target.value }))
                }
                placeholder="ops, finance"
              />
            </label>
          </div>
        </div>
      </section>
    </div>
  )
}

const AppFrame = ({
  viewer,
  store,
}: {
  viewer: ViewerContext
  store: NavigationStore
}) => {
  const { themeMode, toggleThemeMode } = useThemeMode()
  const nextThemeLabel = themeMode === "dark" ? "切换白天模式" : "切换黑夜模式"

  return (
    <main className="townhall-app">
      <aside className="townhall-sidebar">
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="townhall-brand-mark">TH</div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.34em] text-cyan-200/70">
                Felix Mono
              </div>
              <div className="townhall-brand-text">Townhall</div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              Navigation
            </p>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `route-link route-link--sidebar ${isActive ? "route-link--active" : ""}`
              }
            >
              首页
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `route-link route-link--sidebar ${isActive ? "route-link--active" : ""}`
              }
            >
              管理台
            </NavLink>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
            Session
          </p>
          <div className="townhall-user-card">
            <div className="townhall-user-avatar">{viewer.name.slice(0, 1).toUpperCase()}</div>
            <div>
              <div className="text-sm font-semibold text-white">{viewer.name}</div>
              <div className="text-xs text-slate-400">
                {viewer.businessRole} · {viewer.department}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="townhall-main">
        <header className="top-nav">
          <div>
            <p className="eyebrow">Townhall</p>
            <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white">
              Unified ERP Homepage
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="action-link"
              onClick={toggleThemeMode}
              aria-label={nextThemeLabel}
            >
              {themeMode === "dark" ? "白天模式" : "黑夜模式"}
            </button>
            <span className="status-pill">{viewer.name}</span>
            <span className="status-pill">{store.repositoryKind}</span>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<HomePage viewer={viewer} store={store} />} />
          <Route
            path="/admin"
            element={<AdminPage actorId={viewer.accountId} store={store} />}
          />
        </Routes>
      </div>
    </main>
  )
}

const RoutedApp = () => {
  const mockMode = isMockAuthEnabled()
  const mockViewer = useMemo(
    () => readMockViewerContext(window.location.search),
    []
  )
  const profile = useAtomValue(profileAtom)
  const account = useAtomValue(accountStateAtom)
  const previewContext = useAtomValue(previewContextAtom)
  const store = useNavigationStore(mockMode)

  const viewer = useMemo(
    () =>
      buildViewerContext(
        mockViewer,
        profile?.nickName,
        account?.accountId,
        profile?.avatar,
        profile?.role,
        previewContext.businessRole,
        previewContext.department
      ),
    [
      account?.accountId,
      mockViewer,
      previewContext.businessRole,
      previewContext.department,
      profile?.avatar,
      profile?.nickName,
      profile?.role,
    ]
  )

  return <AppFrame viewer={viewer} store={store} />
}

export function App() {
  const mockMode = isMockAuthEnabled()

  if (mockMode) {
    return (
      <BrowserRouter>
        <RoutedApp />
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <AuthProviderV2
        app={ERP_APP_ID}
        authRoutes={[
          { path: "/", behavior: "redirect" },
          { path: "/admin", behavior: "redirect" },
        ]}
      >
        <RoutedApp />
      </AuthProviderV2>
    </BrowserRouter>
  )
}

export default App
