<script setup lang="ts">
import { ref, onBeforeUnmount, watch } from 'vue'
import { useAudioStore } from './stores/audioStore'
import WaveformView from './components/WaveformView.vue'
import TransportControls from './components/TransportControls.vue'
import TrackControls from './components/TrackControls.vue'
import EffectsPanel from './components/EffectsPanel.vue'
import VisualEffect from './components/VisualEffect.vue'

const audioStore = useAudioStore()
const waveformData = ref<number[]>([])

const initializeApp = () => {
    audioStore.initialize()
    isInitialized.value = true
    waveformData.value = audioStore.player.getWaveformData()
}

watch(() => audioStore.tracks, () => {
    waveformData.value = audioStore.player.getWaveformData()
}, { deep: true })

onBeforeUnmount(() => {
    audioStore.cleanup()
})

const isInitialized = ref(false)

</script>

<template>
    <h1>eclo.re web</h1>
    <div class="audio-player">
        <div v-if="!isInitialized">
            <button @click="initializeApp()">Start</button>
        </div>
        <div v-else-if="audioStore.isLoading" class="loading">
            Loading...
        </div>

        <template v-else>
            <WaveformView :data="waveformData" class="waveform-view" />
            <VisualEffect />
            <TransportControls :is-playing="audioStore.isPlaying" :current-time="audioStore.currentTime"
                :duration="audioStore.duration" @play="audioStore.play" @pause="audioStore.pause"
                @stop="audioStore.stop" @seek="audioStore.seek" @toggle-play-pause="audioStore.togglePlayPause" />

            <div class="tracks">
                <TrackControls v-for="track in audioStore.tracks" :key="track.id" :track="track"
                    @click="audioStore.setSelectedTrack(track)"
                    :class="{ selected: audioStore.selectedTrack?.id === track.id }" />
            </div>

            <EffectsPanel :audio-context="audioStore.player.getAudioContext()" :audio-player="audioStore.player" />


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

.waveform-view {
    margin: 20px 0;
}
</style>