import React, { useState, useCallback, useEffect, useMemo } from "react"

type PromiseFunc<T> = () => Promise<T>

export function createResource<T>(fetch: () => Promise<T>) {
  let status = "pending"
  let result: T
  let suspender = fetch().then(
    (r) => {
      status = "success"
      result = r
    },
    (e) => {
      status = "error"
      result = e
    }
  )

  return {
    read() {
      if (status === "pending") {
        throw suspender
      } else if (status === "error") {
        throw result
      } else if (status === "success") {
        return result
      }
    },
  }
}

export const usePendingValueAsync = <T>(initial: PromiseFunc<T>) => {
  const resource = useMemo(() => createResource(initial), [])
  return resource.read()
}
