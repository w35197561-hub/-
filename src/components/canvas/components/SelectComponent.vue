<template>
  <div :style="wrapperStyle" class="select-display">
    <span class="select-placeholder">{{ component.props.placeholder ?? '请选择' }}</span>
    <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentData } from '@/types'

const props = defineProps<{ component: ComponentData }>()

const wrapperStyle = computed(() => ({
  width: '100%',
  height: '100%',
  boxSizing: 'border-box' as const,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 10px',
  backgroundColor: props.component.style.backgroundColor ?? '#ffffff',
  border: '1px solid #dcdfe6',
  borderRadius: props.component.style.borderRadius
    ? `${props.component.style.borderRadius}px`
    : '4px',
  cursor: 'default',
}))
</script>

<style scoped>
.select-display {
  user-select: none;
}

.select-placeholder {
  font-size: 14px;
  color: #c0c4cc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-arrow {
  width: 14px;
  height: 14px;
  color: #c0c4cc;
  flex-shrink: 0;
}
</style>
