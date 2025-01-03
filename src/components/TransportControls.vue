<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  isPlaying: boolean
  currentTime: number
  duration: number
}>()

const emit = defineEmits<{
  play: []
  pause: []
  stop: []
  seek: [time: number]
}>()

const seekPosition = ref(0)

watch(() => props.currentTime, (time) => {
  seekPosition.value = (time / props.duration) * 100
})
</script>

<template>
  <div class="transport">
    <button @click="emit('play')" :disabled="isPlaying">
      Play
    </button>
    <button @click="emit('pause')" :disabled="!isPlaying">
      Pause
    </button>
    <button @click="emit('stop')">
      Stop
    </button>
    
    <div class="seek-bar">
      <input
        type="range"
        min="0"
        max="100"
        v-model="seekPosition"
        @change="emit('seek', (seekPosition / 100) * duration)"
      >
      <span>{{ Math.floor(currentTime) }}s / {{ Math.floor(duration) }}s</span>
    </div>
  </div>
</template> 