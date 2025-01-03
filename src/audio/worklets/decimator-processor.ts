declare var AudioWorkletProcessor: {
  prototype: AudioWorkletProcessor
  new (): AudioWorkletProcessor
}
declare var registerProcessor: (
  name: string,
  processorCtor: typeof AudioWorkletProcessor
) => void
declare var sampleRate: number

interface AudioWorkletProcessor {
  readonly port: MessagePort
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean
}

class DecimatorProcessor extends AudioWorkletProcessor {
  private bits = 16
  private rate = 1
  private lastSample = 0
  private skipCounter = 0

  constructor() {
    super()
    this.port.onmessage = (event: MessageEvent) => {
      if (event.data.type === 'setBits') {
        this.bits = event.data.value
      } else if (event.data.type === 'setRate') {
        this.rate = event.data.value
      }
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0]
    const output = outputs[0]

    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel]
      const outputChannel = output[channel]

      for (let i = 0; i < inputChannel.length; i++) {
        // レート削減
        if (this.skipCounter <= 0) {
          // ビット深度削減
          const step = 2 ** (this.bits - 1)
          this.lastSample = Math.round(inputChannel[i] * step) / step
          this.skipCounter = Math.floor(1 / this.rate)
        } else {
          this.skipCounter--
        }
        outputChannel[i] = this.lastSample
      }
    }

    return true
  }
}

registerProcessor('decimator-processor', DecimatorProcessor)
export default {} 