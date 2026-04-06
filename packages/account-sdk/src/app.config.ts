const PM_STATIC = "https://parrot-static.pmate.chat"

export const DEFAULT_APP_ID = "@pmate/chat"
export const SHUANG_APP_ID = "shuang"
export const MINI_APP_ID = "@pmate/mini-apps-mono"
export const ERP_HOMEPAGE_APP_ID = "@felix/erp-homepage"

export interface ProfileStep {
  type:
    | "nickname"
    | "learning-language"
    | "mother-tongue"
    | "gender"
    | "is-adult"
    | "age"
    | "Identity"
  title: string
  required: boolean
}

export interface AppConfig {
  id: string
  name: string
  icon: string
  background: string
  themeColor?: string
  welcomeText: string
  profiles: ProfileStep[]
}

const buildDisplayNameFromAppId = (appId: string): string => {
  const normalized = appId.replace(/^@/, "")
  const segments = normalized.split("/").filter(Boolean)
  const last = segments[segments.length - 1] || normalized
  return last || "App"
}

const APP_CONFIGS: Record<string, Omit<AppConfig, "id">> = {
  [DEFAULT_APP_ID]: {
    name: "Parrot Mate",
    icon: `${PM_STATIC}/parrot-logo.png`,
    background: "linear-gradient(135deg, #F472B6 0%, #8B5CF6 100%)",
    welcomeText: "Welcome！Parrot mate.",
    profiles: [
      { type: "learning-language", title: "Learning Language", required: true },
      { type: "nickname", title: "Nickname", required: true },
    ],
  },
  [SHUANG_APP_ID]: {
    name: "爽歪歪大王恋爱聊天机器人",
    icon: `${PM_STATIC}/shuang.webp`,
    background: "linear-gradient(180deg, #3b2ea8 0%, #0b0b0b 100%)",
    welcomeText: "欢迎来到爽歪歪大王恋爱聊天机器人～先选择角色开始聊天吧。",
    profiles: [
      { type: "gender", title: "您的性别", required: true },
      { type: "is-adult", title: "是否成年", required: true },
    ],
  },
  [MINI_APP_ID]: {
    name: "EquitySeer",
    icon: `${PM_STATIC}/EquitySeer.png`,
    background: "linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)",
    themeColor: "#00B4D8",
    welcomeText: "Welcome！ EquitySeer.",
    profiles: [
      { type: "nickname", title: "name", required: true },
      { type: "Identity", title: "Identity", required: false },
    ],
  },
  [ERP_HOMEPAGE_APP_ID]: {
    name: "Felix ERP Homepage",
    icon: `${PM_STATIC}/parrot-logo.png`,
    background: "linear-gradient(135deg, #0F172A 0%, #1D4ED8 55%, #38BDF8 100%)",
    themeColor: "#1D4ED8",
    welcomeText: "Welcome to Felix ERP Homepage.",
    profiles: [{ type: "nickname", title: "Nickname", required: true }],
  },
}

export const getAppConfig = (appId: string | null): AppConfig => {
  if (!appId) {
    return {
      id: DEFAULT_APP_ID,
      ...APP_CONFIGS[DEFAULT_APP_ID],
    }
  }

  const existingConfig = APP_CONFIGS[appId]
  if (existingConfig) {
    return {
      id: appId,
      ...existingConfig,
    }
  }

  const appName = buildDisplayNameFromAppId(appId)
  return {
    id: appId,
    name: appName,
    icon: `${PM_STATIC}/parrot-logo.png`,
    background: "linear-gradient(180deg, #9ca3af 0%, #6b7280 100%)",
    welcomeText: `Welcome to ${appName}`,
    profiles: [{ type: "nickname", title: "Nickname", required: true }],
  }
}
