import { libraryItemAtom } from "@pmate/sdk"
import { useInstallPWA } from "@/hook/userInstallPWA"
import { useTranslation } from "@pmate/i18n"
import { IconSearch } from "@pmate/uikit"
import { useAtomValue } from "jotai"
import { BookCard } from "../../component/BookCard"
export const BookBrowser = () => {
  useInstallPWA()

  const t = useTranslation()

  const _books = useAtomValue(libraryItemAtom)
  if (_books.isNothing()) {
    return null
  }
  const books = _books.unwrapOr([])

  return (
    <>
      <div>
        <div className="text-[1.2rem] flex items-center">
          <IconSearch />
          <strong className="ml-[0.3rem] text-[#666]">
            {t("Browse library")}
          </strong>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[10px]">
          {books.map((data, i) => {
            return (
              <div key={i}>
                <BookCard
                  showStats={false}
                  onChange={() => {}}
                  mode={"read"}
                  book={data}
                />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
