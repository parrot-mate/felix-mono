import { AIImage } from "@/component/AIImage"
import { TableOfContents } from "@/reader/TableOfContents"
import { FlexRow, MetricDisplay } from "@pchip/components"
import { Logger } from "@pmate/utils"
import { AIImgRequest, AIImgType } from "@pmate/meta"
import { profileAtom } from "@pmate/account-sdk"
import {
  bookAtom,
  BookLoader,
  bookStatsAtom,
  lastPositionAtom,
  useBook,
} from "@pmate/sdk"
import { Button, TitleBar } from "@pmate/uikit"
import { useAtomValue } from "jotai"
import { Suspense } from "react"
import { useNavigate, useParams } from "react-router"

const logger = Logger.getDebugger("BookDetail")
export const BookDetail = () => {
  const bookId = useParams().id as string

  return (
    <BookLoader>
      {(book) => {
        return (
          <>
            <TitleBar title={book.title} />
            <div className="mx-auto mt-16 max-w-[960px]">
              <div className="m-1">
                <div className="flex flex-row">
                  <div className="flex-[2] min-w-[10rem] p-[10px]">
                    <Cover />
                  </div>
                  <div className="flex-[4] m-1">
                    <h2>{book.title}</h2>
                    <strong>{book.author}</strong>
                    <p>{book.intro}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center pb-2">
                  <Suspense fallback={null}>
                    <NextTearModeButton id={book.id} />
                  </Suspense>
                </div>
              </div>

              <div className="m-1" />

              <div className="m-1 p-1">
                <BookStats />
              </div>
              <div className="m-1 p-1">
                <TableOfContents />
              </div>
            </div>
          </>
        )
      }}
    </BookLoader>
  )
}

const NextTearModeButton = ({ id }: { id: string }) => {
  const nav = useNavigate()
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const lastPos = useAtomValue(lastPositionAtom({ user: userId, bookId: id }))
  const pid = lastPos ?? 0
  logger.log(`pid`, pid)

  return (
    <Button
      onClick={() => {
        nav(`/reader/TearMode/${id}/${pid || 0}`, { replace: true })
      }}
    >
      阅读
    </Button>
  )
}

const BookStats = () => {
  const id = useBook()
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const stats = useAtomValue(
    bookStatsAtom({
      bookId: id,
      user: userId,
    })
  )
  const book = useAtomValue(bookAtom(id)).unwrap()!

  const percent = (stats.finishedVolume * 100) / book.wc

  return (
    <>
      <div className="flex flex-row items-center mt-1 p-1">
        <label>阅读进度({percent.toFixed(2)}%)</label>
        <div className="flex-1 mx-1">
          <div className="w-full h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-blue-500 rounded"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
      <FlexRow
        flexWrap={"wrap"}
        justifyContent={"space-between"}
        className="px-[10px] py-[5px]"
      >
        <MetricDisplay label="词数" value={book.wc} />
        <MetricDisplay label="独立词数" value={book.uniqWc} />
        <MetricDisplay label="章节数" value={book.chapterCount} />
        <MetricDisplay label="段落数" value={book.paragraphs.length} />
        <MetricDisplay label="句子数" value={book.sc} />
      </FlexRow>
    </>
  )
}

const Cover = () => {
  const id = useBook()
  const book = useAtomValue(bookAtom(id)).unwrap()!

  return (
    <AIImage
      req={
        {
          type: AIImgType.BookCover,
          params: {
            title: book.title,
          },
        } as AIImgRequest<AIImgType.BookCover>
      }
      autoload={true}
      style={{
        maxWidth: "100%",
        boxSizing: "border-box",
        padding: 10,
        aspectRatio: "3/4",
        overflow: "hidden",
      }}
      imageStyle={{
        height: "100%",
      }}
    />
  )
}
