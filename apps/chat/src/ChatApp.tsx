import { GlobalLoading } from "@/component/GlobalLoading"
import { ThemeProvider } from "@pchip/components"
import {
  AuthProviderV2,
  DEFAULT_APP_ID,
  profileAtom,
  userSettingsAtom,
} from "@pmate/account-sdk"
import { I18nextProvider, i18n } from "@pmate/i18n"
import {
  AggregatorProvider,
  Endpoints,
  HybridProvider,
  PipelineProvider,
  RtcProvider,
} from "@pmate/sdk"
import {
  IconButton,
  IconCancel,
  SnackbarProvider,
  closeSnackbar,
} from "@pmate/uikit"
import { useAtomValue } from "jotai"
import { Suspense, useEffect, useMemo } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ChatTabsLayout } from "./layout/ChatTabsLayout"
import { ThreadListPage } from "./page"
import ChatDmPage from "./page/chat/dm"
import ChatGroupPage from "./page/chat/group"
import ComingSoonPage from "./page/coming-soon"
import { Contacts } from "./page/contacts"
import { AddFriend, FindFriend } from "./page/friend"
import { AddGroup, UpdateGroup } from "./page/group"
import SplashScreenPage from "./page/splash"
import { UserCenter } from "./page/user/UserCenter"

export const ChatApp = () => {
  const lang = useAtomValue(userSettingsAtom("uiLang"))
  useEffect(() => {
    i18n.changeLanguage(lang as string)
  }, [lang])
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const endpoints = useMemo(() => {
    const list = [Endpoints.hub]
    if (userId) {
      list.push(Endpoints.room)
    }
    return list
  }, [userId])
  return (
    <Suspense fallback={<GlobalLoading />}>
      <I18nextProvider i18n={i18n}>
        <HybridProvider endpoints={endpoints}>
          <PipelineProvider>
            <AggregatorProvider>
              <ThemeProvider>
                <SnackbarProvider
                  maxSnack={3}
                  autoHideDuration={2000}
                  action={(key) => (
                    <IconButton
                      aria-label="close"
                      onClick={() => closeSnackbar(key)}
                    >
                      <IconCancel />
                    </IconButton>
                  )}
                >
                  <BrowserRouter
                    future={{
                      v7_startTransition: true,
                      v7_relativeSplatPath: true,
                    }}
                  >
                    <ChatRoutes />
                  </BrowserRouter>
                </SnackbarProvider>
              </ThemeProvider>
            </AggregatorProvider>
          </PipelineProvider>
        </HybridProvider>
      </I18nextProvider>
    </Suspense>
  )
}

const ChatRoutes = () => {
  return (
    <AuthProviderV2
      app={DEFAULT_APP_ID}
      authRoutes={[
        { path: "/", behavior: "redirect" },
        "/profile",
        "/contacts",
        "/chat/dm/:toId",
        "/chat/group/:groupId",
        "/group/add",
        "/group/update/:threadHash",
        "/friend/add/:profileId",
        "/friend/find",
      ]}
      rtcProvider={RtcProvider}
    >
      <Routes>
        <Route path="/splash" element={<SplashScreenPage />} />
        <Route
          path="/"
          element={
            <ChatTabsLayout>
              <ThreadListPage />
            </ChatTabsLayout>
          }
        />
        <Route
          path="/contacts"
          element={
            <ChatTabsLayout>
              <Contacts />
            </ChatTabsLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <ChatTabsLayout>
              <UserCenter />
            </ChatTabsLayout>
          }
        />
        <Route path="/coming-soon" element={<ComingSoonPage />} />
        <Route path="/chat/dm/:toId" element={<ChatDmPage />} />
        <Route path="/chat/group/:groupId" element={<ChatGroupPage />} />
        <Route path="/group/add" element={<AddGroup />} />
        <Route path="/group/update/:threadHash" element={<UpdateGroup />} />
        <Route path="/friend/add/:profileId" element={<AddFriend />} />
        <Route path="/friend/find" element={<FindFriend />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProviderV2>
  )
}
