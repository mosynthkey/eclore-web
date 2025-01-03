export class DistortionNode extends AudioWorkletNode {
  constructor(context: AudioContext) {
    super(context, 'distortion-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 2,
      channelCountMode: 'explicit'
    })
  }

  setDrive(value: number) {
    this.port.postMessage({
      type: 'setDrive',
      value: value
    })
  }
}

export default DistortionNode 