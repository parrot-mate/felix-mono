import { PlayCircleOutlined } from "@ant-design/icons"
import { Badge, Card, Empty, Tree, Typography } from "antd"
import type { DataNode, EventDataNode } from "antd/es/tree"
import type { Key } from "react"
import { useMemo } from "react"
import { Link } from "react-router-dom"

const { Title } = Typography

type PromptTreeNode = {
  name: string
  path: string
  fullKey?: string
  children: PromptTreeNode[]
}

const highlightText = (text: string, term: string) => {
  if (!term) {
    return text
  }
  const index = text.toLowerCase().indexOf(term.toLowerCase())
  if (index === -1) {
    return text
  }
  const before = text.slice(0, index)
  const match = text.slice(index, index + term.length)
  const after = text.slice(index + term.length)
  return (
    <span>
      {before}
      <span className="rounded bg-[rgba(255,107,53,0.25)] px-1 text-xs font-medium text-[var(--ui-text)]">
        {match}
      </span>
      {after}
    </span>
  )
}

const buildPromptTree = (keys: string[]): PromptTreeNode[] => {
  type InternalNode = {
    name: string
    path: string
    fullKey?: string
    children: Map<string, InternalNode>
    isLeaf: boolean
  }

  const root = new Map<string, InternalNode>()

  keys.forEach((key) => {
    const segments = key.split("/")
    const pathSegments: string[] = []
    let currentLevel = root

    segments.forEach((segment, index) => {
      pathSegments.push(segment)
      const path = pathSegments.join("/")
      let node = currentLevel.get(segment)
      if (!node) {
        node = {
          name: segment,
          path,
          children: new Map<string, InternalNode>(),
          isLeaf: false,
        }
        currentLevel.set(segment, node)
      }
      if (index === segments.length - 1) {
        node.isLeaf = true
        node.fullKey = key
      }
      currentLevel = node.children
    })
  })

  const convert = (nodes: Map<string, InternalNode>): PromptTreeNode[] => {
    return Array.from(nodes.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((node) => ({
        name: node.name,
        path: node.path,
        fullKey: node.fullKey,
        children: convert(node.children),
      }))
  }

  return convert(root)
}

const encodePromptKey = (key: string) =>
  key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")

const renderTitle = (node: PromptTreeNode, searchTerm: string) => {
  const highlighted = highlightText(node.name, searchTerm)
  if (!node.fullKey) {
    return highlighted
  }

  const runHref = `/prompt/run?key=${encodePromptKey(node.fullKey)}`
  return (
    <div className="flex items-center gap-1">
      <span className="flex-1 truncate text-left">{highlighted}</span>
      <Link
        to={runHref}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => {
          event.stopPropagation()
        }}
        className="flex items-center justify-center rounded-full p-1 text-[var(--ui-accent-2)] transition-colors hover:bg-[rgba(47,90,255,0.12)]"
        title="Run prompt"
      >
        <PlayCircleOutlined className="text-base" />
      </Link>
    </div>
  )
}

const mapTreeToDataNodes = (
  nodes: PromptTreeNode[],
  searchTerm: string
): DataNode[] => {
  return nodes.map((node) => {
    const children = node.children.length
      ? mapTreeToDataNodes(node.children, searchTerm)
      : undefined
    const displayTitle = renderTitle(node, searchTerm)
    return {
      title: displayTitle,
      key: node.fullKey ?? node.path,
      selectable: Boolean(node.fullKey),
      isLeaf: !children || children.length === 0,
      children,
    }
  })
}

export type PromptListProps = {
  keys: string[]
  selectedKey?: string
  onSelect: (key: string) => void
  searchTerm: string
  expandedKeys: string[]
  onExpand: (keys: string[]) => void
  autoExpandParent: boolean
}

export const PromptList = ({
  keys,
  selectedKey,
  onSelect,
  searchTerm,
  expandedKeys,
  onExpand,
  autoExpandParent,
}: PromptListProps) => {
  const treeNodes = useMemo(() => buildPromptTree(keys), [keys])
  const treeData = useMemo(
    () => mapTreeToDataNodes(treeNodes, searchTerm),
    [treeNodes, searchTerm]
  )

  if (keys.length === 0) {
    return (
      <Card
        className="agent-panel h-full"
        title={<Title level={5} className="!mb-0">Prompts</Title>}
      >
        <Empty description="No prompts found" />
      </Card>
    )
  }

  const handleSelect = (
    _selectedKeys: Key[],
    info: {
      selected: boolean
      node: EventDataNode<DataNode>
    }
  ) => {
    if (info.node.selectable && typeof info.node.key === "string") {
      onSelect(info.node.key)
    }
  }

  return (
    <Card
      className="agent-panel flex h-full flex-col"
      title={
        <div className="flex items-center gap-2">
          <Title level={5} className="!mb-0">Prompts</Title>
          <Badge count={keys.length} showZero color="var(--ui-accent)" />
        </div>
      }
      bodyStyle={{ display: "flex", flex: 1, flexDirection: "column" }}
    >
      <div className="flex-1 overflow-y-auto">
        <Tree
          showLine
          blockNode
          treeData={treeData}
          expandedKeys={expandedKeys}
          autoExpandParent={autoExpandParent}
          onExpand={(keys) => onExpand(keys as string[])}
          selectedKeys={selectedKey ? [selectedKey] : []}
          onSelect={handleSelect}
          className="agent-tree"
        />
      </div>
    </Card>
  )
}
