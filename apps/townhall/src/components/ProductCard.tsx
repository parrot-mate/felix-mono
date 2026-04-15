import type { ProductRecord } from "../types"

export function ProductCard({
  product,
  selected,
  onSelect,
}: {
  product: ProductRecord
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      className={`product-card${selected ? " product-card--selected" : ""}`}
      onClick={() => onSelect(product.id)}
    >
      <div className="product-card__head">
        <div>
          <span className="status-pill status-pill--small">{product.status}</span>
          <h3>{product.name}</h3>
        </div>
        <span className="chip">{product.category}</span>
      </div>
      <p>{product.summary}</p>
      <div className="product-card__meta">
        <span>{product.owner}</span>
        <span>{product.team ?? "未知团队"}</span>
      </div>
      <div className="product-card__tags">
        {product.tags.map((tag) => (
          <span key={tag} className="tag-pill">
            {tag}
          </span>
        ))}
      </div>
    </button>
  )
}
