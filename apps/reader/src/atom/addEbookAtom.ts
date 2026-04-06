import { profileAtom } from "@pmate/account-sdk"
import { ProfileService } from "@pmate/sdk"
import { LibraryItem, LogType } from "@pmate/meta"
import { appendUserLogAtom, createUserLog, PipelineWorkerClient } from "@pmate/sdk"
import { blobToBase64, fileSha1, Logger } from "@pmate/utils"
import { atom } from "jotai"
import { removeBookCacheAtom } from "./myBooksAtom"

const logger = Logger.getDebugger("addEbookAtom")
export const addEbookAtom = atom(
  null,
  async (
    get,
    set,
    bookData: {
      blob: File
      name: string
      type: "text" | "mobi" | "pdf" | "epub"
    }
  ) => {
    const hash = await fileSha1(bookData.blob)
    const id = `local-${hash}`
    // const ids = get(localBookIdsAtom)
    // if (ids.includes(id)) {
    //   return
    // }
    const { name, blob, type } = bookData
    const book: LibraryItem = {
      id,
      cover: "",
      title: {
        en: name,
        cn: "",
      },
      author: "unknown",
      intro: "...",
      type:
        type === "pdf"
          ? "local-pdf"
          : type === "text"
          ? "local-txt"
          : "local-epub",
    }
    const profile = await get(profileAtom)
    const userId = profile?.id ?? ""
    const base64 = await blobToBase64(blob)
    const uploadUrl = await ProfileService.uploadUserFile({
      user: userId,
      base64,
      filename: `${id}.${type === "text" ? "txt" : type}`,
    })
    if (!uploadUrl) {
      throw new Error("upload failed")
    }
    const ebookLink = uploadUrl
    const pipeline = await PipelineWorkerClient.current()
    const link = await pipeline.run("@gpt#1", {
      type: "parse",
      params: { type, url: ebookLink, name, id },
    })
    if (!link) {
      throw new Error("解析失败")
    }
    logger.log("ebook link", link)
    book.link = link
    book.type = "remote-json"
    const log = await createUserLog(
      LogType.Books,
      { op: 0, book },
      userId
    )
    await set(removeBookCacheAtom, id)
    await set(appendUserLogAtom, log)
  }
)
