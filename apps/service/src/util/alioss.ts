import OSS, { AppendObjectOptions } from "ali-oss"

import fetch from "node-fetch"
import { toWebp } from "./toWebp"

export class POSS {
  private client: OSS

  constructor(options: OSS.Options) {
    this.client = new OSS(options)
  }

  static publicOSS = new POSS({
    region: process.env.OSS_REGION as string,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID as string,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET as string,
    bucket: process.env.OSS_BUCKET as string,
  })

  static privateOSS = new POSS({
    region: process.env.PRV_OSS_REGION as string,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID as string,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET as string,
    bucket: process.env.PRV_BUCKET as string,
  })

  async uploadJsonToOSS(
    key: string,
    jsonData: any
  ): Promise<OSS.PutObjectResult> {
    try {
      const result = await this.client.put(
        key,
        Buffer.from(JSON.stringify(jsonData)),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      return result
    } catch (error) {
      console.error("Upload error:", error)
      throw error
    }
  }

  async downloadToOSS(key: string, url: string): Promise<string> {
    const response = await fetch(url)
    if (!response.ok)
      throw new Error(`Failed to download: ${response.statusText}`)
    const buffer = await response.buffer()
    console.log("download success")
    try {
      const webpImage = await toWebp(buffer)
      return this.uploadFileToOSS(key, webpImage)
    } catch (ex) {
      throw ex
    }
  }

  async removeOSS(key: string) {
    try {
      const result = await this.client.delete(key)
      console.log("Remove success:", result)
      return result
    } catch (error) {
      console.error("Remove error:", error)
      throw error
    }
  }

  async copyOSS(sourceKey: string, targetKey: string) {
    try {
      const result = await this.client.copy(targetKey, sourceKey)
      return result
    } catch (error) {
      console.error("Copy error:", error)
      throw error
    }
  }

  async existsOSS(key: string) {
    try {
      await this.client.head(key)
      return true
    } catch (e) {
      return false
    }
  }

  async appendJSONOSS<T>(key: string, content: T[], position: string) {
    try {
      const arg: AppendObjectOptions = {
        headers: {
          "Content-Type": "text/plain",
        },
      }
      arg.position = position

      const logs = content.map((x) => JSON.stringify(x)).join("\n") + "\n"

      const result = await this.client.append(key, Buffer.from(logs), arg)
      return result.nextAppendPosition
    } catch (error) {
      throw error
    }
  }

  async getHeadPosition(key: string) {
    try {
      const head = await this.client.head(key)
      if (!head) {
        return "0"
      }
      // @ts-ignore
      return head.res.headers["content-length"]
    } catch {
      return "0"
    }
  }

  async uploadFileToOSS(key: string, file: Buffer): Promise<string> {
    let fileType = "text/plain"
    if (key.endsWith(".json")) {
      fileType = "application/json"
    } else if (key.endsWith(".jpg") || key.endsWith(".jpeg")) {
      fileType = "image/jpeg"
    } else if (key.endsWith(".webp")) {
      fileType = "image/webp"
    } else if (key.endsWith(".webm")) {
      fileType = "video/webm"
    } else if (key.endsWith(".mp3")) {
      fileType = "audio/mpeg"
    } else if (key.endsWith(".html")) {
      fileType = "text/html"
    } else if (key.endsWith(".pjson")) {
      fileType = "application/json"
    } else if (key.endsWith(".log")) {
      fileType = "text/plain"
    } else if (key.endsWith(".ico")) {
      fileType = "image/x-icon"
    } else if (key.endsWith(".apk")) {
      fileType = "application/vnd.android.package-archive"
    } else {
      throw new Error("Unsupported file type")
    }

    try {
      await this.client.put(key, file, {
        headers: {
          "Content-Type": fileType,
        },
      })
      const url = `https://book.skedo.cn/${key}`
      console.log("Upload success:", url)
      return url
    } catch (error) {
      console.error("Upload error:", error)
      throw error
    }
  }

  async getResourceOSS<T>(key: string): Promise<T | null> {
    try {
      const result = await this.client.get(key)
      if (result.res.status === 200) {
        return JSON.parse(result.content.toString()) as T
      } else {
        return null
      }
    } catch (e) {
      // console.error("Get resource error:", e)
      return null
    }
  }

  async getResourceBufferOSS<T>(key: string): Promise<string | null> {
    try {
      const result = await this.client.get(key)
      if (result.res.status === 200 && result.content) {
        const buffer = result.content as Buffer
        return buffer.toString("base64")
      } else {
        return null
      }
    } catch (e) {
      // console.error("Get resource error:", e)
      return null
    }
  }

  async getResourceLogOSS<T>(key: string): Promise<T[]> {
    try {
      const result = await this.client.get(key)
      if (result.res.status === 200) {
        const content: string = result.content.toString()
        const lines = content.split("\n").filter((x) => x)
        return lines.map((x) => {
          return JSON.parse(x) as T
        })
      } else {
        return []
      }
    } catch (e) {
      // console.log(e)
      // console.error("Get resource error:", e)
      return []
    }
  }

  async uploadImageToOSS(
    key: string,
    base64data: string
  ): Promise<OSS.PutObjectResult> {
    const buffer = Buffer.from(base64data.split(",")[1], "base64")
    try {
      const result = await this.client.put(key, buffer, {
        headers: {
          "Content-Type": "image/jpeg",
        },
      })
      console.log("Upload image success:", result.url)
      return result
    } catch (error) {
      console.error("Upload image error:", error)
      throw error
    }
  }

  async listFilesInOSSPath(
    s3Path: string,
    limit: number = -1
  ): Promise<string[]> {
    let fileList: string[] = []
    let marker: string | undefined

    try {
      do {
        const result = await this.client.list(
          {
            prefix: s3Path,
            marker: marker,
            "max-keys": 1000,
          },
          {}
        )

        const files = result.objects?.map((obj) => obj.name) ?? []
        fileList = fileList.concat(files)
        if (limit > 0 && fileList.length >= limit) {
          break
        }

        // Update marker if there are more files to fetch
        marker = result.nextMarker
      } while (marker)

      return fileList
    } catch (error) {
      throw error
    }
  }
}
