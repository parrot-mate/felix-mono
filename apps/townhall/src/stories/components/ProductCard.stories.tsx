import type { Meta, StoryObj } from "@storybook/react-vite"
import { ProductCard } from "../../components/ProductCard"
import { sampleProducts } from "../../fixtures/sampleProducts"

const meta: Meta<typeof ProductCard> = {
  title: "Components/ProductCard",
  component: ProductCard,
  tags: ["autodocs"],
  args: {
    product: sampleProducts[0],
    selected: false,
    onSelect: () => {},
  },
}

export default meta
type Story = StoryObj<typeof ProductCard>

export const Default: Story = {}

export const Selected: Story = {
  args: {
    selected: true,
  },
}
