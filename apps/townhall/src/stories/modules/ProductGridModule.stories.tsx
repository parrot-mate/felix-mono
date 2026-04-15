import type { Meta, StoryObj } from "@storybook/react-vite"
import { sampleProducts } from "../../fixtures/sampleProducts"
import { ProductGridModule } from "../../modules/ProductGridModule"

const meta: Meta<typeof ProductGridModule> = {
  title: "Modules/ProductGrid",
  component: ProductGridModule,
  tags: ["autodocs"],
  args: {
    products: sampleProducts,
    selectedProductId: sampleProducts[0].id,
    onSelect: () => {},
  },
}

export default meta
type Story = StoryObj<typeof ProductGridModule>

export const Grid: Story = {}

export const Empty: Story = {
  args: {
    products: [],
  },
}
