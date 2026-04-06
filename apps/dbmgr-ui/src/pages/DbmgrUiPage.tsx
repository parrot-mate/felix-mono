import { Alert, Layout, Space, Typography } from 'antd'
import { useMemo } from 'react'
import { chainId } from '../api/topicIndexer'
import { LogFilter } from '../components/logs/LogFilter'
import { LogList } from '../components/logs/LogList'
import { HeaderBar } from '../components/layout/HeaderBar'
import { TopicMenu } from '../components/topics/TopicMenu'
import { useLogs } from '../hooks/useLogs'
import { useTopics } from '../hooks/useTopics'

const { Sider, Content } = Layout
const { Title, Text } = Typography

export function DbmgrUiPage() {
  const { topics, topicsLoading, topicError, selectedTopic, setSelectedTopic } = useTopics()
  const {
    logs,
    logsLoading,
    logsError,
    logsHasMore,
    loadMore,
    filter,
    setFilter,
    isInitialLoading,
  } = useLogs(selectedTopic)

  const sortedLogs = useMemo(
    () =>
      [...logs].sort((a, b) => {
        const timeA = typeof a.time === 'number' ? a.time : Number.NEGATIVE_INFINITY
        const timeB = typeof b.time === 'number' ? b.time : Number.NEGATIVE_INFINITY
        return timeB - timeA
      }),
    [logs],
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <HeaderBar chainId={chainId} />
      <Layout>
        <Sider width={260} className="border-r border-slate-800/60 bg-slate-950/80 px-2 py-4" breakpoint="lg">
          <TopicMenu
            topics={topics}
            loading={topicsLoading}
            error={topicError}
            selectedTopic={selectedTopic}
            onSelect={setSelectedTopic}
          />
        </Sider>
        <Layout>
          <Content className="flex flex-col gap-4 bg-slate-950 px-6 py-6">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-800/70 bg-slate-900/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Space direction="vertical" size={0}>
                  <Title level={4} className="!mb-0 text-slate-100">
                    {selectedTopic ?? 'Select a topic'}
                  </Title>
                  <Text className="text-sm text-slate-400">
                    Browse indexed logs and infinite-scroll through history.
                  </Text>
                </Space>
                <LogFilter value={filter} onChange={setFilter} disabled={!selectedTopic} />
              </div>
              {logsError ? <Alert type="error" message={logsError} showIcon /> : null}
            </div>

            <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
              <LogList
                topic={selectedTopic}
                items={sortedLogs}
                loading={logsLoading && logs.length > 0}
                isInitialLoading={isInitialLoading}
                error={logsError}
                hasMore={Boolean(selectedTopic) && logsHasMore}
                onLoadMore={loadMore}
              />
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}
