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
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0]
    const output = outputs[0]

    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel]
      const outputChannel = output[channel]

      for (let i = 0; i < inputChannel.length; i++) {
        outputChannel[i] = Math.tanh(inputChannel[i])
      }
    }

    return true
  }
}

registerProcessor('distortion-processor', DistortionProcessor) 