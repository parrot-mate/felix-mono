import { ProductCard } from "../components/ProductCard"
import type { ProductRecord } from "../types"

export function ProductGridModule({
  products,
  selectedProductId,
  onSelect,
}: {
  products: ProductRecord[]
  selectedProductId: string | null
  onSelect: (id: string) => void
}) {
  if (products.length === 0) {
    return (
      <section className="empty-card" role="status">
        <h2>没有找到匹配产品</h2>
        <p>可以换个关键词，或者切换分类后再试。</p>
      </section>
    )
  }

  return (
    <section className="grid-shell">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          selected={product.id === selectedProductId}
          onSelect={onSelect}
        />
      ))}
    </section>
  )
}
