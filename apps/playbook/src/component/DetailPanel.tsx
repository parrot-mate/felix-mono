import { getRelatedNodes, type PlaybookNode } from "../data/playbook"

type DetailPanelProps = {
  node: PlaybookNode
  onSelectRelatedNode: (nodeId: string) => void
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="detail-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export function DetailPanel({ node, onSelectRelatedNode }: DetailPanelProps) {
  const relatedNodes = getRelatedNodes(node)

  return (
    <article className="detail-panel" aria-label="Detail panel">
      <header className="detail-header">
        <div>
          <p className="eyebrow">Module detail</p>
          <h2>{node.title}</h2>
          <p className="detail-summary">{node.summary}</p>
        </div>
        <div className={`status-pill status-pill-${node.status}`}>
          <span className="status-dot" />
          {node.status === "ready" ? "Ready" : "Partial"}
        </div>
      </header>

      <section className="detail-lead">
        <div className="detail-card detail-card-accent">
          <h3>What this module is for</h3>
          <p>{node.definition}</p>
        </div>
        <div className="detail-card">
          <h3>Why you would use it</h3>
          <p>{node.problemSolved}</p>
        </div>
      </section>

      <section className="detail-grid">
        <div className="detail-card">
          <h3>Recommended entry</h3>
          <p>{node.recommendedEntry}</p>
        </div>
        <div className="detail-card">
          <h3>Primary repo</h3>
          <p className="mono-text">{node.repo}</p>
        </div>
      </section>

      <section className="detail-grid">
        <div className="detail-card">
          <h3>Use it when</h3>
          <BulletList items={node.useCases} />
        </div>
        <div className="detail-card">
          <h3>Next steps</h3>
          <BulletList items={node.nextSteps} />
        </div>
      </section>

      <section className="detail-card">
        <h3>Repo paths</h3>
        <ul className="path-list">
          {node.paths.map((path) => (
            <li key={path}>
              <code>{path}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="detail-card">
        <h3>Keywords</h3>
        <div className="chip-row">
          {node.tags.map((tag) => (
            <span key={tag} className="chip">
              {tag}
            </span>
          ))}
        </div>
      </section>

      {node.statusNote ? (
        <section className="detail-card detail-card-warning">
          <h3>Coverage note</h3>
          <p>{node.statusNote}</p>
        </section>
      ) : null}

      <section className="detail-card">
        <div className="detail-section-head">
          <div>
            <p className="eyebrow">Related</p>
            <h3>Related modules</h3>
          </div>
        </div>
        <div className="related-grid">
          {relatedNodes.map((relatedNode) => (
            <button
              key={relatedNode.id}
              type="button"
              className="related-card"
              onClick={() => onSelectRelatedNode(relatedNode.id)}
            >
              <strong>{relatedNode.title}</strong>
              <span>{relatedNode.summary}</span>
            </button>
          ))}
        </div>
      </section>
    </article>
  )
}
