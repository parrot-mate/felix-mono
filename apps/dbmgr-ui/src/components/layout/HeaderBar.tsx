import { Layout, Segmented, Typography } from "antd"
import { useLocation, useNavigate } from "react-router-dom"

interface HeaderBarProps {
  chainId: string
  title?: string
}

const { Header } = Layout
const { Title, Text } = Typography

export function HeaderBar({ chainId, title = "dbmgr-ui" }: HeaderBarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const activeNav = resolveActiveNav(location.pathname)

  return (
    <Header className="flex items-center justify-between gap-4 border-b border-slate-800/80 bg-slate-950/90 px-6">
      <div className="flex items-center gap-4">
        <Title level={4} className="!mb-0 text-slate-100">
          {title}
        </Title>
        <Segmented
          size="small"
          value={activeNav}
          onChange={(value) => navigate(String(value))}
          options={[
            { label: "Block", value: "/" },
            { label: "Indexer", value: "/indexers" },
            { label: "Entities", value: "/entities" },
          ]}
        />
      </div>
      <Text className="text-xs uppercase tracking-[0.25em] text-slate-400">
        Chain: {chainId}
      </Text>
    </Header>
  )
}

function resolveActiveNav(pathname: string): string {
  if (pathname.startsWith("/indexers")) {
    return "/indexers"
  }
  if (pathname.startsWith("/entities")) {
    return "/entities"
  }
  return "/"
}
