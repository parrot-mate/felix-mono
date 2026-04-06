# Account System

Integrate the Pmate auth stack in a browser app using `@pmate/account-sdk`, optional account UI from `@pmate/uikit`, and reference behaviors from `@pmate/chat`.

## Table of Contents

- [Background/背景](#background)
- [Account vs Profile](#account-vs-profile)
- [Integration](#integration)
- [Login and Session Restore](#login-and-session-restore)
- [Check Login Status and Profile](#check-login-status-and-profile)
- [Logout](#logout)
- [Create Profiles](#create-profiles)
- [Update Profiles](#update-profiles)
- [Select Profile](#select-profile)
- [Profile Switching](#profile-switching)
- [App Profile Pages](#app-profile-pages)
- [Profile Info UI](#profile-info-ui)

<a id="background"></a>
## Background/背景

Web teams often re-implement login, session restore, and profile onboarding in slightly different ways. That causes inconsistent behavior across products and makes it harder to share features like profile switching or account settings.

The Pmate auth system splits concerns: `@pmate/account-sdk` owns session/profile state and auth behaviors, the hosted auth app provides login and profile flows, and `@pmate/uikit` hosts reusable account UI like nickname/language selectors. This guide keeps your app aligned with the same flows used by `@pmate/chat`.

This guide focuses on a browser SPA using `@pmate/account-sdk` so you can wrap routes, redirect to hosted login or profile flows when needed, and keep session/profile state in one place. It also covers how to wire profile creation and updates without building bespoke API calls.

By following this setup, you get consistent login UX, predictable session restoration, and compatible profile management across web apps that share the same account system.

<a id="account-vs-profile"></a>
## Account vs Profile

- `account`: the login identity and session container. It represents authentication state (signed in/out), credential ownership, and the user identity from the auth system.
- `profile`: the app-facing persona under an account. It stores display data and app-level preferences (for example nickname, language, avatar) and is what most product features should reference.

One account can own multiple profiles. In practice:

- check `account` to decide whether the user is logged in;
- check/select `profile` to decide which persona is active in the app.

<a id="integration"></a>
## Integration

1. Install the SDK:

```bash
npm install @pmate/account-sdk
```

Peer dependencies you must provide in your app:

- `react`
- `react-router-dom`
- `jotai`
- `jotai-family`

If you want account UI building blocks (nickname selector, language selector, email setting), install `@pmate/uikit` and use the exported components.

2. Wrap your routes with `AuthProviderV2`:

```tsx
import { AuthProviderV2, DEFAULT_APP_ID } from "@pmate/account-sdk"
import { BrowserRouter, Route, Routes } from "react-router-dom"

const authRoutes = ["/", "/home", "/account"]

export const App = () => (
  <BrowserRouter>
    <AuthProviderV2 app={DEFAULT_APP_ID} authRoutes={authRoutes}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/account" element={<AccountPage />} />
      </Routes>
    </AuthProviderV2>
  </BrowserRouter>
)
```

`DEFAULT_APP_ID` resolves to `@pmate/chat`. If your web app uses a different `app` id, pass it directly or set `VITE_PUBLIC_APP`.

<a id="login-and-session-restore"></a>
## Login and Session Restore

- `AuthProviderV2` reads `sessionId` from the URL after returning from `https://auth.pmate.chat`, stores the token, and hydrates the account/profile state.
- `AuthProviderV2` already checks whether the user is logged in and will redirect to `https://auth.pmate.chat` when needed, so you do not need to trigger login manually.

If you need a custom entry point (for example, a dedicated "Sign in" page), you can still use `useAuthApp().login()`, but most apps should rely on `AuthProviderV2` for the default flow.

<a id="check-login-status-and-profile"></a>
## Check Login Status and Profile

After wrapping routes with `AuthProviderV2`, you can read login/profile state from atoms:

```tsx
import { useAtomValue } from "jotai"
import { accountStateAtom, profileAtom } from "@pmate/account-sdk"

const AuthStatus = () => {
  const account = useAtomValue(accountStateAtom)
  const profile = useAtomValue(profileAtom)
  const isLoggedIn = Boolean(account)

  if (!isLoggedIn) return <div>Not logged in</div>
  if (!profile) return <div>Logged in, no profile selected</div>
  return <div>{profile.nickName}</div>
}
```

If you need a one-shot check outside React rendering, read the manager snapshot:

```ts
import { AccountManagerV2 } from "@pmate/account-sdk"

const snap = await AccountManagerV2.get("@pmate/agent-demo").getSnapshot()
const isLoggedIn = Boolean(snap.account)
const currentProfile = snap.profile
```

<a id="logout"></a>
## Logout

Use the SDK to clear server and local session state, or redirect to the hosted logout page.

```tsx
import { useSetAtom } from "jotai"
import { userLogoutAtom, useAuthApp, DEFAULT_APP_ID } from "@pmate/account-sdk"

const LogoutButton = () => {
  const logout = useSetAtom(userLogoutAtom)
  const { logout: redirectLogout } = useAuthApp({ app: DEFAULT_APP_ID })
  return (
    <>
      <button onClick={() => void logout()}>Clear Session</button>
      <button onClick={() => redirectLogout()}>Hosted Logout</button>
    </>
  )
}
```

<a id="create-profiles"></a>
## Create Profiles

- If a user has no profiles and hits a protected route, `AuthProviderV2` will redirect to the hosted create-profile flow.
- You can also redirect into the hosted create-profile flow directly:

```tsx
import { useAuthApp, DEFAULT_APP_ID } from "@pmate/account-sdk"

const CreateProfileButton = () => {
  const { createProfile } = useAuthApp({ app: DEFAULT_APP_ID })
  return <button onClick={() => createProfile()}>Create profile</button>
}
```
- For headless flows, call `createProfileAtom` directly in your UI logic.

<a id="update-profiles"></a>
## Update Profiles

Use the account-sdk atoms or the hosted edit screen:

- `updateProfileAtom` updates the current profile and refreshes the shared profile cache.
- To redirect into the hosted edit flow, use `updateProfile` (supports `step`).

```tsx
import { useSetAtom } from "jotai"
import { updateProfileAtom } from "@pmate/account-sdk"

const UpdateProfile = ({ profileId }: { profileId: string }) => {
  const updateProfile = useSetAtom(updateProfileAtom)
  return (
    <button onClick={() => updateProfile(profileId, { nickName: "Nova" })}>
      Update nickname
    </button>
  )
}
```

```tsx
import { useAuthApp, DEFAULT_APP_ID } from "@pmate/account-sdk"

const EditProfileButton = () => {
  const { updateProfile } = useAuthApp({ app: DEFAULT_APP_ID })
  return (
    <button onClick={() => updateProfile({ step: "nickname" })}>
      Edit profile
    </button>
  )
}
```

<a id="select-profile"></a>
## Select Profile

Use the hosted selector when users need to switch identities:

```tsx
import { useAuthApp, DEFAULT_APP_ID } from "@pmate/account-sdk"

const SwitchProfileButton = () => {
  const { selectProfile } = useAuthApp({ app: DEFAULT_APP_ID })
  return <button onClick={() => selectProfile()}>Switch profile</button>
}
```

<a id="profile-switching"></a>
## Profile Switching

Use `profilesAtom` to list profiles and `switchProfileAtom` to set the active profile. This matches the behavior in `@pmate/chat` and keeps the selected profile consistent across reloads.

<a id="app-profile-pages"></a>
## App Profile Pages

`/profile` is app-defined and not provided by `@pmate/auth`. Each app should route `/profile` to its own profile UI.

<a id="profile-info-ui"></a>
## Profile Info UI

Use `profileAtom` to read the current profile and render app-specific UI:

```tsx
import { useAtomValue } from "jotai"
import { profileAtom } from "@pmate/account-sdk"

const ProfileInfo = () => {
  const profile = useAtomValue(profileAtom)
  if (!profile) return null
  return <div>{profile.nickName}</div>
}
```
