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

class DistortionProcessor extends AudioWorkletProcessor {
  private drive = 1

  constructor() {
    super()
    this.port.onmessage = (event: MessageEvent) => {
      if (event.data.type === 'setDrive') {
        this.drive = event.data.value
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
        const x = inputChannel[i] * this.drive
        outputChannel[i] = Math.tanh(x)
      }
    }

    return true
  }
}

registerProcessor('distortion-processor', DistortionProcessor)
export default {} 