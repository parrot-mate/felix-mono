import { ProductSidePanel } from "../components/ProductSidePanel"
import { ProductGridModule } from "../modules/ProductGridModule"
import { SearchFilterBarModule } from "../modules/SearchFilterBarModule"
import type { ProductRecord, ProductStatus } from "../types"

export function PortalHomePage({
  categories,
  filteredProducts,
  selectedProduct,
  query,
  category,
  status,
  onSelectProduct,
  onQueryChange,
  onCategoryChange,
  onStatusChange,
  onManageView,
}: {
  categories: string[]
  filteredProducts: ProductRecord[]
  selectedProduct: ProductRecord | null
  query: string
  category: string
  status: ProductStatus | "all"
  onSelectProduct: (id: string) => void
  onQueryChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onStatusChange: (value: ProductStatus | "all") => void
  onManageView: () => void
}) {
  return (
    <main className="townhall-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">统一产品门户</p>
          <h1>TownHall</h1>
          <p>
            统一收拢内部产品入口、产品说明与负责人信息，让员工在一个地方完成发现、理解和跳转。
          </p>
        </div>
        <div className="hero-actions">
          <button type="button" className="primary-action" onClick={onManageView}>
            进入管理
          </button>
          <p>保留既有登录链路和存储能力，同时重建更清晰的门户体验。</p>
        </div>
      </section>

      <SearchFilterBarModule
        query={query}
        category={category}
        status={status}
        categories={categories}
        onQueryChange={onQueryChange}
        onCategoryChange={onCategoryChange}
        onStatusChange={onStatusChange}
      />

      <section className="layout-grid">
        <ProductGridModule
          products={filteredProducts}
          selectedProductId={selectedProduct?.id ?? null}
          onSelect={onSelectProduct}
        />
        <ProductSidePanel product={selectedProduct} />
      </section>
    </main>
  )
}
