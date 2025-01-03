<script setup lang="ts">
import { ref } from 'vue'
import type { Track } from '../types/audio'

const props = defineProps<{
  track: Track
}>()

const volume = ref(1)
const isMuted = ref(false)

const updateVolume = (value: number) => {
  if (!props.track.gain) return
  volume.value = value
  props.track.gain.gain.value = isMuted.value ? 0 : value
}

const toggleMute = () => {
  if (!props.track.gain) return
  isMuted.value = !isMuted.value
  props.track.gain.gain.value = isMuted.value ? 0 : volume.value
}
</script>

<template>
  <div class="track-controls">
    <div class="track-info">
      <span class="track-name">{{ track.name }}</span>
      <button @click="toggleMute">
        {{ isMuted ? 'Unmute' : 'Mute' }}
      </button>
    </div>
    
    <div class="volume-control">
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        :value="volume"
        @input="e => updateVolume(Number((e.target as HTMLInputElement).value))"
      >
      <span>{{ Math.round(volume * 100) }}%</span>
    </div>
  </div>
</template>

<style scoped>
.track-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  border: 1px solid #ccc;
  margin-bottom: 0.5rem;
}

.track-info {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  min-width: 200px;
}
</style> 