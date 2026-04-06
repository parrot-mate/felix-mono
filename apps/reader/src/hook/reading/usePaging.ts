import { bookAtom } from "@pmate/sdk"
import { readerStateAtom } from "@/atom/reading/readerStateAtom"
import { readingRecordAtom } from "@/atom/reading/readingRecordAtom"
import { PageMode } from "@pmate/meta"
import { Logger } from "@pmate/utils"
import { useAtomValue, useSetAtom } from "jotai"
import { useSnackbar } from "@pmate/uikit"
import { useNavigate, useParams } from "react-router"
export const useContinueRead = (id: string) => {
  const readerStateMgr = useAtomValue(readerStateAtom(id))
  const book = useAtomValue(bookAtom(id)).unwrap()
  const { goTo } = usePaging(id)

  const continueRead = async () => {
    const state = readerStateMgr.getState()
    const pageNo = book.paragraphsPageMap.get(state.pid)
    await goTo(pageNo || 0)
  }

  return {
    continueRead,
  }
}
export const useContinueReadForTearMode = (id: string) => {
  const records = useAtomValue(readingRecordAtom(id))

  const continueReadForTearMode = async () => {}
}

const logger = Logger.getDebugger("usePaging")
export const usePaging = (id: string) => {
  const pageNo = parseInt(useParams().page || "0")
  const nav = useNavigate()
  const stateMgr = useAtomValue(readerStateAtom(id))
  const { enqueueSnackbar } = useSnackbar()
  const book = useAtomValue(bookAtom(id)).unwrap()

  const goTo = async (pageNo: number, replace = true) => {
    if (pageNo >= 0 && pageNo < book.punchPages.length) {
      await stateMgr.updatePage(pageNo)
      // await setReaderState((v) => {
      //   v.pageNo = pageNo
      //   return v
      // })
      nav(`/reader/punchmode/${id}/${pageNo}`, { replace })
    } else if (pageNo < 0) {
      enqueueSnackbar("已经是第一页了", { variant: "info" })
    } else if (pageNo >= book.punchPages.length) {
      enqueueSnackbar("已经是最后一页了", { variant: "info" })
    }
  }

  const nextPage = async () => {
    await goTo(pageNo + 1)
  }
  const prevPage = async () => {
    await goTo(pageNo - 1)
  }
  return {
    pageNo,
    nextPage,
    prevPage,
    goTo,
  }
}
