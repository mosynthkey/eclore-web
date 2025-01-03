<script setup lang="ts">
import { useAudioStore } from '../stores/audioStore'
import type { Effect, EffectParameter } from '../types/audio'
import { computed } from 'vue'

const store = useAudioStore()

const normalEffects = computed(() =>
    store.effects.filter(effect => effect.name !== 'TapeStop')
)

const toggleEffect = (effectName: string, bypass: boolean) => {
    store.toggleEffect(effectName, bypass)
}

const updateParameter = (effect: Effect, param: EffectParameter, value: number) => {
    store.updateEffectParameter(effect.name, param.name, value)
}
</script>

<template>
    <div class="effects-panel">
        <div v-for="effect in normalEffects" :key="effect.name" class="effect">
            <div class="effect-header">
                <label>
                    <input type="checkbox" :checked="!effect.bypass"
                        @change="e => toggleEffect(effect.name, !e.target.checked)" />
                    {{ effect.name }}
                </label>
            </div>

            <div v-if="effect.parameters" class="effect-params">
                <div v-for="param in effect.parameters" :key="param.name" class="param-control">
                    <label>{{ param.name }}</label>
                    <input type="range" :min="param.min" :max="param.max" :step="(param.max - param.min) / 100"
                        :value="param.value" @input="e => updateParameter(effect, param, Number(e.target.value))" />
                    <span class="param-value">{{ param.value.toFixed(2) }}</span>
                </div>
            </div>
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

.param-control {
    display: grid;
    grid-template-columns: 100px 1fr 50px;
    align-items: center;
    gap: 0.5rem;
}

.param-value {
    font-family: monospace;
}

.tape-stop-button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.tape-stop-button:hover {
    background: #ff2222;
}
</style>