import OSS from "ali-oss"

const ossClient = new OSS({
  region: process.env.OSS_REGION as string,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID as string,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET as string,
  bucket: process.env.OSS_BUCKET as string,
})

const PUBLIC_RESOURCE_BASE = (
  process.env.PUBLIC_RESOURCE_URL ?? "https://book.skedo.cn"
).replace(/\/+$/, "")

export async function uploadJsonToOSS(
  key: string,
  jsonData: any
): Promise<string> {
  try {
    await ossClient.put(
      key,
      Buffer.from(JSON.stringify(jsonData)),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    return getPublicObjectUrl(key)
  } catch (error) {
    throw error
  }
}

export async function uploadFileToOSS(
  key: string,
  file: Buffer,
  contentType: string
): Promise<string> {
  try {
    console.log("before oss put", key, file)
    await ossClient.multipartUpload(key, file, {
      headers: {
        "Content-Type": contentType || "application/octet-stream",
      },
      partSize: 1024 * 1024, // 1MB
    })
    return getPublicObjectUrl(key)
  } catch (error) {
    throw error
  }
}

export function getPublicObjectUrl(key: string) {
  return `${PUBLIC_RESOURCE_BASE}/${key}`
}
