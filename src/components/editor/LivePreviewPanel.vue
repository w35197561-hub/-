<template>
  <div class="live-preview-container">
    <div
      class="live-preview-canvas"
      :style="{
        width: `${page?.style.width || 1200}px`,
        height: `${page?.style.height || 800}px`,
        backgroundColor: page?.style.backgroundColor || '#ffffff',
      }"
    >
      <div
        v-for="component in page?.components"
        :key="component.id"
        class="live-preview-component"
        :style="{
          top: `${component.style.top}px`,
          left: `${component.style.left}px`,
          width: `${component.style.width}px`,
          height: `${component.style.height}px`,
          zIndex: component.style.zIndex,
          transform: `rotate(${component.style.rotate}deg)`,
        }"
      >
        <ComponentRenderer :component="component" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import { useEditorStore } from '@/stores/editor'
import ComponentRenderer from '@/components/canvas/components/ComponentRenderer.vue'

provide('isPreview', true)

const editorStore = useEditorStore()
const page = computed(() => editorStore.currentPage)
</script>

<style scoped>
.live-preview-container {
  max-height: 75vh;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding: 20px;
}

.live-preview-canvas {
  position: relative;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.live-preview-component {
  position: absolute;
}

.live-preview-component > * {
  width: 100%;
  height: 100%;
}
</style>
