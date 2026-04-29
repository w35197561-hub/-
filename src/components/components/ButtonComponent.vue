<template>
  <button class="button-component" :style="computedStyle" @click="handleClick">
    {{ component.props.content || '按钮' }}
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentData } from '@/types'
import { useComponentStyle } from './composables/useComponentStyle'

const props = defineProps<{
  component: ComponentData
}>()

const { baseStyle } = useComponentStyle(props.component.style)

const computedStyle = computed(() => ({
  ...baseStyle.value,
  color: props.component.style.color ?? '#ffffff',
  backgroundColor: props.component.style.backgroundColor ?? '#409eff',
  padding: '8px 16px',
  cursor: 'pointer',
}))

const handleClick = () => {
  // 事件系统预留：后续可通过 component.events 派发自定义行为
}
</script>

<style scoped>
.button-component {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  box-sizing: border-box;
  transition: opacity 0.2s;
  outline: none;
}

.button-component:hover {
  opacity: 0.8;
}

.button-component:active {
  transform: scale(0.98);
}
</style>
