import { DeleteOutline } from "@mui/icons-material"
import { AIImgRequest, AIImgType, LibraryItem } from "@pmate/meta"
import { IconButton } from "@pmate/uikit"
import React from "react"
import { AIImage } from "./AIImage"

type BookCardPureProps = {
  book: LibraryItem
  mode: "read" | "edit"
  className?: string
  onBookTitleChanged?: (title: string) => void
  onRemove?: (e: React.MouseEvent) => void
  onCardClick: () => void
  showStats: boolean
  StatsPanel?: React.ReactElement // or pass in the element
}

/**
 * Utility to truncate a long string to 40 characters
 */
function trimTitle(title: string) {
  if (title.length < 40) {
    return title
  }
  return title.slice(0, 40) + "..."
}

export const BookCardDisplay = ({
  book,
  mode,
  className,
  onBookTitleChanged,
  onRemove,
  onCardClick,
  showStats,
  StatsPanel,
}: BookCardPureProps) => {
  const cardClasses =
    "relative w-full overflow-hidden pt-[132%] box-border" +
    (className ? ` ${className}` : "")
  const isLocalRes = book.type === "local-pdf" || book.type === "local-txt"
  const showTitle = mode === "read" || (!isLocalRes && mode === "edit")

  return (
    <div className={cardClasses} onClick={onCardClick}>
      <div className="absolute inset-0">
        {/* Conditionally render StatsPanel if showStats is true */}
        {showStats && StatsPanel}

        <div className="relative w-full h-full bg-[#c1c7c8]">
          {/* The AI-generated cover image */}
          <AIImage
            req={
              {
                type: AIImgType.BookCover,
                params: {
                  title: book.title!.en,
                },
              } as AIImgRequest<AIImgType.BookCover>
            }
            autoload={true}
            imageStyle={{
              boxShadow: "1px 2px 4px 0px grey",
              width: "100%",
              height: "100%",
            }}
          />

          {/* Title area */}
          <div className="absolute w-[80%] left-[10%] bottom-[10px] box-border text-[0.6rem] font-bold mb-2 bg-black/50 shadow-[2px_4px_6px_grey] p-1 rounded-[2px] text-center break-words text-white">
            {/* In read mode OR if mode is edit + NOT local resource => show <p> */}
            {showTitle && (
              <p className="m-0">{trimTitle(book.title?.en || "")}</p>
            )}
            {showTitle && (
              <p className="m-0">{trimTitle(book.title?.cn || "")}</p>
            )}

            {/* If edit mode AND local resource => show <textarea> for editing */}
            {mode === "edit" && isLocalRes && (
              <textarea
                className="w-full"
                defaultValue={book.title!.en}
                onChange={(e) => onBookTitleChanged?.(e.target.value)}
              />
            )}
          </div>

          {/* Remove button only in edit mode */}
          {mode === "edit" && (
            <IconButton
              className="!bg-[#c1c7c8] absolute top-4 right-4 text-[#ec4b39]"
              onClick={onRemove}
            >
              <DeleteOutline />
            </IconButton>
          )}
        </div>
      </div>
    </div>
  )
}
