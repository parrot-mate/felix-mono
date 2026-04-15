import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import type { ProductFormInput, ProductRecord } from "../types"

const EMPTY_FORM: ProductFormInput = {
  name: "",
  summary: "",
  owner: "",
  team: "",
  category: "",
  tags: "",
  status: "active",
  entryUrl: "",
  docUrl: "",
  icon: "",
  openMode: "same-tab",
}

export function ProductForm({
  editingProduct,
  onCancel,
  onSubmit,
}: {
  editingProduct: ProductRecord | null
  onCancel: () => void
  onSubmit: (form: ProductFormInput) => Promise<void> | void
}) {
  const [form, setForm] = useState<ProductFormInput>(EMPTY_FORM)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!editingProduct) {
      setForm(EMPTY_FORM)
      setError("")
      return
    }

    setForm({
      id: editingProduct.id,
      name: editingProduct.name,
      summary: editingProduct.summary,
      owner: editingProduct.owner,
      team: editingProduct.team ?? "",
      category: editingProduct.category,
      tags: editingProduct.tags.join(", "),
      status: editingProduct.status,
      entryUrl: editingProduct.entryUrl,
      docUrl: editingProduct.docUrl ?? "",
      icon: editingProduct.icon ?? "",
      openMode: editingProduct.openMode,
    })
    setError("")
  }, [editingProduct])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    await onSubmit(form)

    setForm(EMPTY_FORM)
    setError("")
  }

  function patch<K extends keyof ProductFormInput>(key: K, value: ProductFormInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <div className="form-head">
        <div>
          <p className="eyebrow">产品管理</p>
          <h2>{editingProduct ? `编辑 ${editingProduct.name}` : "新增产品"}</h2>
        </div>
        {editingProduct ? (
          <button type="button" className="ghost-button" onClick={onCancel}>
            取消
          </button>
        ) : null}
      </div>

      <div className="field-grid">
        <label>
          <span>名称</span>
          <input value={form.name} onChange={(event) => patch("name", event.target.value)} />
        </label>
        <label>
          <span>负责人</span>
          <input value={form.owner} onChange={(event) => patch("owner", event.target.value)} />
        </label>
        <label>
          <span>团队</span>
          <input value={form.team} onChange={(event) => patch("team", event.target.value)} />
        </label>
        <label>
          <span>分类</span>
          <input value={form.category} onChange={(event) => patch("category", event.target.value)} />
        </label>
        <label>
          <span>状态</span>
          <select value={form.status} onChange={(event) => patch("status", event.target.value as ProductRecord["status"])}>
            <option value="active">启用中</option>
            <option value="beta">测试中</option>
            <option value="offline">已下线</option>
          </select>
        </label>
        <label>
          <span>图标</span>
          <input value={form.icon} onChange={(event) => patch("icon", event.target.value)} placeholder="TH" />
        </label>
        <label>
          <span>打开方式</span>
          <select value={form.openMode} onChange={(event) => patch("openMode", event.target.value as ProductRecord["openMode"])}>
            <option value="same-tab">当前页打开</option>
            <option value="new-tab">新标签页打开</option>
          </select>
        </label>
      </div>

      <label className="field-block">
        <span>简介</span>
        <textarea value={form.summary} onChange={(event) => patch("summary", event.target.value)} rows={4} />
      </label>

      <label className="field-block">
        <span>标签</span>
        <input value={form.tags} onChange={(event) => patch("tags", event.target.value)} placeholder="internal, featured" />
      </label>

      <div className="field-grid">
        <label>
          <span>入口链接</span>
          <input value={form.entryUrl} onChange={(event) => patch("entryUrl", event.target.value)} />
        </label>
        <label>
          <span>文档链接</span>
          <input value={form.docUrl} onChange={(event) => patch("docUrl", event.target.value)} />
        </label>
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="primary-action">
        {editingProduct ? "保存修改" : "创建产品"}
      </button>
    </form>
  )
}

function validateForm(form: ProductFormInput) {
  if (!form.name.trim()) return "产品名称不能为空。"
  if (!form.owner.trim()) return "负责人不能为空。"
  if (!form.summary.trim()) return "产品简介不能为空。"
  if (!form.category.trim()) return "产品分类不能为空。"
  if (!isValidUrl(form.entryUrl)) return "入口链接必须是合法的绝对地址。"
  if (form.docUrl.trim() && !isValidUrl(form.docUrl)) return "文档链接必须是合法的绝对地址。"
  return ""
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value)
    return Boolean(url.protocol && url.hostname)
  } catch {
    return false
  }
}
