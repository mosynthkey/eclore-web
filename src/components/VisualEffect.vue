<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAudioStore } from '../stores/audioStore'

const store = useAudioStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationFrame: number | null = null
const currentVolume = ref(0)
const targetVolume = ref(0)
const smoothingFactor = 0.1

// Store previous circle positions and their opacity
const circleHistory = ref<Array<{ radius: number, opacity: number }>>([])
const maxHistoryLength = 10  // Number of circles to keep in history

let maxRadius = 1000

// Update volume smoothly
const updateVolume = () => {
    targetVolume.value = store.player.getCurrentVolume()
    currentVolume.value += (targetVolume.value - currentVolume.value) * smoothingFactor

    // Add current circle to history
    circleHistory.value.unshift({
        radius: 50 + currentVolume.value * maxRadius,
        opacity: 1
    })

    // Limit history length and fade out older circles
    if (circleHistory.value.length > maxHistoryLength) {
        circleHistory.value.pop()
    }

    // Update opacity of existing circles
    circleHistory.value.forEach((circle, index) => {
        circle.opacity = 1 - (index / maxHistoryLength)
    })

    requestAnimationFrame(updateVolume)
}

const draw = () => {
    const canvas = canvasRef.value
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear the canvas
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const baseRadius = 50
    const currentRadius = baseRadius + currentVolume.value * maxRadius

    // Draw circle history
    circleHistory.value.forEach(circle => {
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, circle.radius
        )
        gradient.addColorStop(0, `rgba(136, 136, 136, ${0.1 * circle.opacity})`)
        gradient.addColorStop(0.7, `rgba(136, 136, 136, ${0.6 * circle.opacity})`)
        gradient.addColorStop(1, `rgba(136, 136, 136, ${0.8 * circle.opacity})`)

        ctx.beginPath()
        ctx.arc(centerX, centerY, circle.radius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
    })

    // Draw current circle
    const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, currentRadius
    )
    gradient.addColorStop(0, 'rgba(136, 136, 136, 0.1)')
    gradient.addColorStop(0.7, 'rgba(136, 136, 136, 0.6)')
    gradient.addColorStop(1, 'rgba(136, 136, 136, 0.8)')

    ctx.beginPath()
    ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw the waveform
    const waveformData = store.player.getWaveformData()
    const angleStep = (Math.PI * 2) / waveformData.length

    ctx.strokeStyle = '#FFF'
    ctx.lineWidth = 2
    ctx.beginPath()

    for (let i = 0; i < waveformData.length; i++) {
        const angle = i * angleStep
        const x = centerX + Math.cos(angle) * (currentRadius + waveformData[i] * 50)
        const y = centerY + Math.sin(angle) * (currentRadius + waveformData[i] * 50)

        if (i === 0) {
            ctx.moveTo(x, y)
        } else {
            ctx.lineTo(x, y)
        }
    }

    ctx.closePath()
    ctx.stroke()

    // Draw the line indicating the playback position (monochrome)
    const currentTime = store.player.getCurrentTime()
    const duration = store.player.getDuration()
    const playAngle = (currentTime / duration) * Math.PI * 2

    const playX = centerX + Math.cos(playAngle) * currentRadius
    const playY = centerY + Math.sin(playAngle) * currentRadius

    const lineGradient = ctx.createLinearGradient(
        centerX, centerY,
        playX, playY
    )
    lineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)')
    lineGradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)')

    ctx.strokeStyle = lineGradient
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(playX, playY)
    ctx.stroke()

    animationFrame = requestAnimationFrame(draw)
}

onMounted(() => {
    draw()
    updateVolume()
    maxRadius = canvasRef.value?.height ?? 1000
})

onBeforeUnmount(() => {
    if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame)
    }
})
</script>

<template>
    <div class="visual-effect">
        <canvas ref="canvasRef"></canvas>
    </div>
</template>

<style scoped>
.visual-effect {
    width: 100%;
    height: 300px;
    margin: 20px 0;
    overflow: hidden;
    background: #111;
    border-radius: 8px;
}

canvas {
    width: 100%;
    height: 100%;
}
</style>