import { Logger } from "@pmate/utils"
import { splitSentenceEN } from "@pmate/lang"
import { Book, Chapter } from "@pmate/meta"
import JSZip from "jszip"
import { takeTextBetween } from "./getTextBetween"

const CHAPTER_FILTER_REGEXP =
  /(Introduction|Preface|Foreword|Note On The Text|^About)/i

interface NavDesc {
  file: string
  title: string
  frag?: string
}

interface EpubFile {
  content: string
}
const logger = Logger.getDebugger("parseEPUB")
export const parseEPUB = async (data: Blob, filename: string) => {
  const zip = await JSZip.loadAsync(data as Blob)
  const files = Object.keys(zip.files)
  const navFile = files.find((x) => x.endsWith(".ncx"))!
  const contentFile = files.find((x) => x.endsWith(".opf"))!

  const contentNav = await zip.file(navFile)?.async("string")
  const contentManifest = await zip.file(contentFile)?.async("string")

  if (contentNav && contentManifest) {
    const parser = new DOMParser()
    const navDoc = parser.parseFromString(contentNav, "application/xml")
    const nav = xmlToJson(navDoc)
    logger.log({ nav })
    const manifestDoc = parser.parseFromString(
      contentManifest,
      "application/xml"
    )
    const manifest = xmlToJson(manifestDoc)

    logger.log({ manifest })
    function findFile(file: string) {
      return files.find((x) => x.endsWith(file))!
    }

    const fileMap: {
      [key: string]: number
    } = {}
    const fileContents: string[] = []

    const fileList: string[] = manifest.manifest.item
      .map((x: any) => x["@href"])
      .filter((x: string) => x.match(/\.(html|htm|xhtml)$/))

    logger.log({ fileList })
    for (let i = 0; i < fileList.length; i++) {
      const name = fileList[i]
      const filePath = findFile(name)
      const content = (await zip.file(filePath)?.async("string")) || ""
      fileContents[i] = content
      fileMap[name] = i
    }

    const fileIndices: { [key: string]: number } = {}
    const author = manifest.metadata["dc:creator"]?.["#text"] || ""
    const descHTML = manifest.metadata["dc:description"]?.["#text"]
    const desc = descHTML ? textFromHTMLString(descHTML).join("\n") : ""
    const name = manifest.metadata["dc:title"]?.["#text"] || filename

    fileList.forEach((file, index) => {
      fileIndices[file] = index
    })

    const navPoint = nav.navMap.navPoint
    let navPoints: NavDesc[] = []
    if (!navPoint) {
      navPoints.push({
        file: fileList[0],
        title: "",
        frag: "",
      })
    } else {
      navPoints = (Array.isArray(navPoint) ? navPoint : [navPoint]).map(
        (x: any) => {
          const [file, frag] = x.content["@src"].split("#")
          logger.log("point", x, x.navLabel.text["#text"])
          const navPoint: NavDesc = {
            file,
            title: x.navLabel.text["#text"],
            frag,
          }
          return navPoint
        }
      )
    }
    console.log({ navPoints })

    async function sortChapters(navPoints: NavDesc[]) {
      const chapters: Chapter[] = []
      for (let i = 0; i < navPoints.length; i++) {
        const chapter: Chapter = {
          title: navPoints[i].title,
          paragraphs: [],
        }
        const current = navPoints[i]
        const next = navPoints[i + 1]
        const startIndex = fileMap[current.file]
        const endIndex = next
          ? next.frag
            ? fileMap[next.file]
            : Math.max(0, fileMap[next.file] - 1)
          : fileList.length - 1

        logger.log({ startIndex, endIndex, current, next })

        for (let j = startIndex; j <= endIndex; j++) {
          const html = fileContents[j]
          const id1 = startIndex === j ? current.frag : null
          const id2 = endIndex === j ? next?.frag : null
          const paragraphs = takeTextBetween(html, id1, id2)
          for (let paragraph of paragraphs) {
            if (paragraph.resources) {
              for (let resource of paragraph.resources) {
                if (resource.type === "image") {
                  const file = files.find((x) => x.includes(resource.uri))
                  if (file) {
                    const content = await zip.file(file)!.async("base64")
                    resource.database64 = content
                  }
                }
              }
            }
          }
          chapter.paragraphs.push(...paragraphs)
        }
        chapters.push(chapter)
      }

      return chapters
    }

    const chapters = await sortChapters(navPoints)

    logger.log({ chapters })
    const book: Book = {
      author,
      desc: desc || "",
      name,
      lang: "en",
      chapters: chapters,
    }

    return book
  }
}

function textFromHTMLString(htmlStr: string, exclude: string[] = []) {
  if (htmlStr.indexOf("html") === -1) {
    htmlStr = `<html><body>${htmlStr}</body></html>`
  }
  const html = new DOMParser().parseFromString(htmlStr, "application/xml")
  const anchorTags = html.documentElement.getElementsByTagName("a")
  for (let i = 0; i < anchorTags.length; i++) {
    const anchorTag = anchorTags[i]
    anchorTag.parentNode?.removeChild(anchorTag)
  }
  const textContent =
    html.body?.textContent || html.documentElement.textContent || ""

  const paragraphsText = splitSentenceEN(textContent).filter(
    (x) => !exclude.includes(x.toLowerCase())
  )
  return paragraphsText as string[]
}

function xmlToJson(xml: Document): any {
  function traverse(node: Node): any {
    const obj: any = {}

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue?.trim()
      if (text) {
        return text
      } else {
        return null
      }
    } else {
      const childNodes = node.childNodes
      if (childNodes.length > 0) {
        for (let i = 0; i < childNodes.length; i++) {
          const childNode = childNodes[i]
          const nodeName = childNode.nodeName

          if (!obj[nodeName]) {
            obj[nodeName] = []
          }

          const childObj = traverse(childNode)
          if (childObj !== null) {
            obj[nodeName].push(childObj)
          }
        }
      }

      // @ts-ignore
      if (node.attributes) {
        // @ts-ignore
        for (let j = 0; j < node.attributes.length; j++) {
          // @ts-ignore
          const attribute = node.attributes[j]
          obj[`@${attribute.name}`] = attribute.value
        }
      }
    }

    // If the object only has one property and it's an array with one item, simplify it
    for (const key in obj) {
      if (obj[key] instanceof Array && obj[key].length === 1) {
        obj[key] = obj[key][0]
      }
    }

    return obj
  }

  return traverse(xml.documentElement)
}
