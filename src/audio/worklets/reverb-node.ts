export class ReverbNode extends ConvolverNode {
  private wetGain: GainNode;
  private dryGain: GainNode;
  private input: GainNode;
  private output: GainNode;

  constructor(context: AudioContext) {
    super(context);
    
    this.wetGain = context.createGain();
    this.dryGain = context.createGain();
    this.input = context.createGain();
    this.output = context.createGain();

    this.createDefaultImpulseResponse(context);

    this.input.connect(this);
    this.connect(this.wetGain);
    
    this.input.connect(this.dryGain); 
    
    this.wetGain.connect(this.output);
    this.dryGain.connect(this.output);

    this.wetGain.gain.value = 0.7;  // 70% wet
    this.dryGain.gain.value = 0.3;  // 30% dry
  }

  private async createDefaultImpulseResponse(context: AudioContext) {
    // Create a simple impulse response
    const length = context.sampleRate * 2.0; // 2 seconds
    const impulse = context.createBuffer(2, length, context.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.2));
      }
    }
    
    this.buffer = impulse;
  }

  public getInput(): AudioNode {
    return this.input;
  }

  public getOutput(): AudioNode {
    return this.output;
  }
  
  public setMix(wetAmount: number) {
    const wet = Math.min(1, Math.max(0, wetAmount));
    const dry = 1 - wet;
    
    this.wetGain.gain.setValueAtTime(wet, this.context.currentTime);
    this.dryGain.gain.setValueAtTime(dry, this.context.currentTime);
  }
} 