export type NodeStatus = "ready" | "partial"

export type PlaybookNode = {
  id: string
  title: string
  categoryId: string
  repo: string
  summary: string
  definition: string
  problemSolved: string
  useCases: string[]
  recommendedEntry: string
  nextSteps: string[]
  paths: string[]
  tags: string[]
  aliases: string[]
  relatedNodeIds: string[]
  status: NodeStatus
  statusNote?: string
}

export type PlaybookCategory = {
  id: string
  title: string
  description: string
  nodeIds: string[]
}

export type WorkspaceTreeNode = {
  id: string
  label: string
  note: string
  targetNodeId?: string
  children?: WorkspaceTreeNode[]
}

export const categories: PlaybookCategory[] = [
  {
    id: "product-build",
    title: "Product Build",
    description: "与提案、应用开发和示例工程最相关的模块。",
    nodeIds: ["pmate-proposal", "pmate-mono", "pmate-demos", "pmate-static"],
  },
  {
    id: "tooling-runtime",
    title: "Tooling & Runtime",
    description: "CLI、技能、语言运行时与服务实现模块。",
    nodeIds: ["pmate-cli", "pmate-skills", "pmate-py", "pmate-rust"],
  },
  {
    id: "infra-data",
    title: "Infra & Data",
    description: "部署、运维和数据层模块。",
    nodeIds: ["pmate-devops", "pmate-tsdb"],
  },
]

export const nodes: PlaybookNode[] = [
  {
    id: "pmate-cli",
    title: "pmate-cli",
    categoryId: "tooling-runtime",
    repo: "pmate/pmate-cli",
    summary: "PMate 的命令行入口，负责 app、deploy、agent、repo 级操作的统一执行。",
    definition: "这是 PMate 的主 CLI 仓库，面向开发者提供初始化、配置、部署、PR、agent 管理等命令式工作流入口。",
    problemSolved: "当你已经知道要做什么，但不想手动拼环境、发布、配置和集成步骤时，`pmate-cli` 提供标准入口。",
    useCases: ["初始化新 app。", "执行 `pmate deploy`。", "管理 agent、namespace、账号或发布流程。"],
    recommendedEntry: "如果你的问题是“我要执行一个 PMate 工作流命令”，优先从 `pmate-cli` 开始。",
    nextSteps: ["部署相关继续看 `pmate-devops`。", "如果要扩 CLI 能力，再深入该仓库命令实现。"],
    paths: ["pmate/pmate-cli/src/", "pmate/pmate-cli/src/commands/"],
    tags: ["cli", "deploy", "agent", "workflow"],
    aliases: ["pmate command", "deploy command", "command line"],
    relatedNodeIds: ["pmate-devops", "pmate-skills", "pmate-mono"],
    status: "ready",
  },
  {
    id: "pmate-demos",
    title: "pmate-demos",
    categoryId: "product-build",
    repo: "pmate/pmate-demos",
    summary: "用于展示 PMate 能力的 demo 仓库，适合快速看能力如何被接入和组合。",
    definition: "这个仓库主要承载示例应用和演示工程，用来说明某个能力如何从概念落到可运行产品。",
    problemSolved: "当你理解了能力名词，但还不知道它在真实应用里怎么接时，demo 比读底层包更快。",
    useCases: ["参考一个能力的最小接入方式。", "快速复制一个可运行示例验证方向。"],
    recommendedEntry: "如果你优先想看“怎么用”，而不是“怎么造”，先看 `pmate-demos`。",
    nextSteps: ["确认实现方式后，再回到目标业务仓库正式接入。", "若缺共享封装，再看 `pmate-mono`。"],
    paths: ["pmate/pmate-demos/"],
    tags: ["demo", "example", "integration"],
    aliases: ["examples", "sample app", "demo app"],
    relatedNodeIds: ["pmate-mono", "pmate-skills", "pmate-cli"],
    status: "ready",
  },
  {
    id: "pmate-devops",
    title: "pmate-devops",
    categoryId: "infra-data",
    repo: "pmate/pmate-devops",
    summary: "PMate 的部署、基础设施和运维工具仓库，面向环境、发布和稳定性保障。",
    definition: "这个仓库承载部署链路、环境配置、基础设施约定和运维相关能力，是上线和运行时侧的核心入口。",
    problemSolved: "当问题进入环境、发布、日志、配置或基础设施层面时，业务 app 仓库通常不是正确入口。",
    useCases: ["排查部署配置。", "理解环境约定和发布链路。", "接入或维护运维相关能力。"],
    recommendedEntry: "如果问题已经不是页面或功能，而是环境、发布或运行保障，优先看 `pmate-devops`。",
    nextSteps: ["命令入口回看 `pmate-cli`。", "涉及 app 运行方式时联动 `pmate-mono` 或 `pmate-static`。"],
    paths: ["pmate/pmate-devops/"],
    tags: ["devops", "infra", "deploy", "ops"],
    aliases: ["operations", "infrastructure", "release infra"],
    relatedNodeIds: ["pmate-cli", "pmate-static", "pmate-mono"],
    status: "partial",
    statusNote: "MVP 先把仓库职责讲清楚，具体环境变量、监控和回滚细节建议后续继续补齐。",
  },
  {
    id: "pmate-mono",
    title: "pmate-mono",
    categoryId: "product-build",
    repo: "pmate/pmate-mono",
    summary: "PMate 的主 monorepo，承载共享代码、包和主产品级实现，是多数功能开发的核心仓库。",
    definition: "当一个能力属于 PMate 主产品体系、需要共享包、统一基础设施或多 app 复用时，通常会落在 `pmate-mono`。",
    problemSolved: "用户经常知道要做产品功能，但不知道该去独立 demo、CLI 还是主 monorepo；`pmate-mono` 是高频正确答案之一。",
    useCases: ["开发核心产品功能。", "修改共享包。", "为多个 app 抽公共能力。"],
    recommendedEntry: "如果你的目标是长期存在的主产品能力，优先判断是否应落在 `pmate-mono`。",
    nextSteps: ["若只是示例验证，可回看 `pmate-demos`。", "若需求先要过方案评审，先去 `pmate-proposal`。"],
    paths: ["pmate/pmate-mono/apps/", "pmate/pmate-mono/packages/"],
    tags: ["monorepo", "apps", "packages", "shared"],
    aliases: ["main monorepo", "core repo", "shared packages"],
    relatedNodeIds: ["pmate-proposal", "pmate-demos", "pmate-cli"],
    status: "ready",
  },
  {
    id: "pmate-proposal",
    title: "pmate-proposal",
    categoryId: "product-build",
    repo: "pmate/pmate-proposal",
    summary: "PMate 的提案与评审仓库，用来沉淀产品、开发、测试和部署方案。",
    definition: "当需求还在定义阶段，或者需要通过结构化 proposal 统一问题、范围、实现计划和测试策略时，应先进入这个仓库。",
    problemSolved: "很多问题不是立刻写代码，而是先把目标、范围和实施路径讲清楚；否则会直接跳进错误仓库实现。",
    useCases: ["新功能立项。", "跨 repo 调整前先写方案。", "根据评论更新 proposal。"],
    recommendedEntry: "如果事情还没有清晰到可以直接改代码，先在 `pmate-proposal` 建 proposal。",
    nextSteps: ["提案确认后，再回到目标实现仓库。", "若要实施主产品功能，常见下一步是 `pmate-mono`。"],
    paths: ["pmate/pmate-proposal/"],
    tags: ["proposal", "spec", "planning", "review"],
    aliases: ["plan", "proposal repo", "spec docs"],
    relatedNodeIds: ["pmate-mono", "pmate-cli"],
    status: "ready",
  },
  {
    id: "pmate-py",
    title: "pmate-py",
    categoryId: "tooling-runtime",
    repo: "pmate/pmate-py",
    summary: "PMate 的 Python 工具、脚本和服务仓库，适合 Python 运行时相关能力。",
    definition: "如果一个能力更适合 Python 生态实现，或当前已有 Python 侧管线、脚本和服务基础，通常应先检查 `pmate-py`。",
    problemSolved: "避免把明显属于 Python 工具链的问题误放进 Node/Vite 类型仓库。",
    useCases: ["实现 Python 脚本或 worker。", "接入 Python 侧模型、管线或数据处理能力。"],
    recommendedEntry: "当需求天然贴近 Python 运行时时，先看 `pmate-py` 是否已有基础能力。",
    nextSteps: ["若能力需要和主产品联动，再定义与 `pmate-mono` 的边界。", "如果只是运维脚本，也可对照 `pmate-devops`。"],
    paths: ["pmate/pmate-py/"],
    tags: ["python", "scripts", "worker", "pipeline"],
    aliases: ["py tools", "python repo", "python services"],
    relatedNodeIds: ["pmate-rust", "pmate-devops", "pmate-mono"],
    status: "ready",
  },
  {
    id: "pmate-rust",
    title: "pmate-rust",
    categoryId: "tooling-runtime",
    repo: "pmate/pmate-rust",
    summary: "PMate 的 Rust 服务和基础设施仓库，适合高性能或系统层实现。",
    definition: "这个仓库用于承载 Rust 语言实现的服务或底层基础设施，通常不作为普通页面功能的首选落点。",
    problemSolved: "帮助用户区分“这是一个产品功能”还是“这是一个更偏基础设施/系统服务的问题”。",
    useCases: ["实现 Rust 服务。", "维护系统层基础设施。", "处理性能或底层运行时相关需求。"],
    recommendedEntry: "只有当问题明确落在 Rust 服务或系统层时，才优先进入 `pmate-rust`。",
    nextSteps: ["若只是业务页面或 SDK 接入，通常不应先来这里。", "若涉及基础设施联动，可一起看 `pmate-devops`。"],
    paths: ["pmate/pmate-rust/"],
    tags: ["rust", "service", "infra", "systems"],
    aliases: ["rust services", "rust infra"],
    relatedNodeIds: ["pmate-devops", "pmate-py"],
    status: "ready",
  },
  {
    id: "pmate-skills",
    title: "pmate-skills",
    categoryId: "tooling-runtime",
    repo: "pmate/pmate-skills",
    summary: "PMate 的 skills 与 agent 工作流仓库，适合沉淀可复用的 Codex / agent runbook。",
    definition: "当一个流程需要被稳定复用，而不是每次重新说明时，应该考虑把它沉淀成 skill；这个仓库就是对应入口。",
    problemSolved: "避免把反复执行的工作流一直留在口头说明或零散 prompt 里，导致质量和路径不稳定。",
    useCases: ["新增或维护 PMate skill。", "把重复工作流沉淀成可复用 runbook。", "管理 agent 相关工作流指引。"],
    recommendedEntry: "如果你说的是‘这个流程以后会反复做’，优先想想是否应该进 `pmate-skills`。",
    nextSteps: ["若只是一次性实现，不一定要先建 skill。", "agent 定义和消费边界再联动 `pmate-cli` 或主产品仓库。"],
    paths: ["pmate/pmate-skills/"],
    tags: ["skills", "agent", "workflow", "runbook"],
    aliases: ["skill repo", "agent workflow", "runbook"],
    relatedNodeIds: ["pmate-cli", "pmate-mono", "pmate-demos"],
    status: "ready",
  },
  {
    id: "pmate-static",
    title: "pmate-static",
    categoryId: "product-build",
    repo: "pmate/pmate-static",
    summary: "PMate 的静态站点或静态资源项目，适合纯静态内容交付。",
    definition: "如果交付物以静态页面、静态资源或几乎不需要服务端交互为主，`pmate-static` 可能比主 monorepo 更轻量。",
    problemSolved: "帮助用户区分一个内容型页面到底应该进主产品仓库，还是放到更轻的静态项目里。",
    useCases: ["交付静态说明页。", "放置静态资源或轻量内容站点。"],
    recommendedEntry: "当页面几乎不依赖动态服务和复杂交互时，优先判断是否适合 `pmate-static`。",
    nextSteps: ["若需求后续会演化为完整交互应用，再回到 `pmate-mono`。", "部署方式可继续看 `pmate-devops` 和 `pmate-cli`。"],
    paths: ["pmate/pmate-static/"],
    tags: ["static", "site", "content"],
    aliases: ["static site", "content site", "landing page"],
    relatedNodeIds: ["pmate-mono", "pmate-devops", "pmate-cli"],
    status: "ready",
  },
  {
    id: "pmate-tsdb",
    title: "pmate-tsdb",
    categoryId: "infra-data",
    repo: "pmate/pmate-tsdb",
    summary: "PMate 的数据层相关仓库，面向存储、数据结构或底层数据能力。",
    definition: "当需求已经进入数据模型、存储引擎或底层数据抽象层，而不是普通业务页面时，通常需要看 `pmate-tsdb`。",
    problemSolved: "避免把数据层问题误归到业务 app 仓库，导致实现层次混乱。",
    useCases: ["处理底层数据存储能力。", "理解某项数据抽象为什么不在业务 repo 中实现。"],
    recommendedEntry: "如果问题核心在数据能力本身，而不是 UI 或业务流程，优先检查 `pmate-tsdb`。",
    nextSteps: ["和业务能力联动时，再回看具体 app 仓库。", "涉及基础设施运行约定时联动 `pmate-devops`。"],
    paths: ["pmate/pmate-tsdb/"],
    tags: ["data", "storage", "db", "tsdb"],
    aliases: ["database", "storage layer", "data repo"],
    relatedNodeIds: ["pmate-devops", "pmate-mono"],
    status: "partial",
    statusNote: "当前首版只覆盖模块定位与用途，具体数据结构和存储边界仍建议后续补充。",
  },
]

export const workspaceTree: WorkspaceTreeNode = {
  id: "pmate-root",
  label: "pmate/",
  note: "workspace root",
  children: [
    { id: "tree-pmate-cli", label: "pmate-cli", note: "CLI and workflow entry", targetNodeId: "pmate-cli" },
    { id: "tree-pmate-demos", label: "pmate-demos", note: "examples and demos", targetNodeId: "pmate-demos" },
    { id: "tree-pmate-devops", label: "pmate-devops", note: "deploy and infra", targetNodeId: "pmate-devops" },
    { id: "tree-pmate-mono", label: "pmate-mono", note: "main monorepo", targetNodeId: "pmate-mono" },
    { id: "tree-pmate-proposal", label: "pmate-proposal", note: "proposal and specs", targetNodeId: "pmate-proposal" },
    { id: "tree-pmate-py", label: "pmate-py", note: "python tooling", targetNodeId: "pmate-py" },
    { id: "tree-pmate-rust", label: "pmate-rust", note: "rust services", targetNodeId: "pmate-rust" },
    { id: "tree-pmate-skills", label: "pmate-skills", note: "skills and workflows", targetNodeId: "pmate-skills" },
    { id: "tree-pmate-static", label: "pmate-static", note: "static apps and assets", targetNodeId: "pmate-static" },
    { id: "tree-pmate-tsdb", label: "pmate-tsdb", note: "data layer", targetNodeId: "pmate-tsdb" },
  ],
}

export const nodeMap = new Map(nodes.map((node) => [node.id, node]))

export function getNode(nodeId: string) {
  return nodeMap.get(nodeId)
}

export function getRelatedNodes(node: PlaybookNode) {
  return node.relatedNodeIds.flatMap((relatedNodeId) => {
    const relatedNode = nodeMap.get(relatedNodeId)
    return relatedNode ? [relatedNode] : []
  })
}
