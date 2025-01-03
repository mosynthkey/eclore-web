export class TapeStopNode extends AudioWorkletNode {
  constructor(context: AudioContext) {
    super(context, 'tape-stop-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 2,
      channelCountMode: 'explicit'
    })
  }

  trigger() {
    this.port.postMessage({ type: 'trigger' })
  }
} 