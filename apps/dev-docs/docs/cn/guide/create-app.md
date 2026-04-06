# Create App

使用 pmate CLI 创建应用时，先确定应用类型，再按对应文档完成初始化与部署。

## 目录

- [Background/背景](#background背景)
- [接入前先判断应用类型](#接入前先判断应用类型)
- [选择对应文档](#选择对应文档)

## Background/背景

创建应用并不只是把代码跑起来，还包含应用结构、基础设施初始化、部署方式和发布后的访问路径。不同类型的应用在这些环节上的要求并不一样，例如 Node 和 Rust 更偏向服务部署，Vite 和静态站点更偏向产物发布与 CDN 分发。

因此这里不再把 Node、Vite、静态应用、Rust 应用分散成多个并列主题，而是统一收敛到 `Create App`。先判断你的应用类型，再进入对应的初始化与部署文档，会比在导航里逐个猜更清晰。

## 接入前先判断应用类型

- `Node`：需要常驻进程、监听端口、由服务器承载的服务。
- `Vite`：前端应用，构建后输出静态资源，由 OSS/CDN 托管。
- `Static`：纯静态资源站点，没有 Vite 构建流程也可以直接发布。
- `Rust`：Rust 服务，通常需要服务器、进程管理和反向代理。

如果你还没确定目录结构，先看：

- [Monorepo 应用结构与技术栈](/guide/mono-app-structure)

## 选择对应文档

- [初始化并部署 Node 应用](/guide/init-deploy-node)
- [初始化并部署 Vite 应用](/guide/init-deploy-vite)
- [初始化并部署静态应用](/guide/init-deploy-static)
- [初始化并部署 Rust 应用](/guide/init-deploy-rust)
