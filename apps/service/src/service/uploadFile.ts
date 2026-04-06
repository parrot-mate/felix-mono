import { POSS } from "../util/alioss"
import { sha1 } from "@pmate/service-core"
import { toWebp } from "../util/toWebp"

function base64ToUnicode(str: string) {
  // Decode from base64 to UTF-8 and then decode the URI component
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(str), function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
      })
      .join("")
  )
}

export async function uploadFile(
  base64: string,
  fileName: string,
  fileType: "image" | "html"
) {
  if (!fileName.match(/^[A-Za-z-_0-9]{32,64}$/)) {
    throw new Error("Invalid file name")
  }

  let buffer = Buffer.from(base64, "base64")
  const ext = fileType === "image" ? "webp" : "html"
  if (fileType === "html") {
    let text = base64ToUnicode(base64)
    text = await base64InHtmlToWebp(text)
    buffer = Buffer.from(text, "utf-8")
  } else if (fileType === "image") {
    buffer = await toWebp(buffer)
  }
  const key = `/upload-v1/${fileName}.${ext}`
  await POSS.publicOSS.uploadFileToOSS(key, buffer)
}

async function base64InHtmlToWebp(html: string) {
  const items: {
    base64: string
    hash: string
  }[] = []

  html = html.replace(/"data[^,]*,.*"/, (x: string) => {
    const base64 = x.split(",")[1]

    const hash = sha1(base64)
    items.push({
      base64,
      hash,
    })
    return `___${hash}___`
  })

  for (let item of items) {
    const buffer = Buffer.from(item.base64, "base64")
    const webp = await toWebp(buffer)
    const fileName = `upload-v1/${item.hash}.webp`
    const url = await POSS.publicOSS.uploadFileToOSS(fileName, webp)
    html = html.replace(`___${item.hash}___`, `'${url}'`)
  }
  return html
}
