export const resolveAppId = (app?: string) => {
  return app || process.env.VITE_PUBLIC_APP || "pmate"
}
