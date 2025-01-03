export class DecimatorNode extends AudioWorkletNode {
  constructor(context: AudioContext) {
    super(context, 'decimator-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 2,
      channelCountMode: 'explicit'
    });
  }

  setBits(value: number) {
    this.port.postMessage({
      type: 'setBits',
      value: value
    });
  }

  setRate(value: number) {
    this.port.postMessage({
      type: 'setRate',
      value: value
    });
  }
}

export default DecimatorNode; 