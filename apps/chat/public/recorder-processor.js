const chunkSize = 960 * 3

class RecorderProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    this.chunkBuffer = new Float32Array(chunkSize)
    this.chunkIndex = 0
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]

    if (!input || !input[0] || input[0].length === 0) {
      return true
    }

    const samples = input[0]
    let sampleIndex = 0

    while (sampleIndex < samples.length) {
      const remainingChunkSpace = chunkSize - this.chunkIndex
      const samplesLeft = samples.length - sampleIndex
      const copyCount = Math.min(remainingChunkSpace, samplesLeft)

      this.chunkBuffer.set(samples.subarray(sampleIndex, sampleIndex + copyCount), this.chunkIndex)
      this.chunkIndex += copyCount
      sampleIndex += copyCount

      if (this.chunkIndex === chunkSize) {
        const pcm = convertToPCM(this.chunkBuffer)
        this.chunkIndex = 0
        this.port.postMessage(
          {
            type: "pcm",
            data: pcm,
          },
          [pcm.buffer]
        )
      }
    }
    return true
  }
}

function convertToPCM(inputBuffer) {
  const pcmArray = new Int16Array(inputBuffer.length)

  for (let i = 0; i < inputBuffer.length; i++) {
    // Clamp the sample value to the -1 to 1 range
    const pcmSample = Math.max(-1, Math.min(1, inputBuffer[i]))
    pcmArray[i] = Math.floor(pcmSample * 32767)
  }

  return pcmArray
}

registerProcessor("recorder-processor", RecorderProcessor)
