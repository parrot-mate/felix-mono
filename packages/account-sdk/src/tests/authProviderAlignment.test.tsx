import { useAtomValue } from "jotai"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AuthProviderV2 } from "../components/AuthProviderV2"
import { accountStateAtom, profileAtom } from "../atoms/accountProfileAtom"
import { AccountManagerEvent, AccountManagerV2 } from "../utils/AccountManagerV2"
import { AccountService } from "../api/AccountService"
import { ProfileService } from "../api/ProfileService"
import type { AuthSession, Profile } from "@pmate/meta"

const waitFor = async (
  assertion: () => void,
  timeoutMs = 2000,
  intervalMs = 10,
) => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      assertion()
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
  }
  assertion()
}

const SnapshotViewer = () => {
  const profile = useAtomValue(profileAtom)
  const account = useAtomValue(accountStateAtom)
  return (
    <pre data-testid="snapshot">
      {JSON.stringify(
        {
          profileId: profile?.id ?? null,
          accountId: account?.accountId ?? null,
        },
        null,
        2,
      )}
    </pre>
  )
}

describe("AuthProviderV2 / AccountManagerV2 / atom alignment", () => {
  let root: Root | null = null
  let container: HTMLDivElement | null = null

  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
    vi.useRealTimers()
    container = document.createElement("div")
    document.body.appendChild(container)
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
      root = null
    }
    container?.remove()
    container = null
    vi.restoreAllMocks()
  })

  it("keeps profileAtom aligned with AccountManagerV2 selected profile changes", async () => {
    const app = "@pmate/agent-demo-test-alignment"
    const session: AuthSession = {
      identity: {
        accountId:
          "0x9673ff2fbbf4403739db1c02d7941c3b2e70bfc1e0fe67df5a9f5d7502a79991",
      },
      issuedAt: "2026-03-03T00:00:00.000Z",
      expiresAt: "2026-03-03T23:59:59.000Z",
    }
    const profiles: Profile[] = [
      {
        id: "profile-alpha",
        app,
        account: session.identity.accountId,
        userName: "alpha_user",
        nickName: "Alpha",
        avatar: "",
        motherTongue: "en",
        learningTargetLang: "zh-CN",
        role: "mate",
        name: "alpha",
      },
      {
        id: "profile-beta",
        app,
        account: session.identity.accountId,
        userName: "beta_user",
        nickName: "Beta",
        avatar: "",
        motherTongue: "en",
        learningTargetLang: "zh-CN",
        role: "mate",
        name: "beta",
      },
    ]

    vi.spyOn(AccountService, "session").mockResolvedValue(session)
    vi.spyOn(ProfileService, "getProfiles").mockImplementation(async (account) => {
      return account.app === app ? profiles : []
    })

    root = createRoot(container!)
    await act(async () => {
      root?.render(
        <AuthProviderV2
          app={app}
          authRoutes={["/"]}
          pathname="/"
          navigate={() => {}}
        >
          <SnapshotViewer />
        </AuthProviderV2>,
      )
    })

    await waitFor(() => {
      const text = container!.querySelector('[data-testid="snapshot"]')?.textContent
      expect(text).toContain('"profileId": "profile-alpha"')
      expect(text).toContain(`"accountId": "${session.identity.accountId}"`)
    })

    await act(async () => {
      AccountManagerV2.get(app).setSelectedProfile("profile-beta")
    })

    await waitFor(() => {
      const text = container!.querySelector('[data-testid="snapshot"]')?.textContent
      expect(text).toContain('"profileId": "profile-beta"')
    })

    expect(window.localStorage.getItem(`selected-profile-v2:${app}`)).toBe(
      JSON.stringify("profile-beta"),
    )
    expect(window.localStorage.getItem("selected-profile")).toBeNull()
    expect(window.localStorage.getItem("account-state")).toBeNull()
  })

  it("emits stateChange for selection updates and uses per-app selected profile keys", () => {
    const appA = "@pmate/app-a"
    const appB = "@pmate/app-b"
    const managerA = AccountManagerV2.get(appA)
    const managerB = AccountManagerV2.get(appB)

    let eventCount = 0
    const unsubscribe = managerA.on(AccountManagerEvent.StateChange, () => {
      eventCount += 1
    })

    managerA.setSelectedProfile("profile-a")
    managerB.setSelectedProfile("profile-b")
    managerA.clearSelectedProfile()
    unsubscribe()

    expect(eventCount).toBe(2)
    expect(window.localStorage.getItem(`selected-profile-v2:${appA}`)).toBeNull()
    expect(window.localStorage.getItem(`selected-profile-v2:${appB}`)).toBe(
      JSON.stringify("profile-b"),
    )
  })

  it.skip("allows protected create-profile routes after token write", async () => {
    const app = "@pmate/cli"
    const session: AuthSession = {
      identity: {
        accountId:
          "0x9673ff2fbbf4403739db1c02d7941c3b2e70bfc1e0fe67df5a9f5d7502a79991",
      },
      issuedAt: "2026-03-03T00:00:00.000Z",
      expiresAt: "2026-03-03T23:59:59.000Z",
    }

    vi.spyOn(AccountService, "session").mockImplementation(async (_token, nextApp) => {
      const storedToken = window.localStorage.getItem(
        `pmate-auth-token:${nextApp}`,
      )
      return storedToken ? session : null
    })
    vi.spyOn(ProfileService, "getProfiles").mockResolvedValue([])
    AccountManagerV2.get(app).setAuthToken("fresh-token")

    root = createRoot(container!)
    await act(async () => {
      root?.render(
        <AuthProviderV2
          app={app}
          authRoutes={["/create-profile"]}
          pathname="/create-profile"
          navigate={() => {}}
        >
          <div data-testid="protected-child">protected</div>
        </AuthProviderV2>,
      )
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(container!.textContent).toContain("protected")
      expect(container!.textContent).not.toContain(
        "You need login to continue ?",
      )
    })
  })

  it("waits for the created profile to become visible before finishing profile creation", async () => {
    const app = "@felix/erp-homepage"
    const accountId =
      "0x86c65e16a1b3b8982d1f4d7e7721849dd55f4ef1880fed897cccb2a770095258"
    const session: AuthSession = {
      identity: { accountId },
      issuedAt: "2026-04-05T00:00:00.000Z",
      expiresAt: "2026-04-19T00:00:00.000Z",
    }
    const createdProfile: Profile = {
      id: "profile-created",
      app,
      account: accountId,
      userName: "created_user",
      nickName: "Created",
      avatar: "",
      motherTongue: "zh-CN",
      learningTargetLang: "en",
      role: "practitioner",
      name: "created",
    }

    vi.spyOn(AccountService, "session").mockResolvedValue(session)
    vi.spyOn(ProfileService, "createProfile").mockResolvedValue(createdProfile)
    vi.spyOn(globalThis, "setTimeout").mockImplementation(((callback) => {
      if (typeof callback === "function") {
        callback()
      }
      return 0 as ReturnType<typeof setTimeout>
    }) as typeof setTimeout)
    const getProfilesSpy = vi
      .spyOn(ProfileService, "getProfiles")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([createdProfile])

    const manager = AccountManagerV2.get(app)
    manager.setAuthToken("fresh-token")

    const profile = await manager.createProfile({ nickName: "Created" })

    expect(profile.id).toBe("profile-created")
    expect(getProfilesSpy.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(window.localStorage.getItem(`selected-profile-v2:${app}`)).toBe(
      JSON.stringify("profile-created"),
    )
  })
})
