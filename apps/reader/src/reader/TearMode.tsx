import { GlobalEmitterContext } from "@/hook/useGlobalEmitter"
import { SupportToolTip } from "@/reader/SupportTooltip"
import { TearModeSlides } from "@/reader/tear/TearModeSlides"
import { GlobalLoading } from "@pchip/components"
import { Emitter } from "@pmate/utils"
import { BookLoader } from "@pmate/sdk"
import { Suspense, useEffect, useMemo } from "react"
export const TearMode = () => {
  const emiter = useMemo(() => {
    return new Emitter<string>()
  }, [])
  useEffect(() => {
    document.addEventListener(
      "contextmenu",

      function (event) {
        event.preventDefault()
      },
      false
    )
  })
  return (
    <BookLoader>
      {(book) => (
        <GlobalEmitterContext.Provider value={emiter}>
          <Suspense fallback={<GlobalLoading />}>
            <Suspense fallback={<GlobalLoading />}>
              <TearModeSlides id={book.id} key={book.id} />
            </Suspense>
            <SupportToolTip />
          </Suspense>
        </GlobalEmitterContext.Provider>
      )}
    </BookLoader>
  )
}
