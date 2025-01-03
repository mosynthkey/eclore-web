class PlaybackProcessor extends AudioWorkletProcessor {
  private buffer: Float32Array[] | null = null
  private position = 0
  private isPlaying = false
  
  constructor() {
    super()
    
    this.port.onmessage = (event) => {
      if (event.data.type === 'loadBuffer') {
        this.buffer = event.data.buffer
      } else if (event.data.type === 'play') {
        this.isPlaying = true
        this.position = event.data.position || 0
      } else if (event.data.type === 'pause') {
        this.isPlaying = false
      } else if (event.data.type === 'seek') {
        console.log('Seek', event.data.position)
        this.position = event.data.position
      } else if (event.data.type === 'getPosition') {
        this.port.postMessage({ 
          type: 'position',
          position: this.position,
          sampleRate: sampleRate
        })
      }
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    if (!this.buffer || !this.isPlaying) return true

    const output = outputs[0]
    const bufferLength = this.buffer[0].length

    for (let channel = 0; channel < output.length; channel++) {
      const outputChannel = output[channel]
      const bufferChannel = this.buffer[channel]

      for (let i = 0; i < outputChannel.length; i++) {
        if (this.position >= bufferLength) {
          this.position = 0
          this.port.postMessage({ type: 'loop' })
        }
        outputChannel[i] = bufferChannel[this.position]
        this.position++
      }
    }

    if (this.position % 4096 === 0) {
      this.port.postMessage({ 
        type: 'position',
        position: this.position,
        sampleRate: sampleRate
      })
    }

    return true
  }
}

registerProcessor('playback-processor', PlaybackProcessor) 