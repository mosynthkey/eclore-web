<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Track } from '../types/audio'
import { AudioPlayer } from '../audio/AudioPlayer'
import TrackControls from './TrackControls.vue'
import TransportControls from './TransportControls.vue'
import EffectsPanel from './EffectsPanel.vue'

const player = new AudioPlayer()
const selectedTrack = ref<Track | null>(null)
const isLoading = ref(true)
const currentPlayingTime = ref(0)
const currentPlayingTimeRatio = ref(0)

onMounted(async () => {
    try {
        await player.initialize()
        isLoading.value = false;

        // timer
        setInterval(() => {
            currentPlayingTime.value = player.getCurrentTime()
            currentPlayingTimeRatio.value = currentPlayingTime.value / player.getDuration()
        }, 100);

    } catch (error) {
        console.error('Failed to initialize audio player:', error)
    }
})

onBeforeUnmount(() => {
    player.cleanup()
})
</script>

<template>
    <div class="audio-player">
        <div v-if="isLoading" class="loading">
            Loading...
        </div>

        <template v-else>
            <div>{{ currentPlayingTime }}</div>
            <div>{{ currentPlayingTimeRatio }}</div>
            <TransportControls :is-playing="player.getIsPlaying()" :current-time="player.getCurrentTime()"
                :duration="player.getDuration()" @play="player.play()" @pause="player.pause()" @stop="player.stop()"
                @seek="(time) => player.seek(time)" @toggle-play-pause="player.togglePlayPause()" />

            <div class="tracks">
                <TrackControls v-for="track in player.getTracks()" :key="track.id" :track="track"
                    @click="selectedTrack = track" :class="{ selected: selectedTrack?.id === track.id }" />
            </div>

            <EffectsPanel :audio-context="player.getAudioContext()" :audio-player="player" />
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