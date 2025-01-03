import { defineStore } from 'pinia'
import type { Track, Effect } from '../types/audio'
import { AudioPlayer } from '../audio/AudioPlayer'

export const useAudioStore = defineStore('audio', {
  state: () => ({
    player: new AudioPlayer(),
    isLoading: true,
    currentTime: 0,
    selectedTrack: null as Track | null,
    isPlaying: false,
    duration: 0,
  }),

  actions: {
    async initialize() {
      try {
        await this.player.initialize()
        this.isLoading = false
        this.duration = this.player.getDuration()
        this.startTimeUpdate()
      } catch (error) {
        console.error('Failed to initialize audio player:', error)
      }
    },

    startTimeUpdate() {
      setInterval(() => {
        this.currentTime = this.player.getCurrentTime()
      }, 100)
    },

    togglePlayPause() {
      this.player.togglePlayPause()
      this.isPlaying = !this.isPlaying
    },

    play() {
      this.player.play()
      this.isPlaying = true
    },

    pause() {
      this.player.pause()
      this.isPlaying = false
    },

    stop() {
      this.player.stop()
      this.isPlaying = false
      this.currentTime = 0
    },

    seek(time: number) {
      this.player.seek(time)
      this.currentTime = time
    },

    setSelectedTrack(track: Track | null) {
      this.selectedTrack = track
    },

    toggleEffect(effectName: string, bypass: boolean) {
      this.player.setEffectBypass(effectName, bypass)
    },

    cleanup() {
      this.player.cleanup()
    }
  },

  getters: {
    tracks: (state) => state.player.getTracks(),
    effects: (state) => state.player.getEffectChain(),
  }
}) 