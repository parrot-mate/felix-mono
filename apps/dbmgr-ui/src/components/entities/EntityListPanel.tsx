import type { ReactNode } from 'react'
import { Alert, Button, Empty, List, Skeleton, Space, Typography } from 'antd'
import type { CategorizedEntity } from '../../hooks/useEntities'

interface EntityListPanelProps {
  entities: CategorizedEntity[]
  loading: boolean
  error: string | null
  onReload: () => void
  subtitle?: string
  controls?: ReactNode
}

const { Title, Text } = Typography

export function EntityListPanel({
  entities,
  loading,
  error,
  onReload,
  subtitle,
  controls,
}: EntityListPanelProps) {
  const showEmpty = !loading && entities.length === 0 && !error
  const subtitleText =
    subtitle ?? 'Review all indexed entities with their latest attributes.'

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800/70 bg-slate-900/80 p-4">
      <Space direction="vertical" size={0}>
        <Title level={4} className="!mb-0 text-slate-100">
          Entities
        </Title>
        <Text className="text-sm text-slate-400">{subtitleText}</Text>
      </Space>
      {controls ? (
        <div className="rounded-lg border border-slate-800/60 bg-slate-950/30 p-2">{controls}</div>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        {error ? <Alert type="error" message={error} showIcon /> : <span />}
        <Button size="small" onClick={onReload} disabled={loading}>
          Refresh
        </Button>
      </div>
      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : showEmpty ? (
        <Empty description="No entities available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          size="small"
          dataSource={entities}
          className="max-h-[70vh] overflow-y-auto"
          rowKey={(entity) => entity.id}
          renderItem={(entity) => {
            const { entityType, ...raw } = entity
            return (
              <List.Item className="flex flex-col gap-1 rounded-lg border border-slate-800/50 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Text className="font-mono text-sm text-slate-200">{entity.id}</Text>
                  <Text className="text-xs uppercase tracking-widest text-slate-400">
                    {entityType}
                  </Text>
                </div>
                <pre className="w-full overflow-x-auto rounded bg-slate-950/70 p-2 text-xs text-slate-300">
                  {JSON.stringify(raw, null, 2)}
                </pre>
              </List.Item>
            )
          }}
        />
      )}
    </div>
  )
}
