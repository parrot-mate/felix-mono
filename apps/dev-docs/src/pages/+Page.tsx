import React from "react"
import { MDXProvider } from "@mdx-js/react"
import { usePageContext } from "vike-react/usePageContext"
import { CodeBlock } from "../components/CodeBlock"
import {
  DEFAULT_DOC_PATH,
  getSectionsForLang,
  logoUrl,
  type Language,
} from "./docsContent"
import "../index.css"

export const Page = () => {
  const pageContext = usePageContext()
  const pathname =
    pageContext.urlPathname ?? pageContext.urlParsed?.pathname ?? "/"
  const normalizedPath = pathname.replace(/\/+$/, "") || "/"
  const hasLangPrefix = /^\/(en|cn)(\/|$)/.test(normalizedPath)
  const lang: Language = normalizedPath.startsWith("/cn") ? "cn" : "en"
  const sections = React.useMemo(() => getSectionsForLang(lang), [lang])
  const allItems = React.useMemo(
    () => sections.flatMap((section) => section.items),
    [sections]
  )
  const activeItem =
    allItems.find((item) => item.path === normalizedPath) ?? allItems[0]
  const activeSection =
    sections.find((section) => activeItem.path.startsWith(section.path)) ??
    sections[0]
  const basePath =
    normalizedPath.replace(/^\/(en|cn)/, "") || DEFAULT_DOC_PATH

  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const closeMenu = () => setIsMenuOpen(false)

  const navContent = (
    <div className="flex flex-col gap-3">
      {sections.map((section) => {
        const isActiveSection = section.id === activeSection.id
        return (
          <div key={section.id} className="flex flex-col gap-2">
            <a
              href={section.items[0].path}
              className={`w-full border-l-2 border-transparent px-2 py-1.5 text-left text-sm font-semibold transition ${
                isActiveSection
                  ? "border-slate-900 text-slate-900"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={closeMenu}
            >
              <span className="block">{section.title}</span>
            </a>
            <div className="flex flex-col gap-1.5 pl-2.5">
              {section.items.map((item) => {
                const isActiveItem = item.id === activeItem.id
                return (
                  <a
                    key={item.id}
                    href={item.path}
                    onClick={closeMenu}
                    className={`flex w-full items-start gap-2 border-l-2 border-transparent px-2 py-1.5 text-left text-sm transition ${
                      isActiveItem
                        ? "border-slate-900 text-slate-900"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex-1">
                      <span className="block font-medium">{item.title}</span>
                    </div>
                    <span
                      className={`mt-1 h-0 w-0 border-y-[5px] border-y-transparent border-l-[7px] transition ${
                        isActiveItem
                          ? "border-l-slate-800 opacity-100"
                          : "border-l-transparent opacity-0"
                      }`}
                    />
                  </a>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )

  if (!hasLangPrefix) {
    return (
      <div className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-16">
          <h1 className="text-2xl font-semibold">PMate developer doc</h1>
          <p className="text-sm text-slate-600">
            Please choose a language to continue.
          </p>
          <div className="flex items-center gap-3">
            <a
              className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              href={`/en${DEFAULT_DOC_PATH}`}
            >
              EN
            </a>
            <a
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              href={`/cn${DEFAULT_DOC_PATH}`}
            >
              中文
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-10">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-3 px-6">
          <button
            type="button"
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            Menu
          </button>
          <img
            src={logoUrl}
            alt="Pmate logo"
            className="h-7 w-7 rounded-md border border-slate-200 bg-white object-contain"
          />
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">
            PMate developer doc
          </h1>
          <div className="ml-auto flex items-center gap-2 text-xs">
            {(["en", "cn"] as const).map((option) => (
              <a
                key={option}
                href={`/${option}${basePath}`}
                className={`rounded-full border px-3 py-1 transition ${
                  option === lang
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {option === "en" ? "EN" : "中文"}
              </a>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 lg:h-[calc(100vh-3rem)] lg:flex-row lg:gap-10 lg:overflow-hidden">
        <aside className="hidden w-full px-4 py-4 lg:block lg:w-72 lg:overflow-y-auto">
          {navContent}
        </aside>

        <main className="flex-1 pb-10 lg:overflow-y-auto">
          <section className="rounded-2xl bg-white px-0 py-0">
            <article className="doc-content">
              <MDXProvider
                components={{
                  pre: CodeBlock,
                }}
              >
                {activeItem ? <activeItem.Component /> : null}
              </MDXProvider>
            </article>
          </section>
        </main>
      </div>

      <div
        className={`fixed inset-0 z-20 transition lg:hidden ${
          isMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isMenuOpen}
      >
        <div
          className={`absolute inset-0 bg-slate-900/40 transition-opacity ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeMenu}
        />
        <div
          className={`absolute left-0 top-0 h-full w-72 bg-white px-4 py-4 shadow-xl transition-transform ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
              Menu
            </span>
            <button
              type="button"
              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              onClick={closeMenu}
            >
              Close
            </button>
          </div>
          {navContent}
        </div>
      </div>
    </div>
  )
}
