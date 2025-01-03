class DecimatorProcessor extends AudioWorkletProcessor {
  private skipSamples = 0;
  private lastSample = 0;
  
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];
    
    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      
      for (let i = 0; i < inputChannel.length; i++) {
        if (this.skipSamples <= 0) {
          this.lastSample = inputChannel[i];
          this.skipSamples = 3; // サンプルレートを1/4に減少
        } else {
          this.skipSamples--;
        }
        outputChannel[i] = this.lastSample;
      }
    }
    
    return true;
  }
}

registerProcessor('decimator-processor', DecimatorProcessor); 