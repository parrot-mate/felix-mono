export class VideoManager {
  private stream: MediaStream | null = null
  private __promise: Promise<MediaStream | null> | null = null
  private constructor() {}

  public start() {
    if (this.__promise) {
      return this.__promise
    }
    const p = new Promise<MediaStream | null>(async (resolve) => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "environment",
          },
        })
        this.stream = stream
        // const videTrack = stream?.getVideoTracks()[0]
        // if (videoTrack) {
        //   await videoTrack.applyConstraints({
        //     // @ts-ignore
        //     advanced: [{ zoom: 1 }],
        //   })
        // }
        resolve(stream)
      }
    })
    this.__promise = p
    return p
  }

  captureImage(): void {
    const videoElement = document.getElementById("video") as HTMLVideoElement
    const canvasElement = document.createElement("canvas")
    videoElement.onloadedmetadata = () => {
      canvasElement.width = videoElement.videoWidth
      canvasElement.height = videoElement.videoHeight

      const context = canvasElement.getContext("2d")!
      context.drawImage(
        videoElement,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      )

      const imageDataUrl = canvasElement.toDataURL("image/png")
      console.log("Image Captured as Data URL:", imageDataUrl)

      canvasElement.toBlob((blob) => {
        if (blob) {
          console.log("Image Captured as Blob:", blob)
        }
      }, "image/png")
    }
  }

  public async dispose() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop()
      })
      this.stream = null
      this.__promise = null
    }
  }

  public static ocr = new VideoManager()
}
