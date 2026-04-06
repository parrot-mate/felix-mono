# Markdown 教程：它是什么、语法怎么写、以及如何渲染

## 目录

- [什么是 Markdown？](#什么是-markdown)
- [为什么要使用 Markdown？](#为什么要使用-markdown)
- [核心语法](#核心语法)
- [如何理解 Markdown 源码与渲染结果](#如何理解-markdown-源码与渲染结果)
- [Markdown 在 PMate dev-docs 中如何渲染](#markdown-在-pmate-dev-docs-中如何渲染)
- [哪些语法要谨慎使用](#哪些语法要谨慎使用)
- [下一步](#下一步)

## 什么是 Markdown？

Markdown 是一种轻量级文本格式，用纯文本就可以写出结构化文档。

你不需要在富文本编辑器里点按钮，只需要写少量标记：

- `#` 表示标题
- `-` 或 `1.` 表示列表
- `**text**` 表示粗体
- `` `code` `` 表示行内代码
- `[label](url)` 表示链接

Markdown 的一个优点是：即使还没渲染，源码本身也比较容易读懂。

示例源码：

```md
# Hello Markdown

This is **bold**, this is *italic*, and this is a [link](https://example.com).
```

渲染后的效果大致如下：

# Hello Markdown

This is **bold**, this is *italic*, and this is a [link](https://example.com).

## 为什么要使用 Markdown？

Markdown 常用于文档，是因为它：

- 写起来快
- 在 Git 里容易审查
- 便于 diff、复制和版本管理
- 可以迁移到很多文档系统中
- 即使是原始文本也有可读性

对于文档写作来说，Markdown 往往能在“简单”和“结构化”之间取得很好的平衡。

## 核心语法

### 标题

使用 `#` 到 `######` 表示不同级别的标题。

```md
# 一级标题
## 二级标题
### 三级标题
```

渲染效果：

# 一级标题
## 二级标题
### 三级标题

### 段落与换行

普通文本直接写成段落。段落与段落之间空一行。

```md
这是第一段。

这是第二段。
```

渲染效果：

这是第一段。

这是第二段。

如果你想在同一段里强制换行，可以谨慎使用 HTML `<br />`：

```md
第一行。<br />
第二行。
```

渲染效果：

第一行。<br />
第二行。

### 强调

```md
*斜体*
**粗体**
***粗斜体***
```

渲染效果：

*斜体*  
**粗体**  
***粗斜体***

### 无序列表

```md
- 第一项
- 第二项
- 第三项
```

渲染效果：

- 第一项
- 第二项
- 第三项

### 有序列表

```md
1. 第一步
2. 第二步
3. 第三步
```

渲染效果：

1. 第一步
2. 第二步
3. 第三步

### 链接

```md
[OpenAI](https://openai.com/)
```

渲染效果：

[OpenAI](https://openai.com/)

### 图片

图片语法和链接类似，只是在前面多一个 `!`。

```md
![Alt text](https://example.com/image.png)
```

在 PMate 文档里，只有在图片资源稳定且确实有必要时才建议使用图片。

### 引用

```md
> Markdown 首先是纯文本，其次才是渲染结果。
```

渲染效果：

> Markdown 首先是纯文本，其次才是渲染结果。

### 行内代码

用反引号包裹短代码、文件路径、命令和标识符。

```md
在 `apps/dev-docs` 中运行 `pnpm install`。
```

渲染效果：

在 `apps/dev-docs` 中运行 `pnpm install`。

### 代码块

较大的代码示例请使用三个反引号，并尽量带上语言名。

```md
```bash
pnpm --filter @pmate/dev-docs build
```
```

渲染效果：

```bash
pnpm --filter @pmate/dev-docs build
```

### 分隔线

使用三个减号表示分隔线。

```md
---
```

渲染效果：

---

### Mermaid 图表

当前文档应用通过现有渲染管线支持 Mermaid。

源码：

````md
```mermaid
flowchart LR
  Draft["写 Markdown"] --> Render["在 dev-docs 中渲染"]
  Render --> Read["在浏览器中阅读"]
```
````

渲染效果：

```mermaid
flowchart LR
  Draft["写 Markdown"] --> Render["在 dev-docs 中渲染"]
  Render --> Read["在浏览器中阅读"]
```

## 如何理解 Markdown 源码与渲染结果

学习 Markdown 时，最好同时看两种形态：

1. 你输入的源码
2. 用户最终看到的渲染结果

因为 Markdown 的重点，不只是“怎么写”，而是“这些语法会怎样被展示出来”。

示例：

源码：

```md
## 发布步骤

1. 构建应用。
2. 检查输出结果。
3. 审批后部署。
```

渲染效果：

## 发布步骤

1. 构建应用。
2. 检查输出结果。
3. 审批后部署。

## Markdown 在 PMate dev-docs 中如何渲染

在 `pmate/pmate-mono/apps/dev-docs` 中：

1. Markdown 文件放在 `docs/en/...` 和 `docs/cn/...` 下。
2. 文档应用会在 `src/pages/docsContent.tsx` 中导入这些文件。
3. 页面通过现有的 Vike + React 壳层进行渲染。
4. 代码块会经过当前渲染器高亮。
5. Mermaid 图会由当前管线处理。

这意味着这里的文档并不是简单展示原始文本，而是把 Markdown 转成 PMate 文档站中的真实页面。

## 哪些语法要谨慎使用

并不是所有 Markdown 方言都支持相同的扩展。

对于当前文档应用：

- 标题、段落、强调、列表、链接、引用、行内代码、代码块、Mermaid 都是比较稳妥的选择
- 表格、任务列表、平台特定提示块等功能，通常依赖额外插件或样式
- 原始 HTML 在某些情况下可能可用，但应尽量少用

建议：

- 优先使用简单、通用的核心语法
- 高级语法先在 `apps/dev-docs` 中验证渲染效果，再决定是否正式使用

## 下一步

学习 Markdown 最快的方法通常是：

1. 先写一个很小的例子
2. 预览渲染结果
3. 对照源码与输出
4. 每次只增加一种新语法

如果要继续练习，下一个合适的动作是写一个短文档页面，包含标题、列表、链接、代码块，以及一个 Mermaid 图。
