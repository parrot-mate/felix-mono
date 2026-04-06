import OSS from "ali-oss"
import fs from "fs"
import path from "path"

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const ossClient = new OSS({
  region: requireEnv("OSS_REGION"),
  accessKeyId: requireEnv("OSS_ACCESS_KEY_ID"),
  accessKeySecret: requireEnv("OSS_ACCESS_KEY_SECRET"),
  bucket: requireEnv("OSS_BUCKET"),
})

export async function uploadDirectory(directoryPath, targetDir) {
  const entries = fs.readdirSync(directoryPath)

  for (const entryName of entries) {
    const entryPath = path.join(directoryPath, entryName)
    const stats = fs.statSync(entryPath)

    if (stats.isDirectory()) {
      await uploadDirectory(entryPath, path.join(targetDir, entryName))
    } else if (stats.isFile()) {
      await uploadFile(entryPath, path.join(targetDir, entryName))
    }
  }
}

export async function uploadFile(filePath, targetPath) {
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
    const headers = {}
    if (contentType) {
      headers["Content-Type"] = contentType
    }

    const result = await ossClient.put(targetPath, filePath, {
      headers,
    })

    console.log("Upload Success:", result.url)
  } catch (error) {
    console.error("Upload Error:", error)
    throw error
  }
}
