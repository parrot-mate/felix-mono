// @ts-ignore
import ffmpeg from "fluent-ffmpeg"
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg"
import { PassThrough, Writable } from "stream"
ffmpeg.setFfmpegPath(ffmpegInstaller.path)
export async function adjustVolume(
  buffer: Buffer,
  volume: number = 1
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const inputStream = new PassThrough()

    const buffers: Buffer[] = []
    const writableStream = new Writable({
      write(chunk, encoding, callback) {
        buffers.push(chunk)
        callback()
      },
    })

    ffmpeg(inputStream)
      // Setting the audio filter to adjust volume; volume can be a decimal for fractions like 0.5, or integers.
      .audioFilters({
        filter: "volume",
        options: {
          volume: volume,
        },
      })
      .format("mp3") // Assuming the input buffer is in mp3 format; adjust if necessary.
      .on("error", (err: any) => {
        reject(err)
      })
      .pipe(writableStream)

    writableStream.on("finish", () => resolve(Buffer.concat(buffers)))

    // Write your buffer and end the input stream so ffmpeg can start processing.

    inputStream.end(buffer)
    // inputStream.end()
  })
}
