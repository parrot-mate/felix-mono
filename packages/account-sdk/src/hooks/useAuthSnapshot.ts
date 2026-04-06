import { useEffect, useState } from "react"
import type { AccountSnapshot, AuthBehaviors } from "../types/account.types"
import { AccountLifecycleState } from "../types/account.types"
import { AccountManagerEvent, AccountManagerV2 } from "../utils/AccountManagerV2"

const checkAuth = async ({
  app,
  behaviors,
}: {
  app: string
  behaviors: AuthBehaviors
}): Promise<AccountSnapshot> => {
  const manager = AccountManagerV2.get(app)
  if (behaviors.requiresAuth === false) {
    return manager.getSnapshot()
  }

  try {
    const account = await manager.loginUrlSessionOverride()
    if (account) {
      const profiles = await manager.getProfiles()
      if (profiles.length > 0) {
        manager.setSelectedProfile(profiles[0].id)
      }
    }
    return manager.getSnapshot()
  } catch (error) {
    console.error(error)
    return manager.getSnapshot()
  }
}

export const useAuthSnapshot = ({
  app,
  behaviors,
}: {
  app: string
  behaviors: AuthBehaviors
}) => {
  const [loading, setLoading] = useState(true)
  const [snapshot, setSnapshot] = useState<AccountSnapshot>({
    state: AccountLifecycleState.Idle,
    profiles: [],
    profile: null,
    accountId: null,
    account: null,
    error: null,
  })

  useEffect(() => {
    let isActive = true
    const manager = AccountManagerV2.get(app)

    const refreshSnapshot = async () => {
      const next = await manager.getSnapshot()
      if (!isActive) {
        return
      }
      setSnapshot(next)
    }

    const loadSnapshot = async () => {
      setLoading(true)
      const snap = await checkAuth({ app, behaviors })
      if (!isActive) {
        return
      }
      setSnapshot(snap)
      setLoading(false)
    }

    void loadSnapshot()
    const unsubscribe = manager.on(AccountManagerEvent.StateChange, () => {
      void refreshSnapshot()
    })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [app, behaviors.authBehavior, behaviors.requiresAuth])

  return { loading, snapshot }
}
