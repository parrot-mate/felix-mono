import { bookModifyTitleAtom } from "@/atom/bookModifyTitleAtom"
import { myBooksAtom } from "@/atom/myBooksAtom"
import { BookCard } from "@/component/BookCard"
import { Check, EditOutlined } from "@mui/icons-material"
import { Logger } from "@pmate/utils"
import { useTranslation } from "@pmate/i18n"
import { IconButton, useSnackbar } from "@pmate/uikit"
import { useAtom, useAtomValue } from "jotai"
import { useRef, useState } from "react"
import { useNavigate } from "react-router"
import classes from "./MyBooks.module.scss"
import { profileAtom } from "@pmate/account-sdk"

const logger = Logger.getDebugger("MyBooks")
export const MyBooks = () => {
  const _books = useAtomValue(myBooksAtom)
  logger.log("[1]", _books)
  const [mode, setMode] = useState<"read" | "edit">("read")
  const titleChanges = useRef(new Map<string, string>())

  const [, modifyTitle] = useAtom(bookModifyTitleAtom)
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""

  const nav = useNavigate()
  const t = useTranslation()
  const { enqueueSnackbar } = useSnackbar()

  const books = _books.unwrapOr([])
  if (_books.isNothing() || !userId) return null
  return (
    <>
      <div className="border rounded px-[30px] py-[20px] mt-[20px]">
        <h2 className={classes.ShelfTitle}>
          <span>{t("My bookshelf")}</span>
          {mode === "read" && (
            <IconButton
              onClick={() => {
                setMode("edit")
              }}
            >
              <EditOutlined />
            </IconButton>
          )}
          {mode === "edit" && (
            <IconButton
              onClick={async () => {
                setMode("read")
                let modifed = false
                for (const [id, title] of titleChanges.current) {
                  const book = books.find((b) => b.id === id)
                  if (book && title.trim().length > 5) {
                    await modifyTitle({
                      id: book.id,
                      title,
                    })
                    modifed = true
                  } else {
                    enqueueSnackbar(t("Title too short"), { variant: "error" })
                  }
                }
                if (modifed) {
                  enqueueSnackbar(t("Modification successful"), {
                    variant: "success",
                  })
                }
              }}
            >
              <Check />
            </IconButton>
          )}
        </h2>
        {books.length === 0 && (
          <>
            <p>{t("No books in your shelf yet")}</p>
            <p>
              {t(
                "Tap the search icon above to browse books and add them to your shelf!"
              )}
            </p>
          </>
        )}
        <div
          className={`grid gap-2 ${classes.Books} grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`}
        >
          {books.map((book, index) => {
            return (
              <div key={index}>
                <BookCard
                  showStats={true}
                  onBookTitleChanged={(title) => {
                    titleChanges.current.set(book.id, title)
                  }}
                  onChange={() => {
                    setMode("read")
                  }}
                  mode={mode}
                  key={book.id}
                  book={book}
                />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
