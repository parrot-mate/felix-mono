import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react"
import { ProductForm } from "./components/ProductForm"
import { PortalHomePage } from "./pages/PortalHomePage"
import { useTownhallAuth } from "./pmateAuth"
import { createProduct, deleteProduct, listProducts, loadUiState, saveUiState, updateProduct } from "./store/townhallStore"
import type { ProductFormInput, ProductRecord, TownhallUiState } from "./types"

const EMPTY_UI: TownhallUiState = {
  query: "",
  selectedProductId: null,
  category: "all",
  status: "all",
  view: "home",
}

export function App() {
  const { loading, login, snapshot, token } = useTownhallAuth()
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [uiState, setUiState] = useState<TownhallUiState>(EMPTY_UI)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const deferredQuery = useDeferredValue(uiState.query)

  useEffect(() => {
    void (async () => {
      try {
        const [initialProducts, storedUi] = await Promise.all([listProducts(), loadUiState()])
        setProducts(initialProducts)
        setUiState({
          ...storedUi,
          selectedProductId: storedUi.selectedProductId ?? initialProducts[0]?.id ?? null,
        })
        setLoadError("")
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "加载真实产品数据失败。")
      }
    })()
  }, [])

  useEffect(() => {
    if (!products.length) {
      return
    }
    void saveUiState(uiState)
  }, [uiState, products.length])

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  )

  const filteredProducts = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase()
    return products.filter((product) => {
      if (uiState.category !== "all" && product.category !== uiState.category) {
        return false
      }
      if (uiState.status !== "all" && product.status !== uiState.status) {
        return false
      }
      if (!query) {
        return true
      }
      return [product.name, product.summary, product.owner, product.team ?? "", product.category, ...product.tags]
        .join(" ")
        .toLowerCase()
        .includes(query)
    })
  }, [deferredQuery, products, uiState.category, uiState.status])

  const selectedProduct =
    filteredProducts.find((product) => product.id === uiState.selectedProductId) ??
    products.find((product) => product.id === uiState.selectedProductId) ??
    filteredProducts[0] ??
    products[0] ??
    null

  const editingProduct = editingProductId
    ? products.find((product) => product.id === editingProductId) ?? null
    : null

  function patchUiState(patch: Partial<TownhallUiState>) {
    setUiState((current) => ({ ...current, ...patch }))
  }

  function handleQueryChange(value: string) {
    startTransition(() => patchUiState({ query: value }))
  }

  function handleSelectProduct(id: string) {
    patchUiState({ selectedProductId: id })
  }

  async function refreshProducts(preferredSelectedProductId?: string | null) {
    const nextProducts = await listProducts()
    setProducts(nextProducts)
    patchUiState({
      selectedProductId: preferredSelectedProductId ?? nextProducts[0]?.id ?? null,
      view: "home",
    })
  }

  async function handleSubmitProduct(form: ProductFormInput) {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, form)
        await refreshProducts(editingProduct.id)
      } else {
        await createProduct(form)
        const nextProducts = await listProducts()
        const latest = nextProducts[0] ?? null
        setProducts(nextProducts)
        patchUiState({
          selectedProductId: latest?.id ?? null,
          view: "home",
        })
      }
      setEditingProductId(null)
      setSubmitError("")
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "写入真实产品数据失败。")
    }
  }

  async function handleDeleteProduct(id: string) {
    try {
      await deleteProduct(id)
      await refreshProducts()
      setSubmitError("")
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "删除真实产品数据失败。")
    }
  }

  if (loading && !token) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">恢复会话</p>
          <h1>TownHall</h1>
          <p>正在恢复登录态并载入统一产品门户。</p>
        </section>
      </main>
    )
  }

  if (!token) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">需要登录</p>
          <h1>登录 TownHall</h1>
          <p>TownHall 保留 `account-sdk` 登录链路，登录后才能访问产品目录与管理能力。</p>
          <button type="button" className="primary-action" onClick={login}>
            立即登录
          </button>
        </section>
      </main>
    )
  }

  return (
    <div className="app-frame">
      <header className="topbar">
        <div>
          <p className="eyebrow">产品目录</p>
          <strong>{snapshot.account?.accountName ?? "已登录用户"}</strong>
        </div>
        <nav className="topbar__actions" aria-label="主导航">
          <button
            type="button"
            className={uiState.view === "home" ? "tab-button tab-button--active" : "tab-button"}
            onClick={() => patchUiState({ view: "home" })}
          >
            门户
          </button>
          <button
            type="button"
            className={uiState.view === "manage" ? "tab-button tab-button--active" : "tab-button"}
            onClick={() => patchUiState({ view: "manage" })}
          >
            管理
          </button>
        </nav>
      </header>

      {uiState.view === "home" ? (
        <>
          {loadError ? (
            <main className="townhall-shell">
              <section className="empty-card" role="alert">
                <h2>真实数据加载失败</h2>
                <p>{loadError}</p>
              </section>
            </main>
          ) : (
            <PortalHomePage
              categories={categories}
              filteredProducts={filteredProducts}
              selectedProduct={selectedProduct}
              query={uiState.query}
              category={uiState.category}
              status={uiState.status}
              onSelectProduct={handleSelectProduct}
              onQueryChange={handleQueryChange}
              onCategoryChange={(value) => patchUiState({ category: value })}
              onStatusChange={(value) => patchUiState({ status: value })}
              onManageView={() => patchUiState({ view: "manage" })}
            />
          )}
        </>
      ) : (
        <main className="townhall-shell townhall-shell--manage">
          <section className="manage-list-card">
            <div className="manage-list-card__head">
              <div>
                <p className="eyebrow">产品记录</p>
                <h1>管理产品</h1>
              </div>
            </div>
            <ul className="manage-list">
              {products.map((product) => (
                <li key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.summary}</span>
                  </div>
                  <div className="manage-list__actions">
                    <button type="button" className="ghost-button" onClick={() => setEditingProductId(product.id)}>
                      编辑
                    </button>
                    <button type="button" className="ghost-button ghost-button--danger" onClick={() => void handleDeleteProduct(product.id)}>
                      删除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {submitError ? (
              <p className="form-error" role="alert">
                {submitError}
              </p>
            ) : null}
          </section>

          <ProductForm
            editingProduct={editingProduct}
            onCancel={() => setEditingProductId(null)}
            onSubmit={handleSubmitProduct}
          />
        </main>
      )}
    </div>
  )
}
