export const LSKEY_POS_ON_PAGE = (bookId: string, page: number) =>
  bookKey(bookId, `pos-on-page-${page}`)
export const LSKEY_CURRENT_PAGE = "current-page"
export const LSKEY_READED = "readed"

const bookKey = (bookId: string, key: string) => {
  return bookId + "." + key
}

export function getReadList(bookId: string) {
  const readed = localStorage.getItem(bookKey(bookId, LSKEY_READED))
  return (readed ? JSON.parse(readed) : []) as string[]
}

export function setReadingList(bookId: string, list: string[]) {
  localStorage.setItem(bookKey(bookId, LSKEY_READED), JSON.stringify(list))
}

export function getCurrentPage(booKId: string) {
  return Number.parseInt(
    localStorage.getItem(bookKey(booKId, "current-page")) || "0"
  )
}

export function setCurrentPage(bookId: string, page: number) {
  localStorage.setItem(bookKey(bookId, LSKEY_CURRENT_PAGE), page + "")
}

export function setLastScrollPosition(
  bookId: string,
  page: number,
  pos: number
) {
  localStorage.setItem(LSKEY_POS_ON_PAGE(bookId, page), pos + "")
}

export function getLastScrollPosition(bookId: string, page: number) {
  return Number.parseInt(
    localStorage.getItem(LSKEY_POS_ON_PAGE(bookId, page)) || "0"
  )
}

export function savePdfZoom(zoom: number) {
  localStorage.setItem(`pdf-zoom`, zoom + "")
}

export function getPdfZoom() {
  return Number.parseFloat(localStorage.getItem(`pdf-zoom`) || "1")
}

export function savePDFLastScroll(pdf: string, pos: number) {
  localStorage.setItem(`pdf-scroll-1:${pdf}`, pos + "")
}

export function getPDFLastScroll(pdf: string) {
  return Number.parseFloat(localStorage.getItem(`pdf-scroll-1:${pdf}`) || "0")
}

export function getMyBooks() {
  const myBooks = localStorage.getItem("my-books")
  return (myBooks ? JSON.parse(myBooks) : []) as string[]
}

export function setMyBooks(books: string[]) {
  localStorage.setItem("my-books", JSON.stringify(books))
}

export function lsSetFontSize(fontSize: number) {
  localStorage.setItem("user-font-size", fontSize + "")
}

export function lsGetFontSize() {
  const screenWidth = window.innerWidth
  let fs = 16
  if (screenWidth > 800) {
    fs = 24
  }
  return Number.parseInt(localStorage.getItem("user-font-size") || fs + "")
}
