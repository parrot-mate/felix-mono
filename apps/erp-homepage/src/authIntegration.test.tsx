import { render, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

describe("ERP homepage auth integration", () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unmock("./lib/authCompat")
    vi.unmock("./lib/navigationRepository")
  })

  it(
    "binds protected routes to the ERP auth app id",
    async () => {
    const authProviderSpy = vi.fn((props: { children: ReactNode }) => props.children)

    vi.doMock("./lib/authCompat", async () => {
      const actual = await vi.importActual<any>("./lib/authCompat")
      return {
        ...actual,
        AuthProviderV2: (props: { children: ReactNode }) => authProviderSpy(props),
      }
    })

    vi.doMock("./lib/navigationRepository", async () => {
      const actual = await vi.importActual<any>("./lib/navigationRepository")
      return {
        ...actual,
        getNavigationRepository: () => ({
          ...actual.mockNavigationRepository,
          list: vi.fn().mockResolvedValue([]),
        }),
      }
    })

    window.history.replaceState({}, "", "/")

    const { App } = await import("./App")
    render(<App />)

    await waitFor(() => {
      expect(authProviderSpy).toHaveBeenCalledTimes(1)
    })
    expect(authProviderSpy.mock.calls[0]?.[0]).toMatchObject({
      app: "felix:erp-homepage",
      authRoutes: [
        { path: "/", behavior: "redirect" },
        { path: "/admin", behavior: "redirect" },
      ],
    })
    },
    15000,
  )
})
