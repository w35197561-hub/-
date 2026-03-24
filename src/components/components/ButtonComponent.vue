<template>
  <button
    class="button-component"
    :style="{
      fontSize: `${component.style.fontSize || 14}px`,
      color: component.style.color || '#ffffff',
      backgroundColor: component.style.backgroundColor || '#409eff',
      border: component.style.borderWidth ? `${component.style.borderWidth}px solid ${component.style.borderColor || '#409eff'}` : 'none',
      borderRadius: component.style.borderRadius ? `${component.style.borderRadius}px` : '4px',
      padding: '8px 16px',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      height: '100%'
    }"
    @click="handleClick"
  >
    {{ component.props.content || '按钮' }}
  </button>
</template>

<script setup lang="ts">
import type { ComponentData } from '@/types'

defineProps<{
  component: ComponentData
}>()

const handleClick = () => {
  console.log('按钮被点击')
}
</script>

<style scoped>
.button-component {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  min-height: 32px;
}

.button-component:hover {
  opacity: 0.8;
}

.button-component:active {
  transform: scale(0.98);
}
</style>