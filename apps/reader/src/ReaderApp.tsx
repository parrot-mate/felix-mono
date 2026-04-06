import { GlobalLoading } from "@/component/GlobalLoading"
import { ThemeProvider } from "@pchip/components"
import { wait } from "@pmate/utils"
import {
  AuthProviderV2,
  userSettingsAtom,
  resolveAppId,
} from "@pmate/account-sdk"
import { I18nextProvider, i18n, useTranslation } from "@pmate/i18n"
import {
  AggregatorProvider,
  Endpoints,
  HybridProvider,
  PipelineProvider,
  RtcProvider,
} from "@pmate/sdk"
import {
  Button,
  IconButton,
  IconCancel,
  SnackbarProvider,
  closeSnackbar,
} from "@pmate/uikit"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { Suspense, useEffect } from "react"
import { HashRouter, Navigate, Route, Routes } from "react-router-dom"
import { networkStateAtom } from "./atom/offlineAtom"
import { HomeTabsLayout } from "./layout/HomeTabsLayout"
import { OfflineHome } from "./page/OfflineHome"
import { TestUIKit } from "./page/TestUIKit.tsx"
import { UserCenter } from "./page/UserCenter"
import { Vocabulary } from "./page/Vocabulary"
import { TearMode } from "./reader/TearMode"
import { BookBrowser } from "./reader/page/BookBrowser"
import { BookDetail } from "./reader/page/BookDetail"
import { BookUploader } from "./reader/page/BookUploader"
import { Home } from "./reader/page/Home"
import { SlideMenu } from "./reader/tear/SlideMenu"

const LOG_SERVICE_ENDPOINT = process.env.VITE_PUBLIC_CHAT_API_ENDPOINT!

const askOfflineAtom = atom(async () => {
  try {
    const resp = await Promise.race([
      fetch(`${LOG_SERVICE_ENDPOINT}/ok`),
      wait(2000).then(() => "timeout"),
    ])
    if (resp === "timeout") {
      return true
    }
    return false
  } catch (ex) {
    return true
  }
})

export const App = () => {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <_App />
    </Suspense>
  )
}

const _App = () => {
  const shouldAskOffline = useAtomValue(askOfflineAtom)
  const ns = useAtomValue(networkStateAtom)
  const setNetworkState = useSetAtom(networkStateAtom)
  const lang = useAtomValue(userSettingsAtom("uiLang"))
  const t = useTranslation()
  useEffect(() => {
    i18n.changeLanguage(lang as string)
  }, [lang])
  if (shouldAskOffline && !ns.offline) {
    return (
      <div>
        <h3>{t("Network is slow, enable offline mode?")}</h3>
        <Button
          onClick={() => {
            setNetworkState({ offline: true })
          }}
        >
          {t("Enable offline mode")}
        </Button>
      </div>
    )
  }

  return (
    <I18nextProvider i18n={i18n}>
      {!ns.offline ? <OnlineApp /> : <OfflineApp />}
    </I18nextProvider>
  )
}

const OfflineApp = () => {
  return (
    <AggregatorProvider>
      <ThemeProvider>
        <SnackbarProvider
          maxSnack={3}
          autoHideDuration={2000}
          action={(key) => {
            return (
              <IconButton aria-label="close" onClick={() => closeSnackbar(key)}>
                <IconCancel />
              </IconButton>
            )
          }}
        >
          <Suspense fallback={<GlobalLoading />}>
            <HashRouter>
              <Routes>
                <Route path="/" element={<OfflineHome />} />
                <Route path="/home" element={<OfflineHome />} />
                <Route
                  path="/reader/TearMode/:id/:pid"
                  element={<TearMode />}
                />
                <Route path="/book/:id" element={<BookDetail />} />
              </Routes>
            </HashRouter>
          </Suspense>
        </SnackbarProvider>
        <Suspense>
          <SlideMenu />
        </Suspense>
      </ThemeProvider>
    </AggregatorProvider>
  )
}

const OnlineApp = () => {
  return (
    <HybridProvider endpoints={[Endpoints.hub]}>
      <PipelineProvider>
        <AggregatorProvider>
          <ThemeProvider>
            <SnackbarProvider
              maxSnack={3}
              autoHideDuration={2000}
              action={(key) => {
                return (
                  <IconButton
                    aria-label="close"
                    onClick={() => closeSnackbar(key)}
                  >
                    <IconCancel />
                  </IconButton>
                )
              }}
            >
              <HashRouter>
                <AuthProviderV2
                  app={resolveAppId()}
                  authRoutes={[
                    "/",
                    "/home",
                    "/browser",
                    "/reader/TearMode/:id/:pid",
                    "/book/:id",
                    "/uc",
                    "/upload",
                    "/vocabulary",
                    "/test",
                  ]}
                  rtcProvider={RtcProvider}
                >
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/browser" element={<BookBrowser />} />
                    <Route
                      path="/reader/TearMode/:id/:pid"
                      element={<TearMode />}
                    />
                    <Route path="/book/:id" element={<BookDetail />} />
                    <Route
                      path="/uc"
                      element={
                        <HomeTabsLayout>
                          <UserCenter />
                        </HomeTabsLayout>
                      }
                    />
                    <Route path="/upload" element={<BookUploader />} />
                    <Route path="/vocabulary" element={<Vocabulary />} />
                    <Route path="/test" element={<TestUIKit />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AuthProviderV2>
              </HashRouter>
              {/* <Migration107 /> */}
            </SnackbarProvider>
            <Suspense>
              <SlideMenu />
            </Suspense>
          </ThemeProvider>
        </AggregatorProvider>
      </PipelineProvider>
    </HybridProvider>
  )
}
