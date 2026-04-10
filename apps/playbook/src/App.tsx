import { startTransition, useDeferredValue, useMemo, useState } from "react"
import { DetailPanel } from "./component/DetailPanel"
import { NavigationTree } from "./component/NavigationTree"
import { WorkspaceTree } from "./component/WorkspaceTree"
import { categories, getNode, nodes, workspaceTree } from "./data/playbook"
import { searchNodes } from "./util/search"

const DEFAULT_NODE_ID = "pmate-mono"
const DEFAULT_EXPANDED_CATEGORY_IDS = new Set(categories.map((category) => category.id))

export function App() {
  const [query, setQuery] = useState("")
  const [selectedNodeId, setSelectedNodeId] = useState(DEFAULT_NODE_ID)
  const [expandedCategoryIds, setExpandedCategoryIds] = useState(DEFAULT_EXPANDED_CATEGORY_IDS)
  const deferredQuery = useDeferredValue(query)

  const filteredNodes = useMemo(() => searchNodes(nodes, deferredQuery), [deferredQuery])
  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((node) => node.id)), [filteredNodes])

  const nodesByCategory = useMemo(() => {
    return new Map(
      categories.map((category) => [
        category.id,
        category.nodeIds.flatMap((nodeId) => {
          const node = getNode(nodeId)
          return node && filteredNodeIds.has(nodeId) ? [node] : []
        }),
      ]),
    )
  }, [filteredNodeIds])

  const selectedNode = getNode(selectedNodeId) ?? nodes[0]
  const hasResults = filteredNodes.length > 0

  function handleToggleCategory(categoryId: string) {
    setExpandedCategoryIds((current) => {
      const next = new Set(current)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  function handleSelectNode(nodeId: string) {
    setSelectedNodeId(nodeId)
  }

  function handleQueryChange(nextQuery: string) {
    startTransition(() => {
      setQuery(nextQuery)
    })
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Module Playbook</p>
          <h1>PMate Playbook</h1>
          <p className="hero-summary">
            在真正改代码之前，先快速理解 `pmate` 工作区里各个核心模块是做什么的、应该从哪里进入，以及哪些仓库更适合作为下一步开发入口。
          </p>
        </div>

        <div className="hero-metrics">
          <div className="hero-metric">
            <span className="metric-label">Core nodes</span>
            <strong>{nodes.length}</strong>
          </div>
          <div className="hero-metric">
            <span className="metric-label">Themes</span>
            <strong>{categories.length}</strong>
          </div>
          <p>
            先解决“这个模块是做什么的、我该不该从这里开始”，再进入更深的实现与部署链路。
          </p>
        </div>
      </section>

      <section className="layout-shell">
        <aside className="sidebar">
          <WorkspaceTree root={workspaceTree} selectedNodeId={selectedNode.id} onSelectNode={handleSelectNode} />

          <section className="search-card">
            <div className="section-head">
              <p className="eyebrow">Search</p>
              <h2>Find a module fast</h2>
              <p>支持模块名、repo 路径、用途、标签和推荐入口的轻量检索。</p>
            </div>

            <label className="search-label" htmlFor="playbook-search">
              Search
            </label>
            <input
              id="playbook-search"
              aria-label="Search"
              className="search-input"
              placeholder="Search module, repo, or use case"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
            />

            <div className="search-state" aria-live="polite">
              {query ? (hasResults ? `${filteredNodes.length} matching modules` : "No matching modules") : "Browse by module list or search by repo / use case."}
            </div>

            {hasResults ? (
              <NavigationTree
                categories={categories}
                nodesByCategory={nodesByCategory}
                expandedCategoryIds={expandedCategoryIds}
                selectedNodeId={selectedNode.id}
                onToggleCategory={handleToggleCategory}
                onSelectNode={handleSelectNode}
              />
            ) : (
              <div className="empty-state" role="status">
                <h2>No matching modules</h2>
                <p>Try another keyword, or clear search and continue from the module list.</p>
              </div>
            )}
          </section>
        </aside>

        <section className="content">
          <div className="content-head">
            <div>
              <p className="eyebrow">Selected module</p>
              <h2>{selectedNode.title}</h2>
            </div>
            <button type="button" className="clear-button" onClick={() => handleQueryChange("")}>
              Clear search
            </button>
          </div>

          <DetailPanel node={selectedNode} onSelectRelatedNode={handleSelectNode} />
        </section>
      </section>
    </main>
  )
}
