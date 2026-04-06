import type { ReactNode } from 'react'
import { Alert, Empty, Menu, Spin, Typography } from 'antd'
import type { MenuProps } from 'antd'

interface TopicMenuProps {
  topics: string[]
  loading: boolean
  error: string | null
  selectedTopic: string | null
  onSelect: (topic: string) => void
}

const { Text } = Typography

export function TopicMenu({ topics, loading, error, selectedTopic, onSelect }: TopicMenuProps) {
  let body: ReactNode = null

  if (error) {
    body = (
      <div className="px-4">
        <Alert type="error" message={error} showIcon />
      </div>
    )
  } else if (loading) {
    body = (
      <div className="flex h-full items-center justify-center">
        <Spin />
      </div>
    )
  } else if (topics.length === 0) {
    body = (
      <div className="px-4">
        <Empty description="No topics found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  } else {
    const items: MenuProps['items'] = topics.map((topic) => ({ key: topic, label: topic }))
    body = (
      <Menu
        mode="inline"
        className="border-none bg-transparent text-slate-100"
        items={items}
        selectedKeys={selectedTopic ? [selectedTopic] : []}
        onClick={({ key }) => onSelect(String(key))}
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 px-2">
        <Text className="text-xs uppercase tracking-[0.3em] text-slate-500">Topics</Text>
      </div>
      <div className="flex-1 overflow-y-auto">{body}</div>
    </div>
  )
}
