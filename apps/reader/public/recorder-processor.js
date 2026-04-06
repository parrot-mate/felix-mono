const chunkSize = 960 * 3

class RecorderProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    this.buffer = [] // To accumulate samples before processing
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    this.port.postMessage({
      type: "log",
      data: inputs,
    })

    if (input && input[0]) {
      const inputBuffer = input[0]

      // Instead of using spread operator, push samples one-by-one (Safari-friendly)
      for (let i = 0; i < inputBuffer.length; i++) {
        this.buffer.push(inputBuffer[i])
      }

      // If we have enough samples, process and send them
      if (this.buffer.length >= chunkSize) {
        const chunk = this.buffer.splice(0, chunkSize) // Get the first chunkSize samples

        const pcm = convertToPCM(chunk)
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
