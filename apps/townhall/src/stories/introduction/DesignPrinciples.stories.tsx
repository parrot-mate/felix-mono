import type { Meta, StoryObj } from "@storybook/react-vite"

const meta: Meta = {
  title: "Design Principles/Overview",
  tags: ["autodocs"],
  render: () => (
    <section className="side-panel" style={{ maxWidth: "820px" }}>
      <p className="eyebrow">TownHall</p>
      <h2>Design principles</h2>
      <ul>
        <li>紫粉色品牌基调，但优先保证信息层级和浏览效率。</li>
        <li>首屏必须同时承接搜索、推荐和产品发现。</li>
        <li>桌面端强调并行浏览，手机端强调可阅读与可点击。</li>
        <li>卡片与侧边详情是一条连续的发现链路，而不是跳页式详情体验。</li>
      </ul>
    </section>
  ),
}

export default meta
type Story = StoryObj

export const Overview: Story = {}
