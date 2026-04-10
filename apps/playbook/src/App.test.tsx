import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { App } from "./App"

describe("Playbook App", () => {
  it("renders the default node details", () => {
    render(<App />)
    const detailPanel = screen.getByLabelText("Detail panel")

    expect(screen.getByRole("heading", { level: 1, name: "PMate Playbook" })).toBeInTheDocument()
    expect(screen.getByLabelText("Workspace tree")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /pmate-mono.*main monorepo/i })).toBeInTheDocument()
    expect(within(detailPanel).getByRole("heading", { level: 2, name: "pmate-mono" })).toBeInTheDocument()
    expect(within(detailPanel).getByText(/主 monorepo/)).toBeInTheDocument()
  })

  it("lets the user jump from workspace tree to mapped capability details", async () => {
    const user = userEvent.setup()
    render(<App />)
    const detailPanel = screen.getByLabelText("Detail panel")

    await user.click(screen.getByRole("button", { name: /pmate-cli.*CLI and workflow entry/i }))

    expect(within(detailPanel).getByRole("heading", { level: 2, name: "pmate-cli" })).toBeInTheDocument()
  })

  it("filters by search and lets the user open a matching node", async () => {
    const user = userEvent.setup()
    render(<App />)
    const detailPanel = screen.getByLabelText("Detail panel")

    await user.type(screen.getByLabelText("Search"), "python")
    await user.click(screen.getByRole("button", { name: /pmate-py/ }))

    expect(within(detailPanel).getByRole("heading", { level: 2, name: "pmate-py" })).toBeInTheDocument()
    expect(within(detailPanel).getByText("pmate/pmate-py")).toBeInTheDocument()
    expect(within(detailPanel).getByText(/Python 工具、脚本和服务仓库/)).toBeInTheDocument()
  })

  it("shows a no-result state when nothing matches", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText("Search"), "blockchain ledger")

    expect(screen.getByRole("status")).toHaveTextContent("No matching modules")
  })

  it("shows partial coverage notes for incomplete nodes", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /pmate-devops/ }))

    expect(screen.getByText("Partial")).toBeInTheDocument()
    expect(screen.getByText(/具体环境变量、监控和回滚细节建议后续继续补齐/)).toBeInTheDocument()
  })

  it("lets the user jump through related capabilities", async () => {
    const user = userEvent.setup()
    render(<App />)
    const detailPanel = screen.getByLabelText("Detail panel")

    await user.click(screen.getAllByRole("button", { name: /pmate-proposal/ })[0])
    await user.click(within(detailPanel).getByRole("button", { name: /pmate-mono/ }))

    expect(within(detailPanel).getByRole("heading", { level: 2, name: "pmate-mono" })).toBeInTheDocument()
  })
})
