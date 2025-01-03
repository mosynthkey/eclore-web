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

class TapeStopProcessor extends AudioWorkletProcessor {
  private buffer: Float32Array[][] = [[], []]
  private readPosition = 0
  private writePosition = 0
  private isActive = false
  private rate = 1.0
  private isSlowdown = false;

  constructor() {
    super()
    
    const bufferLength = sampleRate * 10
    this.buffer[0] = new Float32Array(bufferLength)
    this.buffer[1] = new Float32Array(bufferLength)

    this.port.onmessage = (event: MessageEvent) => {
      if (event.data.type === 'trigger') {
        this.isActive = true
        this.isSlowdown = !this.isSlowdown  // Switch mode
        if (this.isSlowdown) {
          this.rate = 1.0  // Initial value for slowdown mode
        } else {
          this.rate = 0.1  // Initial value for speedup mode
        }
      }
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0]
    const output = outputs[0]
    const bufferLength = this.buffer[0].length

    // Write input to buffer
    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel]
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[channel][this.writePosition] = inputChannel[i]
        this.writePosition = (this.writePosition + 1) % bufferLength
      }
    }

    if (this.isActive) {
      if (this.isSlowdown) {
        // Decrease rate
        this.rate = Math.max(0, this.rate - 0.001)
      } else {
        // Increase rate
        this.rate = Math.min(1, this.rate + 0.001)
      }
      
      for (let channel = 0; channel < output.length; channel++) {
        const outputChannel = output[channel]
        for (let i = 0; i < outputChannel.length; i++) {
          // Use linear interpolation to achieve smooth playback
          const pos = Math.floor(this.readPosition)
          const frac = this.readPosition - pos
          const pos1 = pos % bufferLength
          const pos2 = (pos + 1) % bufferLength
          
          outputChannel[i] = this.buffer[channel][pos1] * (1 - frac) + 
                            this.buffer[channel][pos2] * frac
          
          this.readPosition += this.rate
          if (this.readPosition >= bufferLength) {
            this.readPosition = 0
          }
        }
      }

      if ((this.isSlowdown && this.rate <= 0) || (!this.isSlowdown && this.rate >= 1)) {
        this.isActive = false
        this.rate = 1.0
      }
    } else {
      for (let channel = 0; channel < output.length; channel++) {
        output[channel].set(input[channel])
      }
      this.readPosition = this.writePosition
    }

    return true
  }
}

registerProcessor('tape-stop-processor', TapeStopProcessor)
export default {} 