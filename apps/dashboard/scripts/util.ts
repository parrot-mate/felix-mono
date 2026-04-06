import OSS from "ali-oss"
import fs from "fs"
import path from "path"

const ossClient = new OSS({
  region: process.env.OSS_REGION as string,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID as string,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET as string,
  bucket: process.env.OSS_BUCKET as string,
})

export async function uploadDirectory(
  directoryPath: string,
  targetDir: string
) {
  const files = fs.readdirSync(directoryPath)

  for (const fileName of files) {
    const filePath = path.join(directoryPath, fileName)
    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      await uploadDirectory(filePath, path.join(targetDir, fileName))
    } else if (stats.isFile()) {
      await uploadFile(filePath, path.join(targetDir, fileName))
    }
  }
}

export async function uploadFile(filePath: string, targetPath: string) {
  const ext = path.extname(filePath)
  let contentType = ""
  switch (ext) {
    case ".js":
      contentType = "application/javascript"
      break
    case ".css":
      contentType = "text/css"
      break
    case ".html":
      contentType = "text/html"
      break
    case ".apk":
      contentType = "application/vnd.android.package-archive"
      break
  }
  try {
    const result = await ossClient.put(targetPath, filePath, {
      headers: {
        ["Content-Type"]: contentType,
      },
    })
    console.log("Upload Success:", result.url)
  } catch (error) {
    console.error("Upload Error:", error)
  }
}
