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
        <button @click="store.triggerTapeStop()" class="tape-stop-button">
            Tape FX
        </button>
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