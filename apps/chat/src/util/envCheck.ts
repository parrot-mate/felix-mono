import MobileDetectd from "mobile-detect"
const md = new MobileDetectd(window.navigator.userAgent)

export const isMobile = () => {
  return (
    window.navigator.userAgent.match(/Android/) ||
    md.mobile() ||
    md.phone() ||
    md.tablet() ||
    md.os() === "iOS" ||
    md.os() === "AndroidOS"
  )
}
