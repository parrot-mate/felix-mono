import { useTranslation } from "@pmate/i18n"
import { SplashScreen } from "@pmate/uikit"
import { useNavigate } from "react-router-dom"

const PM_STATIC = (
  process.env.VITE_PUBLIC_PM_STATIC_URL ?? "https://parrot-static.pmate.chat"
).replace(/\/+$/, "")

export default function SplashScreenPage() {
  const nav = useNavigate()
  const t = useTranslation()
  const logoSrc = `${PM_STATIC}/parrot-logo.png`
  const brandName = t("ParrotMate")
  const slogan = t("Speak Different")

  return (
    <SplashScreen
      duration={3000}
      logoSrc={logoSrc}
      brandName={brandName}
      slogan={slogan}
      onFinish={() => nav("/")}
    />
  )
}
