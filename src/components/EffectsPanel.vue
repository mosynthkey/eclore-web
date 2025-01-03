<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Track, AudioEffect } from '../types/audio'
import { DistortionNode } from '../audio/worklets/distortion-node.ts'
import { AudioPlayer } from '../audio/AudioPlayer'

const props = defineProps<{
    audioPlayer: AudioPlayer
}>()

const selectedEffect = ref<AudioEffect | null>(null)

// Load Audio Worklet
onMounted(async () => {
    if (!props.audioContext) return
    await props.audioContext.audioWorklet.addModule('/src/audio/worklets/distortion-processor.ts')
})

// Create distortion effect
const createDistortion = () => {
    if (!props.audioContext) return null

    const distortion = new DistortionNode(props.audioContext)

    return {
        id: 'distortion-' + Date.now(),
        type: 'custom' as const,
        node: distortion,
        params: {
            drive: 1
        },
        bypass: false
    }
}

// Create reverb effect
const createReverb = async () => {
    if (!props.audioContext) return null

    const convolver = props.audioContext.createConvolver()

    // Create impulse response
    const length = props.audioContext.sampleRate * 2 // 2 seconds
    const impulse = props.audioContext.createBuffer(2, length, props.audioContext.sampleRate)

    for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel)
        for (let i = 0; i < length; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length / 6))
        }
    }

    convolver.buffer = impulse

    return {
        id: 'reverb-' + Date.now(),
        type: 'reverb' as const,
        node: convolver,
        params: {
            mix: 0.5
        },
        bypass: false
    }
}

// Create decimator effect
const createDecimator = () => {
    if (!props.audioContext) return null

    const scriptNode = props.audioContext.createScriptProcessor(4096, 2, 2)
    let decimation = 1

    scriptNode.onaudioprocess = (e) => {
        const inputL = e.inputBuffer.getChannelData(0)
        const inputR = e.inputBuffer.getChannelData(1)
        const outputL = e.outputBuffer.getChannelData(0)
        const outputR = e.outputBuffer.getChannelData(1)

        for (let i = 0; i < inputL.length; i++) {
            if (i % decimation === 0) {
                outputL[i] = inputL[i]
                outputR[i] = inputR[i]
            } else {
                outputL[i] = outputL[i - 1]
                outputR[i] = outputR[i - 1]
            }
        }
    }

    return {
        id: 'decimator-' + Date.now(),
        type: 'decimator' as const,
        node: scriptNode,
        params: {
            decimation: 1
        },
        bypass: false
    }
}

const addEffect = async (type: 'reverb' | 'decimator' | 'distortion') => {
    const effect = type === 'reverb'
        ? await createReverb()
        : type === 'decimator'
            ? createDecimator()
            : createDistortion()

    if (effect) {
        props.track.effects.push(effect)
        selectedEffect.value = effect
    }
}

const updateEffectParam = (effect: AudioEffect, param: string, value: number) => {
    effect.params[param] = value

    if (effect.type === 'decimator') {
        // Update decimator parameters
        const scriptNode = effect.node as ScriptProcessorNode
        scriptNode.onaudioprocess = (e) => {
            // Update decimation logic
        }
    } else if (effect.type === 'custom') {
        // Update distortion parameters
        const distortion = effect.node as DistortionNode
        if (param === 'drive') {
            distortion.drive = value
        }
    }
}

const toggleEffect = (effectName: string, bypass: boolean) => {
    props.audioPlayer.setEffectBypass(effectName, bypass)
}
</script>

<template>
    <div class="effects-panel">
        <div v-for="effect in audioPlayer.getEffectChain()" :key="effect.name">
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