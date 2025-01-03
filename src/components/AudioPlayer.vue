<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useAudioStore } from '../stores/audioStore'
import WaveformView from './WaveformView.vue'
import TransportControls from './TransportControls.vue'
import TrackControls from './TrackControls.vue'
import EffectsPanel from './EffectsPanel.vue'

const audioStore = useAudioStore()
const waveformData = ref<number[]>([])

onMounted(async () => {
    await audioStore.initialize()
    waveformData.value = audioStore.player.getWaveformData()
})

watch(() => audioStore.tracks, () => {
    waveformData.value = audioStore.player.getWaveformData()
}, { deep: true })

onBeforeUnmount(() => {
    audioStore.cleanup()
})
</script>

<template>
    <div class="audio-player">
        <div v-if="audioStore.isLoading" class="loading">
            Loading...
        </div>

        <template v-else>
            <WaveformView :data="waveformData" class="waveform-view" />
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