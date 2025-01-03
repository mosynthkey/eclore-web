<script setup lang="ts">
defineProps<{
    isPlaying: boolean
    currentTime: number
    duration: number
}>()

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
        <button @click="$emit('toggle-play-pause')">
            {{ isPlaying ? 'Pause' : 'Play' }}
        </button>
        <button @click="$emit('stop')">Stop</button>

        <input type="range" :min="0" :max="duration" :value="currentTime" step="0.1"
            @input="(e) => $emit('seek', parseFloat((e.target as HTMLInputElement).value))" />
        <span>{{ currentTime.toFixed(1) }} / {{ duration.toFixed(1) }}</span>
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