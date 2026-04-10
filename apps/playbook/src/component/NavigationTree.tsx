import { type PlaybookCategory, type PlaybookNode } from "../data/playbook"

type NavigationTreeProps = {
  categories: PlaybookCategory[]
  nodesByCategory: Map<string, PlaybookNode[]>
  expandedCategoryIds: Set<string>
  selectedNodeId: string
  onToggleCategory: (categoryId: string) => void
  onSelectNode: (nodeId: string) => void
}

export function NavigationTree({
  categories,
  nodesByCategory,
  expandedCategoryIds,
  selectedNodeId,
  onToggleCategory,
  onSelectNode,
}: NavigationTreeProps) {
  return (
    <div className="nav-shell" aria-label="Playbook navigation">
      {categories.map((category) => {
        const isExpanded = expandedCategoryIds.has(category.id)
        const categoryNodes = nodesByCategory.get(category.id) ?? []

        return (
          <section key={category.id} className="nav-section">
            <button
              type="button"
              className="nav-section-button"
              aria-expanded={isExpanded}
              onClick={() => onToggleCategory(category.id)}
            >
              <span className="nav-section-copy">
                <strong>{category.title}</strong>
                <small>{category.description}</small>
              </span>
              <span className="nav-chevron">{isExpanded ? "−" : "+"}</span>
            </button>

            {isExpanded ? (
              <div className="nav-items">
                {categoryNodes.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    className={`nav-item${node.id === selectedNodeId ? " nav-item-active" : ""}`}
                    onClick={() => onSelectNode(node.id)}
                  >
                    <span className="nav-item-topline">
                      <strong>{node.title}</strong>
                      <span className={`node-status node-status-${node.status}`}>{node.status}</span>
                    </span>
                    <span className="nav-item-summary">{node.summary}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
