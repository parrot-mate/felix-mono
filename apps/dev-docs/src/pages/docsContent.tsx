import React from "react"
import StarterAuthWebDocCn from "../../docs/cn/guide/auth-system-integration-web.md"
import StarterDbDevDocCn from "../../docs/cn/guide/db-development.md"
import StarterCreateAppDocCn from "../../docs/cn/guide/create-app.md"
import StarterEnvSetupDocCn from "../../docs/cn/guide/environment-setup.md"
import StarterMonoAppStructureDocCn from "../../docs/cn/guide/mono-app-structure.md"
import StarterInitDeployNodeDocCn from "../../docs/cn/guide/init-deploy-node.md"
import StarterHowToUseSkillsDocCn from "../../docs/cn/guide/how-to-use-skills.md"
import MarkdownTutorialDocCn from "../../docs/cn/guide/markdown-tutorial.md"
import ProposalProcessKeyKnowledgeDocCn from "../../docs/cn/guide/proposal-process-key-knowledge.md"
import ConceptsBlockchainIndexerDocCn from "../../docs/cn/concepts/blockchain-indexer.md"
import AgentSdkAgentDocCn from "../../docs/cn/agent-sdk/agent.md"
import LinearDocCn from "../../docs/cn/pmate-cli/linear.md"
import StarterAuthWebDocEn from "../../docs/en/guide/auth-system-integration-web.md"
import StarterDbDevDocEn from "../../docs/en/guide/db-development.md"
import StarterCreateAppDocEn from "../../docs/en/guide/create-app.md"
import StarterEnvSetupDocEn from "../../docs/en/guide/environment-setup.md"
import StarterMonoAppStructureDocEn from "../../docs/en/guide/mono-app-structure.md"
import StarterInitDeployNodeDocEn from "../../docs/en/guide/init-deploy-node.md"
import StarterHowToUseSkillsDocEn from "../../docs/en/guide/how-to-use-skills.md"
import MarkdownTutorialDocEn from "../../docs/en/guide/markdown-tutorial.md"
import ProposalProcessKeyKnowledgeDocEn from "../../docs/en/guide/proposal-process-key-knowledge.md"
import ConceptsBlockchainIndexerDocEn from "../../docs/en/concepts/blockchain-indexer.md"
import AgentSdkAgentDocEn from "../../docs/en/agent-sdk/agent.md"
import LinearDocEn from "../../docs/en/pmate-cli/linear.md"

export const logoUrl = "https://parrot-static.pmate.chat/parrot-logo.png"

export type Language = "en" | "cn"

export type LocalizedText = {
  en: string
  cn: string
}

export type DocItemBase = {
  id: string
  title: LocalizedText
  description: LocalizedText
  path: string
  Component: {
    en: React.ComponentType
    cn: React.ComponentType
  }
}

export type DocSectionBase = {
  id: string
  title: LocalizedText
  description: LocalizedText
  path: string
  items: DocItemBase[]
}

export type DocItem = {
  id: string
  title: string
  description: string
  path: string
  Component: React.ComponentType
}

export type DocSection = {
  id: string
  title: string
  description: string
  path: string
  items: DocItem[]
}

export const baseSections: DocSectionBase[] = [
  {
    id: "guide",
    title: {
      en: "Guide",
      cn: "Guide 指南",
    },
    description: {
      en: "Opinionated integration guides for common web apps.",
      cn: "面向常见 Web 应用的集成实践指南。",
    },
    path: "/guide",
    items: [
      {
        id: "environment-setup",
        title: {
          en: "How to set up environment (macOS & Ubuntu)?",
          cn: "如何配置开发环境（macOS & Ubuntu）？",
        },
        description: {
          en: "Install Node, pnpm, and optional tools for local dev.",
          cn: "安装本地开发所需的 Node、pnpm 与可选工具。",
        },
        path: "/guide/environment-setup",
        Component: {
          en: StarterEnvSetupDocEn,
          cn: StarterEnvSetupDocCn,
        },
      },
      {
        id: "markdown-tutorial",
        title: {
          en: "Markdown tutorial",
          cn: "Markdown 教程",
        },
        description: {
          en: "Learn what Markdown is, the core grammar, and how it renders.",
          cn: "学习 Markdown 是什么、核心语法，以及它如何被渲染。",
        },
        path: "/guide/markdown-tutorial",
        Component: {
          en: MarkdownTutorialDocEn,
          cn: MarkdownTutorialDocCn,
        },
      },
      {
        id: "mono-app-structure",
        title: {
          en: "Monorepo app & tech stack",
          cn: "Monorepo 应用结构与技术栈",
        },
        description: {
          en: "Required layout and suggested tech stack.",
          cn: "必备目录结构与推荐技术栈。",
        },
        path: "/guide/mono-app-structure",
        Component: {
          en: StarterMonoAppStructureDocEn,
          cn: StarterMonoAppStructureDocCn,
        },
      },
      {
        id: "create-app",
        title: {
          en: "Create App",
          cn: "创建应用 Create App",
        },
        description: {
          en: "Choose the app type and open the matching init/deploy guide.",
          cn: "先选择应用类型，再进入对应的初始化与部署文档。",
        },
        path: "/guide/create-app",
        Component: {
          en: StarterCreateAppDocEn,
          cn: StarterCreateAppDocCn,
        },
      },
      {
        id: "db-development",
        title: {
          en: "How to use DB?",
          cn: "如何使用 DB？",
        },
        description: {
          en: "Read/write data with @pmate/blockchain during dev.",
          cn: "开发阶段使用 @pmate/blockchain 读写数据。",
        },
        path: "/guide/db-development",
        Component: {
          en: StarterDbDevDocEn,
          cn: StarterDbDevDocCn,
        },
      },
      {
        id: "auth-system-integration-web",
        title: {
          en: "Account System",
          cn: "Account System 账号体系",
        },
        description: {
          en: "Integrate @pmate/auth + @pmate/account-sdk in a web SPA.",
          cn: "在 Web SPA 中接入 @pmate/auth 与 @pmate/account-sdk。",
        },
        path: "/guide/auth-system-integration-web",
        Component: {
          en: StarterAuthWebDocEn,
          cn: StarterAuthWebDocCn,
        },
      },
      {
        id: "agent-system",
        title: {
          en: "Agent System",
          cn: "Agent System",
        },
        description: {
          en: "Build agents and run clients with @pmate/agent-sdk.",
          cn: "使用 @pmate/agent-sdk 构建 agent 并从客户端调用。",
        },
        path: "/agent-sdk/agent",
        Component: {
          en: AgentSdkAgentDocEn,
          cn: AgentSdkAgentDocCn,
        },
      },
      {
        id: "linear",
        title: {
          en: "How to Use Linear?",
          cn: "如何使用 Linear？",
        },
        description: {
          en: "Set up account access and run Linear workflows with pmate CLI.",
          cn: "通过 pmate CLI 完成 Linear 账号接入与工单工作流。",
        },
        path: "/pmate-cli/linear",
        Component: {
          en: LinearDocEn,
          cn: LinearDocCn,
        },
      },
      {
        id: "proposal-process-key-knowledge",
        title: {
          en: "Key knowledge in the proposal process",
          cn: "提案流程中的关键知识",
        },
        description: {
          en: "Learn what each proposal doc means and how QA concepts differ.",
          cn: "理解 proposal 各文档职责，以及 QA 核心概念之间的区别。",
        },
        path: "/guide/proposal-process-key-knowledge",
        Component: {
          en: ProposalProcessKeyKnowledgeDocEn,
          cn: ProposalProcessKeyKnowledgeDocCn,
        },
      },
      {
        id: "how-to-use-skills",
        title: {
          en: "How to use skills?",
          cn: "如何使用 skills？",
        },
        description: {
          en: "Understand skill structure, triggering, and authoring workflow.",
          cn: "了解 skill 结构、触发方式与编写流程。",
        },
        path: "/guide/how-to-use-skills",
        Component: {
          en: StarterHowToUseSkillsDocEn,
          cn: StarterHowToUseSkillsDocCn,
        },
      },
    ],
  },
  {
    id: "concepts",
    title: {
      en: "Concepts",
      cn: "概念",
    },
    description: {
      en: "Architecture and system mental models.",
      cn: "理解系统架构与核心概念。",
    },
    path: "/concepts",
    items: [
      {
        id: "blockchain-indexer",
        title: {
          en: "How to understand blockchain and indexer?",
          cn: "如何理解 blockchain 与 indexer？",
        },
        description: {
          en: "A tech-sharing overview of write/read paths and indexers.",
          cn: "从技术视角理解写入链与索引读取路径。",
        },
        path: "/concepts/blockchain-indexer",
        Component: {
          en: ConceptsBlockchainIndexerDocEn,
          cn: ConceptsBlockchainIndexerDocCn,
        },
      },
    ],
  },
]

export const DEFAULT_DOC_PATH =
  baseSections[0]?.items[0]?.path ?? "/guide/environment-setup"

export const getSectionsForLang = (lang: Language): DocSection[] =>
  baseSections.map((section) => ({
    id: section.id,
    title: section.title[lang],
    description: section.description[lang],
    path: `/${lang}${section.path}`,
    items: section.items.map((item) => ({
      id: item.id,
      title: item.title[lang],
      description: item.description[lang],
      path: `/${lang}${item.path}`,
      Component: item.Component[lang],
    })),
  }))

export const getAllDocPaths = () => {
  const paths = baseSections.flatMap((section) =>
    section.items.map((item) => item.path)
  )
  const all = (["en", "cn"] as const).flatMap((lang) =>
    paths.map((path) => `/${lang}${path}`)
  )
  return Array.from(new Set(all))
}
