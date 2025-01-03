<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useAudioStore } from '../stores/audioStore'
import TrackControls from './TrackControls.vue'
import TransportControls from './TransportControls.vue'
import EffectsPanel from './EffectsPanel.vue'

const store = useAudioStore()

onMounted(async () => {
    await store.initialize()
})

onBeforeUnmount(() => {
    store.cleanup()
})
</script>

<template>
    <div class="audio-player">
        <div v-if="store.isLoading" class="loading">
            Loading...
        </div>

        <template v-else>
            <div>{{ store.currentTime.toFixed(1) }}</div>
            <div>{{ (store.currentTime / store.duration).toFixed(2) }}</div>

            <TransportControls :is-playing="store.isPlaying" :current-time="store.currentTime"
                :duration="store.duration" @play="store.play" @pause="store.pause" @stop="store.stop" @seek="store.seek"
                @toggle-play-pause="store.togglePlayPause" />

            <div class="tracks">
                <TrackControls v-for="track in store.tracks" :key="track.id" :track="track"
                    @click="store.setSelectedTrack(track)"
                    :class="{ selected: store.selectedTrack?.id === track.id }" />
            </div>

            <EffectsPanel :audio-context="store.player.getAudioContext()" :audio-player="store.player" />
        </template>
    </div>
</template>

<style scoped>
.audio-player {
    padding: 20px;
}

.tracks {
    margin-top: 20px;
}

.loop-controls {
    margin: 1rem 0;
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.active {
    background-color: #4CAF50;
    color: white;
}

.selected {
    border-color: #4CAF50;
}

.loading {
    text-align: center;
    padding: 2rem;
    color: #666;
}
</style>