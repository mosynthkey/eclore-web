<script setup lang="ts">
import { useAudioStore } from '../stores/audioStore'

const store = useAudioStore()

defineEmits<{
    (e: 'play'): void
    (e: 'pause'): void
    (e: 'stop'): void
    (e: 'seek', time: number): void
    (e: 'toggle-play-pause'): void
}>()
</script>

<template>
    <div class="transport-controls">
        <button @click="store.togglePlayPause">
            {{ store.isPlaying ? 'Pause' : 'Play' }}
        </button>
        <button @click="store.stop">Stop</button>

        <input type="range" :min="0" :max="store.duration" :value="store.currentTime" step="0.1"
            @input="(e) => $emit('seek', parseFloat((e.target as HTMLInputElement).value))" />
        <span>{{ store.currentTime.toFixed(1) }} / {{ store.duration.toFixed(1) }}</span>
    </div>
</template>

<style scoped>
.transport-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin: 1rem 0;
}

button {
    padding: 0.5rem 1rem;
    font-size: 1.2rem;
    cursor: pointer;
}

input[type="range"] {
    flex: 1;
}
</style>