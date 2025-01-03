export class PlaybackNode extends AudioWorkletNode {
  private sampleRate: number
  private currentTime = 0
  private onTimeUpdate: ((time: number) => void) | null = null

  constructor(context: AudioContext) {
    super(context, 'playback-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      channelCount: 2,
      channelCountMode: 'explicit'
    })

    this.sampleRate = context.sampleRate

    this.port.onmessage = (event) => {
      if (event.data.type === 'position') {
        this.currentTime = event.data.position / event.data.sampleRate
        this.onTimeUpdate?.(this.currentTime)
      }
    }
  }

  loadBuffer(buffer: AudioBuffer) {
    // Get channel data from AudioBuffer
    const channels: Float32Array[] = []
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i))
    }
    
    // Send buffer to worklet
    this.port.postMessage({
      type: 'loadBuffer',
      buffer: channels
    })
  }

  play(position = 0) {
    this.port.postMessage({
      type: 'play',
      position
    })
  }

  pause() {
    this.port.postMessage({
      type: 'pause'
    })
  }

  seek(position: number) {
    this.port.postMessage({
      type: 'seek',
      position: Math.floor(position * this.sampleRate)
    })
  }

  setTimeUpdateCallback(callback: (time: number) => void) {
    this.onTimeUpdate = callback
  }

  getCurrentTime() {
    return this.currentTime
  }
} 