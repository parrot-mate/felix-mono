import type { ProductStatus } from "../types"

export function SearchFilterBarModule({
  query,
  category,
  status,
  categories,
  onQueryChange,
  onCategoryChange,
  onStatusChange,
}: {
  query: string
  category: string
  status: ProductStatus | "all"
  categories: string[]
  onQueryChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onStatusChange: (value: ProductStatus | "all") => void
}) {
  return (
    <section className="search-filter-module">
      <label className="search-stack" htmlFor="townhall-search">
        <span className="eyebrow">搜索</span>
        <input
          id="townhall-search"
          aria-label="搜索"
          placeholder="搜索产品、简介、负责人或标签"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>

      <div className="filter-row">
        <select aria-label="分类筛选" value={category} onChange={(event) => onCategoryChange(event.target.value)}>
          <option value="all">全部分类</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          aria-label="状态筛选"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as ProductStatus | "all")}
        >
          <option value="all">全部状态</option>
          <option value="active">启用中</option>
          <option value="beta">测试中</option>
          <option value="offline">已下线</option>
        </select>
      </div>
    </section>
  )
}
