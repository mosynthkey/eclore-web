import type { Track, LoopRegion } from '../types/audio'
import { PlaybackNode } from './worklets/playback-node'
import { DistortionNode } from './worklets/distortion-node'
import { DecimatorNode } from './worklets/decimator-node'
import { ReverbNode } from './worklets/reverb-node'

interface Effect {
  name: string;
  node: AudioNode;
  bypass: boolean;
  output?: AudioNode;
  bypassGain?: GainNode;
  wetGain?: GainNode;
}

export class AudioPlayer {
  private audioContext: AudioContext | null = null
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
  private effectChain: Effect[] = []

  async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
      try {
        await this.audioContext.audioWorklet.addModule('/src/audio/worklets/playback-processor.ts')
        await this.audioContext.audioWorklet.addModule('/src/audio/worklets/distortion-processor.ts')
        await this.audioContext.audioWorklet.addModule('/src/audio/worklets/decimator-processor.ts')
        
        this.mixBus = this.audioContext.createGain()
        
        const distortion = new DistortionNode(this.audioContext)
        const decimator = new DecimatorNode(this.audioContext)
        const reverb = new ReverbNode(this.audioContext)
        
        this.effectChain = [
          {
            name: 'Distortion',
            node: distortion,
            bypass: true,
            bypassGain: this.audioContext.createGain(),
            wetGain: this.audioContext.createGain()
          },
          {
            name: 'Decimator',
            node: decimator,
            bypass: true,
            bypassGain: this.audioContext.createGain(),
            wetGain: this.audioContext.createGain()
          },
          {
            name: 'Reverb',
            node: reverb.getInput(),
            output: reverb.getOutput(),
            bypass: true,
            bypassGain: this.audioContext.createGain(),
            wetGain: this.audioContext.createGain()
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
        
        previousNode.connect(this.audioContext.destination)

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

    const response = await fetch(`/src/assets/music/demo/${filename}`)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

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
    
    playbackNode.connect(track.gain)
    track.gain.connect(this.mixBus)

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
    this.stop()
    this.currentTime = time
    if (this.isPlaying) {
      this.play()
    }
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
    if (!this.audioContext) {
      await this.initAudioContext()
      await this.loadTrack('Perc.mp3')
      await this.loadTrack('Stab.mp3')
      await this.loadTrack('Bass.mp3')
      await this.loadTrack('Drums.mp3')
    }
  }

  public getAudioContext(): AudioContext {
    return this.audioContext
  }
} 