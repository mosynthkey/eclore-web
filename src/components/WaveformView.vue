<template>
    <div ref="container" class="waveform-container" @click="handleClick">
        <canvas ref="canvas" class="waveform-canvas"></canvas>
        <div class="playhead" :style="{ left: `${playheadPosition}%` }"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue'
import { useAudioStore } from '../stores/audioStore'

const audioStore = useAudioStore()
const container = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

const props = defineProps<{
    data: number[] // 波形データ
}>()

// 再生ヘッドの位置を計算
const playheadPosition = computed(() => {
    return (audioStore.currentTime / audioStore.duration) * 100
})

// クリックハンドラー
const handleClick = (event: MouseEvent) => {
    if (!container.value) return

    const rect = container.value.getBoundingClientRect()
    const clickPosition = event.clientX - rect.left
    const percentage = clickPosition / rect.width
    const newTime = percentage * audioStore.duration

    audioStore.seek(newTime)
}

function resampleData(inputData: number[], numOutputData: number): number[] {
    const numInputData = inputData.length
    const outputData: number[] = []
    const step = (numInputData - 1) / (numOutputData - 1)

    for (let i = 0; i < numOutputData; i++) {
        const position = i * step
        const index = Math.floor(position)
        const fraction = position - index

        if (index >= numInputData - 1) {
            outputData.push(inputData[numInputData - 1])
        } else {
            const value = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction
            outputData.push(value)
        }
    }

    return outputData
}

// 波形の描画
const drawWaveform = () => {
    if (!canvas.value || !container.value) return

    const ctx = canvas.value.getContext('2d')
    if (!ctx) return

    // キャンバスのサイズをコンテナに合わせる
    canvas.value.width = container.value.clientWidth
    canvas.value.height = container.value.clientHeight

    const width = canvas.value.width
    const height = canvas.value.height

    ctx.clearRect(0, 0, width, height)

    // 短冊の設定
    const stripWidth = 3
    const stripInterval = 1
    const numStrips = Math.floor(width / (stripWidth + stripInterval))

    // データをリサンプリング
    const resampledData = resampleData(props.data, numStrips)

    // 各短冊を描画
    const maxAmplitude = Math.max(...resampledData)
    resampledData.forEach((amplitude, index) => {
        const x = index * (stripWidth + stripInterval)
        const h = amplitude / maxAmplitude * height

        ctx.fillStyle = 'gray'
        ctx.fillRect(x, (height - h), stripWidth, h)
    })

    // 再生位置の描画
    const playbackX = Math.floor(playheadPosition.value / 100 * numStrips) * (stripWidth + stripInterval)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.fillRect(playbackX, 0, stripWidth, height)
}

// コンポーネントのマウント時に波形を描画
onMounted(() => {
    drawWaveform()
    window.addEventListener('resize', drawWaveform)
})

watch(() => props.data, drawWaveform)

watch(() => playheadPosition.value, drawWaveform)

onBeforeUnmount(() => {
    window.removeEventListener('resize', drawWaveform)
})
</script>

<style scoped>
.waveform-container {
    position: relative;
    width: 100%;
    height: 200px;
    background: #f5f5f5;
    border-radius: 4px;
    overflow: hidden;
}

.waveform-canvas {
    width: 100%;
    height: 100%;
}

.playhead {
    position: absolute;
    top: 0;
    width: 2px;
    height: 100%;
    background-color: #ff5500;
    pointer-events: none;
}
</style>