export class ReverbNode {
  private input: GainNode
  private output: GainNode
  private wetGain: GainNode
  private dryGain: GainNode
  private convolver: ConvolverNode
  private context: AudioContext

  constructor(context: AudioContext) {
    this.context = context
    this.input = context.createGain()
    this.output = context.createGain()
    this.wetGain = context.createGain()
    this.dryGain = context.createGain()
    this.convolver = context.createConvolver()

    // Create default impulse response
    this.createDefaultImpulseResponse()

    // Set up signal path
    this.input.connect(this.convolver)
    this.convolver.connect(this.wetGain)
    this.input.connect(this.dryGain)
    this.wetGain.connect(this.output)
    this.dryGain.connect(this.output)

    // Default Dry/Wet setting
    this.setMix(0.5) // 50/50 mix
  }

  private async createDefaultImpulseResponse() {
    const length = this.context.sampleRate * 4 // 4 seconds of reverb
    const impulse = this.context.createBuffer(2, length, this.context.sampleRate)
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.1))
      }
    }

    this.convolver.buffer = impulse
  }

  setMix(value: number) {
    const wetGain = value
    const dryGain = 1 - value
    
    this.wetGain.gain.setValueAtTime(wetGain, this.context.currentTime)
    this.dryGain.gain.setValueAtTime(dryGain, this.context.currentTime)
  }

  getInput(): AudioNode {
    return this.input
  }

  getOutput(): AudioNode {
    return this.output
  }
} 