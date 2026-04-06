import fetch from "node-fetch"
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"

const s3Client = new S3Client({
  region: "ap-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
})

export async function copyObject(
  sourceKey: string,
  destKey: string,
  bucket = "gptdict"
) {
  const copyParams = {
    CopySource: `${bucket}/${sourceKey}`, // Specify the source bucket and key
    Bucket: bucket, // Specify the destination bucket
    Key: destKey, // Specify the destination object key (path and filename)
  }

  await s3Client.send(new CopyObjectCommand(copyParams))
}

export async function existS3(
  key: string,
  bucketName = "gptdict"
): Promise<boolean> {
  const command = new HeadObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  try {
    await s3Client.send(command)
    return true // If the command succeeds, the key exists
  } catch (error) {
    return false
    // if (error.name === "NotFound") {
    //   return false // If a NotFound error is caught, the key does not exist
    // }
    // console.error("Error", error)
    // throw error // Re-throw other errors that may need handling
  }
}

// Create an S3 instance
export async function uploadJsonToS3(
  key: string,
  jsonData: any,
  bucketName = "gptdict"
) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: JSON.stringify(jsonData),
    ContentType: "application/json",
  })

  try {
    const data = await s3Client.send(command)
    return data
  } catch (error) {
    console.error("Error", error)
    throw error
  }
}

export async function getResource<T>(key: string) {
  const url = `https://gptdict.s3.ap-east-1.amazonaws.com/${key}`
  try {
    const resp = await fetch(url)
    return (await resp.json()) as T
  } catch (e) {
    return null
  }
}

export async function downloadToS3(key: string, url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(`Failed to download: ${response.statusText}`)
  const buffer = await response.buffer()
  return uploadImageToS3(key, buffer)
}

export const uploadImageToS3 = async (
  key: string,
  buffer: Buffer,
  bucketName = "gptdict"
) => {
  const contentType = "image/jpeg" // Assuming the image is a JPEG

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })

  try {
    const data = await s3Client.send(command)
    return `https://book.skedo.cn/${key}`
  } catch (error) {
    console.error("Error", error)
    throw error
  }
}

export const removeFileFromS3 = async (key: string, bucketName = "gptdict") => {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  try {
    const data = await s3Client.send(command)
    console.log("Success", data)
    return data
  } catch (error) {
    console.error("Error", error)
    throw error
  }
}

export async function listFilesInS3Path(
  s3Path: string,
  bucketName: string = "gptdict"
): Promise<string[]> {
  const files: string[] = []

  const params: any = {
    Bucket: bucketName,
    Prefix: s3Path,
  }

  try {
    let isTruncated = true
    let continuationToken = undefined

    while (isTruncated) {
      if (continuationToken) {
        params["ContinuationToken"] = continuationToken
      }

      const response = await s3Client.send(new ListObjectsV2Command(params))
      const objects = response.Contents || []

      for (const object of objects) {
        files.push(object.Key || "")
      }

      isTruncated = response.IsTruncated || false
      continuationToken = response.NextContinuationToken
    }

    return files
  } catch (error) {
    console.error("Error listing files:", error)
    throw error
  }
}
