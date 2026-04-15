import type { ProductRecord } from "../types"

export function ProductSidePanel({
  product,
}: {
  product: ProductRecord | null
}) {
  if (!product) {
    return (
      <aside className="side-panel side-panel--empty" aria-label="产品详情面板">
        <h2>选择一个产品</h2>
        <p>点击卡片后，这里会显示产品说明、负责人、入口和文档信息。</p>
      </aside>
    )
  }

  return (
    <aside className="side-panel" aria-label="产品详情面板">
      <div className="side-panel__header">
        <div>
          <p className="eyebrow">当前产品</p>
          <h2>{product.name}</h2>
        </div>
        <span className="status-pill">{product.status}</span>
      </div>

      <p className="side-panel__summary">{product.summary}</p>

      <dl className="meta-grid">
        <div>
          <dt>负责人</dt>
          <dd>{product.owner}</dd>
        </div>
        <div>
          <dt>团队</dt>
          <dd>{product.team ?? "未知"}</dd>
        </div>
        <div>
          <dt>分类</dt>
          <dd>{product.category}</dd>
        </div>
        <div>
          <dt>更新时间</dt>
          <dd>{new Date(product.updatedAt).toLocaleDateString("zh-CN")}</dd>
        </div>
      </dl>

      <div className="side-panel__tags">
        {product.tags.map((tag) => (
          <span key={tag} className="tag-pill">
            {tag}
          </span>
        ))}
      </div>

      <div className="side-panel__actions">
        <a
          className="primary-action"
          href={product.entryUrl}
          target={product.openMode === "new-tab" ? "_blank" : "_self"}
          rel={product.openMode === "new-tab" ? "noreferrer" : undefined}
        >
          打开产品
        </a>
        {product.docUrl ? (
          <a className="secondary-action" href={product.docUrl} target="_blank" rel="noreferrer">
            查看文档
          </a>
        ) : null}
      </div>
    </aside>
  )
}
