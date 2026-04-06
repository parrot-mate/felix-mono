import { promptKeysAtom } from "@/atom/remotePromptsAtom"
import { PromptList } from "@/component/PromptList"
import { PromptEditor } from "@/component/PromptEditor"
import { Empty, Input, Spin, Button } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import { useAtomValue } from "jotai"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

const getAncestorKeys = (key: string) => {
  const segments = key.split("/")
  const ancestors: string[] = []
  for (let i = 0; i < segments.length - 1; i++) {
    ancestors.push(segments.slice(0, i + 1).join("/"))
  }
  return ancestors
}

export const PromptsPage = () => {
  const keys = useAtomValue(promptKeysAtom)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [autoExpandParent, setAutoExpandParent] = useState(true)
  const [pendingSelectedKey, setPendingSelectedKey] = useState<
    string | undefined
  >(undefined)

  const urlKey = searchParams.get("key")
  const decodedUrlKey = useMemo(() => {
    if (!urlKey) {
      return undefined
    }
    try {
      return decodeURIComponent(urlKey)
    } catch {
      return undefined
    }
  }, [urlKey])
  const selectedKey = useMemo(() => {
    if (pendingSelectedKey) {
      return pendingSelectedKey
    }
    if (!decodedUrlKey) {
      return undefined
    }
    return keys.includes(decodedUrlKey) ? decodedUrlKey : undefined
  }, [decodedUrlKey, keys, pendingSelectedKey])

  useEffect(() => {
    if (!pendingSelectedKey) {
      return
    }
    if (keys.includes(pendingSelectedKey)) {
      setPendingSelectedKey(undefined)
    }
  }, [keys, pendingSelectedKey])

  useEffect(() => {
    if (keys.length === 0 || selectedKey || pendingSelectedKey) {
      return
    }
    const fallback = keys[0]
    const next = new URLSearchParams(searchParams)
    next.set("key", fallback)
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [keys, pendingSelectedKey, searchParams, selectedKey, setSearchParams])

  const filteredKeys = useMemo(() => {
    if (!searchTerm) {
      return keys
    }
    const term = searchTerm.toLowerCase()
    return keys.filter((key) => key.toLowerCase().includes(term))
  }, [keys, searchTerm])

  useEffect(() => {
    if (!searchTerm) {
      setAutoExpandParent(false)
      return
    }

    const ancestorSet = new Set<string>()
    filteredKeys.forEach((key) => {
      getAncestorKeys(key).forEach((ancestor) => ancestorSet.add(ancestor))
    })
    setExpandedKeys(Array.from(ancestorSet))
    setAutoExpandParent(true)
  }, [filteredKeys, searchTerm])

  useEffect(() => {
    if (!selectedKey) {
      return
    }
    const ancestors = getAncestorKeys(selectedKey)
    setExpandedKeys((prev) => {
      let changed = false
      const next = new Set(prev)
      ancestors.forEach((ancestor) => {
        if (!next.has(ancestor)) {
          next.add(ancestor)
          changed = true
        }
      })
      if (!changed) {
        return prev
      }
      return Array.from(next)
    })
  }, [selectedKey])

  const handleExpand = useCallback((keys: string[]) => {
    setExpandedKeys(keys)
    setAutoExpandParent(false)
  }, [])

  const handleSelect = useCallback(
    (key: string) => {
      const next = new URLSearchParams(searchParams)
      next.set("key", key)
      if (next.toString() !== searchParams.toString()) {
        setSearchParams(next)
      }
      setPendingSelectedKey(undefined)
    },
    [searchParams, setPendingSelectedKey, setSearchParams]
  )

  const handlePromptKeyChanged = useCallback(
    (nextKey: string) => {
      setPendingSelectedKey(nextKey)
      const next = new URLSearchParams(searchParams)
      next.set("key", nextKey)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setPendingSelectedKey, setSearchParams]
  )

  const handleNavigateToAddPrompt = useCallback(() => {
    navigate("/prompt/add")
  }, [navigate])

  return (
    <div className="grid h-[calc(100vh-180px)] grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center rounded-lg border border-slate-200 bg-white">
            <Spin />
          </div>
        }
      >
        <div className="flex h-full flex-col gap-3">
          <div className="flex items-center gap-2">
            <Input.Search
              placeholder="Search prompts"
              allowClear
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="flex-1 rounded-lg border border-slate-300"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleNavigateToAddPrompt}
            >
              New
            </Button>
          </div>
          <PromptList
            keys={filteredKeys}
            selectedKey={selectedKey}
            onSelect={handleSelect}
            searchTerm={searchTerm}
            expandedKeys={expandedKeys}
            onExpand={handleExpand}
            autoExpandParent={autoExpandParent}
          />
        </div>
      </Suspense>

      {selectedKey ? (
        <PromptEditor
          promptKey={selectedKey}
          onPromptKeyChanged={handlePromptKeyChanged}
        />
      ) : (
        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white">
          <Empty description="Select a prompt to begin." />
        </div>
      )}
    </div>
  )
}
