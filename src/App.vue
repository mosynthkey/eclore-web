<script setup lang="ts">
import AudioPlayer from './components/AudioPlayer.vue'
</script>

<template>
  <div class="app">
    <header>
      <h1>eclo.re web</h1>
    </header>
    
    <main>
      <AudioPlayer />
    </main>
  </div>
</template>

<style>
:root {
  --primary-color: #42b883;
  --bg-color: #242424;
  --text-color: #fff;
  --border-color: #444;
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  margin-bottom: 2rem;
  text-align: center;
}

h1 {
  color: var(--primary-color);
}

button {
  background-color: var(--primary-color);
  color: var(--text-color);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

button:hover {
  opacity: 0.8;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input[type="range"] {
  width: 100%;
  max-width: 200px;
}

/* Dark mode optimized styles */
@media (prefers-color-scheme: light) {
  :root {
    --bg-color: #ffffff;
    --text-color: #213547;
    --border-color: #ddd;
  }
}
</style>
