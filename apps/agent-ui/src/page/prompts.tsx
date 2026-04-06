import { promptKeysAtom } from "@/atom/remotePromptsAtom"
import { PromptList } from "@/component/PromptList"
import { PromptEditor } from "@/component/PromptEditor"
import {
  Badge,
  Button,
  Card,
  Empty,
  Input,
  Progress,
  Segmented,
  Spin,
  Statistic,
  Typography,
} from "antd"
import { PlusOutlined, ThunderboltOutlined } from "@ant-design/icons"
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

  const handlePromptDeleted = useCallback(
    (_deletedKey: string) => {
      setPendingSelectedKey(undefined)
      const next = new URLSearchParams(searchParams)
      next.delete("key")
      if (next.toString() !== searchParams.toString()) {
        setSearchParams(next, { replace: true })
      }
    },
    [searchParams, setPendingSelectedKey, setSearchParams]
  )

  const handleNavigateToAddPrompt = useCallback(() => {
    navigate("/prompt/add")
  }, [navigate])

  const totalPrompts = keys.length
  const coverageScore = Math.min(100, Math.round(totalPrompts * 6.5 + 28))
  const libraryHealth = Math.min(100, Math.round(totalPrompts * 4.2 + 35))

  return (
    <div className="space-y-6">
      <Card className="agent-panel">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-[var(--ui-text-muted)]">
              <ThunderboltOutlined />
              command brief
            </div>
            <Typography.Title level={2} className="!mb-0">
              Prompt Operations Hub
            </Typography.Title>
            <Typography.Text className="text-[var(--ui-text-muted)]">
              Curate prompt libraries, monitor versions, and deploy instantly.
            </Typography.Text>
          </div>
          <Segmented
            options={["All", "Pinned", "Recent"]}
            className="agent-segment"
          />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="agent-metric">
            <Statistic title="Total Prompts" value={totalPrompts} />
            <Progress
              percent={coverageScore}
              showInfo={false}
              strokeColor="var(--ui-accent)"
            />
          </div>
          <div className="agent-metric">
            <Statistic title="Library Health" value={`${libraryHealth}%`} />
            <Progress
              percent={libraryHealth}
              showInfo={false}
              strokeColor="var(--ui-accent-2)"
            />
          </div>
          <div className="agent-metric">
            <Statistic title="Active Streams" value={18} />
            <Progress
              percent={72}
              showInfo={false}
              strokeColor="var(--ui-accent-3)"
            />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Suspense
        fallback={
          <Card className="agent-panel">
            <div className="flex h-[420px] items-center justify-center">
              <Spin />
            </div>
          </Card>
        }
      >
        <div className="flex flex-col gap-4">
          <Card
            className="agent-panel"
            bodyStyle={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Typography.Title level={4} className="!mb-0">
                  Prompt Index
                </Typography.Title>
                <Typography.Text className="text-[var(--ui-text-muted)]">
                  Search and organize prompt collections.
                </Typography.Text>
              </div>
              <Badge count={filteredKeys.length} showZero color="var(--ui-accent)" />
            </div>
            <div className="flex items-center gap-2">
              <Input.Search
                placeholder="Search prompts"
                allowClear
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleNavigateToAddPrompt}
              >
                New
              </Button>
            </div>
          </Card>
          <div className="flex-1">
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
        </div>
      </Suspense>

      {selectedKey ? (
        <PromptEditor
          promptKey={selectedKey}
          onPromptKeyChanged={handlePromptKeyChanged}
          onPromptDeleted={handlePromptDeleted}
        />
      ) : (
        <Card className="agent-panel">
          <div className="flex h-[420px] items-center justify-center">
            <Empty description="Select a prompt to begin." />
          </div>
        </Card>
      )}
      </div>
    </div>
  )
}
