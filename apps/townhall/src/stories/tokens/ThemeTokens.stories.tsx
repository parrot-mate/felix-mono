import type { Meta, StoryObj } from "@storybook/react-vite"

const meta: Meta = {
  title: "Tokens/Theme",
  tags: ["autodocs"],
  render: () => (
    <section className="feature-strip">
      {[
        ["brand-primary-violet", "#8b5cf6"],
        ["brand-secondary-pink", "#ec4899"],
        ["surface-base", "#090312"],
        ["surface-elevated", "#130a21"],
      ].map(([label, value]) => (
        <div key={label} className="feature-card">
          <p className="eyebrow">{label}</p>
          <div style={{ height: "96px", borderRadius: "16px", background: value }} />
          <p>{value}</p>
        </div>
      ))}
    </section>
  ),
}

export default meta
type Story = StoryObj

export const Theme: Story = {}
