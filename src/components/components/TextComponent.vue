<template>
  <div 
    class="text-component"
    :style="{
      fontSize: `${component.style.fontSize || 14}px`,
      color: component.style.color || '#333333',
      backgroundColor: component.style.backgroundColor || 'transparent',
      border: component.style.borderWidth ? `${component.style.borderWidth}px solid ${component.style.borderColor || '#ccc'}` : 'none',
      borderRadius: component.style.borderRadius ? `${component.style.borderRadius}px` : '0',
      padding: '4px 8px',
      boxSizing: 'border-box',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    }"
  >
    {{ component.props.content || '文本内容' }}
  </div>
</template>

<script setup lang="ts">
import type { ComponentData } from '@/types'

defineProps<{
  component: ComponentData
}>()
</script>

<style scoped>
.text-component {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 20px;
}
</style>