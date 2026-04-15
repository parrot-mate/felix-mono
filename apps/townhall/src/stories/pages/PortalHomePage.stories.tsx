import type { Meta, StoryObj } from "@storybook/react-vite"
import { sampleProducts } from "../../fixtures/sampleProducts"
import { PortalHomePage } from "../../pages/PortalHomePage"

const meta: Meta<typeof PortalHomePage> = {
  title: "Pages/PortalHomePage",
  component: PortalHomePage,
  tags: ["autodocs"],
  args: {
    categories: ["协作工具", "知识工具"],
    filteredProducts: sampleProducts,
    selectedProduct: sampleProducts[0],
    query: "",
    category: "all",
    onSelectProduct: () => {},
    onQueryChange: () => {},
    onCategoryChange: () => {},
    onManageView: () => {},
  },
}

export default meta
type Story = StoryObj<typeof PortalHomePage>

export const Desktop: Story = {}
