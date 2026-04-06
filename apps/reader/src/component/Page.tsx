import { ReactNode } from "react"

export const Page = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col min-h-screen bg-gray-50">{children}</div>
)
