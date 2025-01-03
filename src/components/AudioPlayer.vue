<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Track } from '../types/audio'
import { AudioPlayer } from '../audio/AudioPlayer'
import TrackControls from './TrackControls.vue'
import TransportControls from './TransportControls.vue'
import EffectsPanel from './EffectsPanel.vue'

const player = new AudioPlayer()
const selectedTrack = ref<Track | null>(null)

onBeforeUnmount(() => {
  player.cleanup()
})
</script>

<template>
  <div class="audio-player">
    <TransportControls
      :is-playing="player.getIsPlaying()"
      :current-time="player.getCurrentTime()"
      :duration="player.getDuration()"
      @play="player.play()"
      @pause="player.pause()"
      @stop="player.stop()"
      @seek="player.seek"
    />
    
    <div class="loop-controls">
      <button @click="() => player.setLoopRegion(player.getCurrentTime(), player.getLoopRegion().end, true)">
        Set Loop Start
      </button>
      <button @click="() => player.setLoopRegion(player.getLoopRegion().start, player.getCurrentTime(), true)">
        Set Loop End
      </button>
      <button 
        @click="() => player.setLoopRegion(
          player.getLoopRegion().start,
          player.getLoopRegion().end,
          !player.getLoopRegion().enabled
        )"
        :class="{ active: player.getLoopRegion().enabled }"
      >
        Loop {{ player.getLoopRegion().enabled ? 'On' : 'Off' }}
      </button>
    </div>
    
    <div class="tracks">
      <TrackControls
        v-for="track in player.getTracks()"
        :key="track.id"
        :track="track"
        @click="selectedTrack = track"
        :class="{ selected: selectedTrack?.id === track.id }"
      />
    </div>
    
    <EffectsPanel
      v-if="selectedTrack"
      :track="selectedTrack"
      :audio-context="player.audioContext"
    />
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
</style> 