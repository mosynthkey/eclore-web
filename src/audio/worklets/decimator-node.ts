export class DecimatorNode extends AudioWorkletNode {
  constructor(context: AudioContext) {
    super(context, 'decimator-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 2
    });
  }
}

export default DecimatorNode; 