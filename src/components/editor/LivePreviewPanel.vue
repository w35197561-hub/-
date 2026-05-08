<template>
  <div class="live-preview-wrapper">
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
            display: editorStore.previewHiddenIds.includes(component.id) ? 'none' : undefined,
          }"
        >
          <ComponentRenderer :component="component" />
        </div>
      </div>
    </div>

    <div class="live-preview-footer">
      <el-button type="primary" size="large" @click="handleSubmit">提交</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useEditorStore } from '@/stores/editor'
import { ComponentType } from '@/types'
import type { ValidationRule } from '@/types'
import ComponentRenderer from '@/components/canvas/components/ComponentRenderer.vue'
import { validateValue } from '@/utils/validateValue'

provide('isPreview', ref(true))

const editorStore = useEditorStore()
const page = computed(() => editorStore.currentPage)

const INPUT_TYPES = [ComponentType.INPUT, ComponentType.TEXTAREA, ComponentType.NUMBER_INPUT]

const handleSubmit = () => {
  if (!page.value) return
  editorStore.clearValidationErrors()

  let hasError = false
  for (const comp of page.value.components) {
    if (!INPUT_TYPES.includes(comp.type)) continue
    const rules = comp.props.rules as ValidationRule[] | undefined
    if (!rules?.length) continue

    const value = editorStore.previewValues[comp.id] ?? comp.props.value ?? ''
    const error = validateValue(value, rules)
    if (error) {
      editorStore.setValidationError(comp.id, error)
      hasError = true
    }
  }

  if (!hasError) ElMessage.success('提交成功')
}
</script>

<style scoped>
.live-preview-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.live-preview-container {
  max-height: 65vh;
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

.live-preview-footer {
  display: flex;
  justify-content: flex-end;
  padding: 0 20px 4px;
}
</style>
