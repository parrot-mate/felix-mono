import { Layout, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import { useMemo, useState } from 'react'
import { chainId } from '../api/topicIndexer'
import { EntityListPanel } from '../components/entities/EntityListPanel'
import { HeaderBar } from '../components/layout/HeaderBar'
import { useEntities } from '../hooks/useEntities'
import type { CategorizedEntity } from '../hooks/useEntities'
import type { EntityType } from '../api/accountIndexer'

const { Content } = Layout
type TabKey = 'all' | EntityType

export function EntitiesPage() {
  const { entities, loading, error, reload } = useEntities()
  const [activeTab, setActiveTab] = useState<TabKey>('all')

  const tabItems = useMemo(() => buildTabItems(entities, loading, error, reload), [entities, loading, error, reload])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <HeaderBar chainId={chainId} />
      <Content className="flex flex-col gap-4 bg-slate-950 px-6 py-6">
        <Tabs
          destroyInactiveTabPane
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          items={tabItems}
        />
      </Content>
    </Layout>
  )
}

function buildTabItems(
  entities: CategorizedEntity[],
  loading: boolean,
  error: string | null,
  reload: () => void,
): TabsProps['items'] {
  const tabDefinitions: Array<{
    key: TabKey
    label: string
    filter: (entity: CategorizedEntity) => boolean
  }> = [
    { key: 'all', label: 'All Entities', filter: () => true },
    { key: 'group', label: 'Groups', filter: (entity) => entity.entityType === 'group' },
    { key: 'account', label: 'Accounts', filter: (entity) => entity.entityType === 'account' },
    { key: 'profile', label: 'Profiles', filter: (entity) => entity.entityType === 'profile' },
  ]

  return tabDefinitions.map(({ key, label, filter }) => {
    const scoped = entities.filter(filter)
    const descriptor = key === 'all' ? 'entities' : label.toLowerCase()
    return {
      key,
      label: `${label} (${scoped.length})`,
      children: (
        <EntityListPanel
          entities={scoped}
          loading={loading}
          error={error}
          onReload={reload}
          subtitle={`Showing ${scoped.length} ${descriptor}.`}
        />
      ),
    }
  })
}
