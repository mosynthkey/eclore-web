import type { Track, LoopRegion, EffectParameter } from '../types/audio'
import { PlaybackNode } from './worklets/playback-node'
import { DistortionNode } from './worklets/distortion-node'
import { DecimatorNode } from './worklets/decimator-node'
import { ReverbNode } from './worklets/reverb-node'
import bass from '../assets/music/demo/Bass.mp3'
import drums from '../assets/music/demo/Drums.mp3'
import perc from '../assets/music/demo/Perc.mp3'
import stab from '../assets/music/demo/Stab.mp3'
import { TapeStopNode } from './worklets/tape-stop-node'
import playbackProcessorUrl from './worklets/playback-processor.ts?worker&url'
import distortionProcessorUrl from './worklets/distortion-processor.ts?worker&url'
import decimatorProcessorUrl from './worklets/decimator-processor.ts?worker&url'
import tapeStopProcessorUrl from './worklets/tape-stop-processor.ts?worker&url'

interface Effect {
  name: string;
  node: AudioNode;
  bypass: boolean;
  output?: AudioNode;
  bypassGain?: GainNode;
  wetGain?: GainNode;
  parameters?: EffectParameter[];
}

export class AudioPlayer {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private tracks: Track[] = []
  private isPlaying = false
  private currentTime = 0
  private duration = 0
  private animationFrame: number | null = null
  private loopRegion: LoopRegion = {
    start: 0,
    end: 0,
    enabled: false
  }
  private playbackNodes: Map<number, PlaybackNode> = new Map()
  private mixBus: GainNode | null = null
  public effectChain: Effect[] = []
  private reverbNode: ReverbNode | null = null

  async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
      try {
        console.log(this.audioContext);
        console.log(this.audioContext.audioWorklet);
        await this.audioContext.audioWorklet.addModule(playbackProcessorUrl)
        await this.audioContext.audioWorklet.addModule(distortionProcessorUrl)
        await this.audioContext.audioWorklet.addModule(decimatorProcessorUrl)
        await this.audioContext.audioWorklet.addModule(tapeStopProcessorUrl)
        
        this.mixBus = this.audioContext.createGain()
        this.analyser = this.audioContext.createAnalyser()
        this.analyser.fftSize = 2048
        
        const distortion = new DistortionNode(this.audioContext)
        const decimator = new DecimatorNode(this.audioContext)
        const reverb = new ReverbNode(this.audioContext)
        const tapeStop = new TapeStopNode(this.audioContext)
        this.reverbNode = reverb
        
        this.effectChain = [
          {
            name: 'Distortion',
            node: distortion,
            bypass: true,
            bypassGain: this.audioContext.createGain(),
            wetGain: this.audioContext.createGain(),
            parameters: [
              {
                name: 'Drive',
                value: 1,
                min: 1,
                max: 8,
                default: 1
              }
            ]
          },
          {
            name: 'Decimator',
            node: decimator,
            bypass: true,
            bypassGain: this.audioContext.createGain(),
            wetGain: this.audioContext.createGain(),
            parameters: [
              {
                name: 'Bits',
                value: 16,
                min: 1,
                max: 16,
                default: 16
              },
              {
                name: 'Rate',
                value: 0.2,
                min: 0.01,
                max: 1,
                default: 1
              }
            ]
          },
          {
            name: 'Reverb',
            node: reverb.getInput(),
            output: reverb.getOutput(),
            bypass: true,
            bypassGain: this.audioContext.createGain(),
            wetGain: this.audioContext.createGain(),
            parameters: [
              {
                name: 'Dry/Wet',
                value: 0.5,
                min: 0,
                max: 1,
                default: 0.5
              }
            ]
          },
          {
            name: 'TapeStop',
            node: tapeStop,
            bypass: false,
            bypassGain: this.audioContext.createGain(),
            wetGain: this.audioContext.createGain(),
            parameters: []
          }
        ]
        
        let previousNode: AudioNode = this.mixBus
        this.effectChain.forEach(effect => {
          previousNode.connect(effect.bypassGain!)
          
          previousNode.connect(effect.wetGain!)
          effect.wetGain!.connect(effect.node)
          
          const nextNode = this.audioContext!.createGain()
          
          effect.bypassGain!.connect(nextNode)
          if (effect.output) {
            effect.node.connect(effect.output)
            effect.output.connect(nextNode)
          } else {
            effect.node.connect(nextNode)
          }
          
          previousNode = nextNode
        })
        
        previousNode.connect(this.analyser)
        this.analyser.connect(this.audioContext.destination)
        this.analyser.connect(this.audioContext.destination)

        this.effectChain.forEach(effect => this.updateEffectBypass(effect))
      } catch (error) {
        console.error('Failed to load AudioWorklet:', error)
      }
    }
  }

  private updateEffectBypass(effect: Effect) {
    if (!effect.bypassGain || !effect.wetGain) return
    
    if (effect.bypass) {
      effect.bypassGain.gain.setValueAtTime(1.0, this.audioContext!.currentTime)
      effect.wetGain.gain.setValueAtTime(0.0, this.audioContext!.currentTime)
    } else {
      effect.bypassGain.gain.setValueAtTime(0.0, this.audioContext!.currentTime)
      effect.wetGain.gain.setValueAtTime(1.0, this.audioContext!.currentTime)
    }
  }

  async loadTrack(filename: string) {
    if (!this.audioContext || !this.mixBus) return

    let audioUrl: string
    switch (filename) {
      case 'Bass.mp3':
        audioUrl = bass
        break
      case 'Drums.mp3':
        audioUrl = drums
        break
      case 'Perc.mp3':
        audioUrl = perc
        break
      case 'Stab.mp3':
        audioUrl = stab
        break
      default:
        throw new Error(`Unknown track: ${filename}`)
    }

    const response = await fetch(audioUrl)
    const audioData = await response.arrayBuffer()
    const audioBuffer = await this.audioContext.decodeAudioData(audioData)

    const playbackNode = new PlaybackNode(this.audioContext)
    playbackNode.loadBuffer(audioBuffer)
    
    playbackNode.setTimeUpdateCallback((time) => {
      this.currentTime = time
    })

    const track: Track = {
      id: this.tracks.length,
      name: filename,
      file: filename,
      buffer: audioBuffer,
      source: null,
      gain: this.audioContext.createGain(),
      effects: []
    }

    this.playbackNodes.set(track.id, playbackNode)
    this.tracks.push(track)
    this.duration = Math.max(this.duration, audioBuffer.duration)
    
    if (track.gain && this.mixBus) {
      playbackNode.connect(track.gain)
      track.gain.connect(this.mixBus)
    }

    return track
  }

  private updateTime = () => {
    if (!this.isPlaying) return

    this.animationFrame = requestAnimationFrame(this.updateTime)
  }

  async play() {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume()
    }

    this.tracks.forEach(track => this.startTrack(track))
    this.isPlaying = true
    this.updateTime()
  }

  async togglePlayPause() {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  private startTrack(track: Track) {
    const playbackNode = this.playbackNodes.get(track.id)
    if (!playbackNode || !this.audioContext) return

    playbackNode.play(Math.floor(this.currentTime * this.audioContext.sampleRate))
  }

  pause() {
    this.audioContext?.suspend()
    this.isPlaying = false
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  stop() {
    this.tracks.forEach(track => {
      const playbackNode = this.playbackNodes.get(track.id)
      if (playbackNode) {
        playbackNode.pause()
      }
    })
    this.currentTime = 0
    this.isPlaying = false
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  seek(time: number) {
    this.tracks.forEach(track => {
      const playbackNode = this.playbackNodes.get(track.id)
      if (playbackNode) {
        playbackNode.seek(time)
      }
    })
  }

  setLoopRegion(start: number, end: number, enabled: boolean) {
    this.loopRegion = { start, end, enabled }
    if (this.isPlaying) {
      const currentTime = this.audioContext?.currentTime || 0
      this.stop()
      this.seek(currentTime)
      this.play()
    }
  }

  cleanup() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
    this.stop()
    this.audioContext?.close()
  }

  // Getters for reactive state
  getIsPlaying() { return this.isPlaying }
  getCurrentTime() { return this.currentTime }
  getDuration() { return this.duration }
  getTracks() { return this.tracks }
  getLoopRegion() { return this.loopRegion }

  setEffectBypass(effectName: string, bypass: boolean) {
    const effect = this.effectChain.find(e => e.name === effectName)
    if (effect) {
      effect.bypass = bypass
      this.updateEffectBypass(effect)
    }
  }

  public async initialize(): Promise<void> {
    await this.initAudioContext()
    await this.loadTrack('Perc.mp3')
    await this.loadTrack('Stab.mp3')
    await this.loadTrack('Bass.mp3')
    await this.loadTrack('Drums.mp3')
  }

  public getAudioContext(): AudioContext {
    if (!this.audioContext) {
      throw new Error('AudioContext is not initialized')
    }
    return this.audioContext
  }

  getEffectChain(): Effect[] {
    return this.effectChain
  }

  getWaveformData(): number[] {
    if (this.tracks.length === 0) return []
    
    const track = this.tracks[0]
    if (!track.buffer) return []
    
    const channel = track.buffer.getChannelData(0)
    const samples = 1000 // 表示用のサンプル数
    const blockSize = Math.floor(channel.length / samples)
    const waveform = []
    
    for (let i = 0; i < samples; i++) {
      const start = i * blockSize
      let sum = 0
      
      for (let j = 0; j < blockSize && (start + j) < channel.length; j++) {
        sum += Math.abs(channel[start + j])
      }
      
      waveform.push(sum / blockSize)
    }
    
    return waveform
  }

  updateEffectParameter(effectName: string, paramName: string, value: number) {
    const effect = this.effectChain.find(e => e.name === effectName)
    if (!effect) return

    const param = effect.parameters?.find(p => p.name === paramName)
    if (!param) return

    param.value = value

    switch (effectName) {
      case 'Distortion':
        (effect.node as DistortionNode).setDrive(value)
        break
      case 'Decimator':
        if (paramName === 'Bits') {
          (effect.node as DecimatorNode).setBits(value)
        } else if (paramName === 'Rate') {
          (effect.node as DecimatorNode).setRate(value)
        }
        break
      case 'Reverb':
        if (paramName === 'Dry/Wet' && this.reverbNode) {
          this.reverbNode.setMix(value)
        }
        break
    }
  }

  triggerTapeStop() {
    const effect = this.effectChain.find(e => e.name === 'TapeStop')
    if (effect && !effect.bypass) {
      (effect.node as TapeStopNode).trigger()
    }
  }

  getCurrentVolume(): number {
    if (!this.analyser) return 0

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteTimeDomainData(dataArray)

    // 音量を計算（RMS）
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128
      sum += normalized * normalized
    }
    return Math.sqrt(sum / dataArray.length)
  }
} 