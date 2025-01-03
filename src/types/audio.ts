export interface Track {
  id: number
  name: string
  file: string
  buffer: AudioBuffer | null
  source: AudioBufferSourceNode | null
  gain: GainNode | null
  effects: AudioEffect[]
}

export interface AudioEffect {
  id: string
  type: 'reverb' | 'decimator' | 'custom'
  node: AudioNode
  params: Record<string, number>
  bypass: boolean
}

export interface LoopRegion {
  start: number
  end: number
  enabled: boolean
}

export interface EffectParameter {
  name: string;
  value: number;
  min: number;
  max: number;
  default: number;
}

export interface Effect {
  name: string;
  node: AudioNode;
  bypass: boolean;
  output?: AudioNode;
  bypassGain?: GainNode;
  wetGain?: GainNode;
  parameters?: EffectParameter[];
} 