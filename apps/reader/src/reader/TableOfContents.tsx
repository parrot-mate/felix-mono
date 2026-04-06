import { bookAtom } from "@pmate/sdk"
import { pageWCAtom } from "@/atom/reading/pageWCAtom"
import { readerStateAtom } from "@/atom/reading/readerStateAtom"
import { useBook } from "@pmate/sdk"

import { profileAtom } from "@pmate/account-sdk"
import { paragraphReadAtom } from "@pmate/sdk"
import { Page, ReaderState, ReadingBook } from "@pmate/meta"
import { Logger } from "@pmate/utils"
import { useAtomValue } from "jotai"
import { useNavigate } from "react-router"
import { PunchProgressItem } from "./PunchProgressItem"

const logger = Logger.getDebugger("TableOfContents")
export const TableOfContents = ({ onChange }: { onChange?: () => void }) => {
  const id = useBook()
  const book = useAtomValue(bookAtom(id))
  const stateMgr = useAtomValue(readerStateAtom(id))

  if (book.isNothing()) {
    return null
  }

  return book
    .map((book) => {
      return (
        <Inner onChange={onChange} book={book} state={stateMgr.getState()} />
      )
    })
    .unwrapOr(null)
}

const Inner = ({
  book,
  onChange,
  state,
}: {
  book: ReadingBook
  onChange?: () => void
  state: ReaderState
}) => {
  const sections = book.punchPages.reduce((acc, page) => {
    if (page.paragraphs.some((x) => x.chapterTitle)) {
      acc.push([])
    }
    if (acc.length === 0) {
      acc.push([])
    }
    acc[acc.length - 1].push(page)
    return acc
  }, [] as Page[][])

  return (
    <>
      {sections.map((section, i) => {
        const el = section[0].paragraphs.find((x) => x.chapterTitle)
        return (
          <div key={i}>
            {el && <h3>{el.chapterTitle}</h3>}
            <div className="grid grid-cols-3 sm:grid-cols-4">
              {section.map((page) => {
                return (
                  <ContentItem
                    onChange={onChange}
                    page={page}
                    readerState={state}
                    key={page.index}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}

const ContentItem = ({
  page,
  readerState,
  onChange,
}: {
  page: Page
  readerState: ReaderState
  onChange?: () => void
}) => {
  const id = useBook()
  const params = {
    id,
    index: page.index,
  }
  const nav = useNavigate()
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const readed = useAtomValue(
    paragraphReadAtom({
      bookId: id,
      user: userId,
    })
  )
  const book = useAtomValue(bookAtom(id)).unwrap()
  const pageNo = book.paragraphsPageMap.get(readerState.pid)
  const active = pageNo === page.index
  const chapters = page.paragraphs.map((x) => x.chapterTitle).filter((x) => x)
  const wc = useAtomValue(pageWCAtom(params))
  const finished = page.paragraphs.reduce(
    (acc, x) => (readed[x.index] ? acc + 1 : acc),
    0
  )
  const percent = (finished * 100) / page.paragraphs.length

  return (
    <div className="my-1 mx-1" id={`page-item-${page.index}`}>
      <PunchProgressItem
        active={active}
        index={page.index}
        percent={percent}
        chapters={chapters}
        onClick={() => {
          const paraWithChapterTitle = page.paragraphs.find(
            (x) => x.chapterTitle
          )

          if (paraWithChapterTitle) {
            nav(`/reader/TearMode/${id}/${paraWithChapterTitle.index}`, {
              replace: true,
            })
          } else {
            nav(`/reader/TearMode/${id}/${page.paragraphs[0].index}`, {
              replace: true,
            })
          }

          onChange?.()
        }}
        wc={wc.unwrapOr(0)}
      />
    </div>
  )
}
