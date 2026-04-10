import { describe, expect, it } from "vitest"
import { nodes } from "../data/playbook"
import { searchNodes } from "./search"

describe("searchNodes", () => {
  it("returns all nodes for empty query", () => {
    expect(searchNodes(nodes, "")).toHaveLength(nodes.length)
  })

  it("matches by alias", () => {
    const results = searchNodes(nodes, "python repo")
    expect(results.map((node) => node.id)).toContain("pmate-py")
  })

  it("matches by path fragments", () => {
    const results = searchNodes(nodes, "pmate-cli")
    expect(results.map((node) => node.id)).toContain("pmate-cli")
  })

  it("matches by next-step phrasing", () => {
    const results = searchNodes(nodes, "部署配置")
    expect(results.map((node) => node.id)).toContain("pmate-devops")
  })
})
