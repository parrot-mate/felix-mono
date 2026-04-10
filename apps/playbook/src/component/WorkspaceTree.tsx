import { type WorkspaceTreeNode } from "../data/playbook"

type WorkspaceTreeProps = {
  root: WorkspaceTreeNode
  selectedNodeId: string
  onSelectNode: (nodeId: string) => void
}

function TreeBranch({
  node,
  depth,
  selectedNodeId,
  onSelectNode,
}: {
  node: WorkspaceTreeNode
  depth: number
  selectedNodeId: string
  onSelectNode: (nodeId: string) => void
}) {
  const isActive = node.targetNodeId === selectedNodeId
  const isLinked = Boolean(node.targetNodeId)

  return (
    <li className="workspace-branch">
      {isLinked ? (
        <button
          type="button"
          className={`workspace-node workspace-node-link${isActive ? " workspace-node-active" : ""}`}
          style={{ paddingLeft: `${0.9 + depth * 0.95}rem` }}
          onClick={() => onSelectNode(node.targetNodeId!)}
        >
          <span className="workspace-node-label">{node.label}</span>
          <small>{node.note}</small>
        </button>
      ) : (
        <div className="workspace-node" style={{ paddingLeft: `${0.9 + depth * 0.95}rem` }}>
          <span className="workspace-node-label">{node.label}</span>
          <small>{node.note}</small>
        </div>
      )}

      {node.children?.length ? (
        <ul className="workspace-tree-list">
          {node.children.map((child) => (
            <TreeBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function WorkspaceTree({ root, selectedNodeId, onSelectNode }: WorkspaceTreeProps) {
  return (
    <section className="workspace-card" aria-label="Workspace tree">
      <div className="section-head">
        <p className="eyebrow">Modules</p>
        <h2>Browse the core `pmate` repos</h2>
        <p>左侧先给出稳定的模块目录，右侧再解释该模块的定位、用途和推荐入口。</p>
      </div>

      <ul className="workspace-tree-list">
        <TreeBranch node={root} depth={0} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} />
      </ul>
    </section>
  )
}
