<script setup lang="ts">
import { useAudioStore } from '../stores/audioStore'

const store = useAudioStore()

const toggleEffect = (effectName: string, bypass: boolean) => {
    store.toggleEffect(effectName, bypass)
}
</script>

<template>
    <div class="effects-panel">
        <div v-for="effect in store.effects" :key="effect.name">
            <label>
                <input type="checkbox" :checked="!effect.bypass"
                    @change="e => toggleEffect(effect.name, !e.target.checked)" />
                {{ effect.name }}
            </label>
        </div>
    </div>
</template>

<style scoped>
.effects-panel {
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid #ccc;
}

.effect {
    margin: 1rem 0;
    padding: 0.5rem;
    border: 1px solid #ddd;
}

.effect-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}

.effect-params {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
</style>