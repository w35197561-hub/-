<template>
  <div class="text-component" :style="computedStyle">
    {{ component.props.content ?? '' }}
  </div>
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
  color: props.component.style.color ?? '#333333',
  backgroundColor: props.component.style.backgroundColor ?? 'transparent',
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-word' as const,
  padding: '4px 8px',
}))
</script>

<style scoped>
.text-component {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 20px;
  box-sizing: border-box;
}
</style>
