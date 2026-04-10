import { type PlaybookNode } from "../data/playbook"

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export function searchNodes(nodes: PlaybookNode[], query: string) {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return nodes

  return nodes.filter((node) => {
    const haystacks = [
      node.title,
      node.summary,
      node.definition,
      node.problemSolved,
      node.recommendedEntry,
      ...node.tags,
      ...node.aliases,
      ...node.paths,
      ...node.useCases,
      ...node.nextSteps,
      node.repo,
    ]

    return haystacks.some((item) => normalize(item).includes(normalizedQuery))
  })
}
