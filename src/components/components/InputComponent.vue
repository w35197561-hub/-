<template>
  <input
    class="input-component"
    :type="(component.props.type as string) || 'text'"
    :placeholder="(component.props.placeholder as string) || '请输入内容'"
    :value="(component.props.value as string) || ''"
    :style="computedStyle"
  />
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
  ...baseStyle,
  color: props.component.style.color ?? '#333333',
  backgroundColor: props.component.style.backgroundColor ?? '#ffffff',
  // 输入框默认有 1px 边框
  border: props.component.style.borderWidth
    ? `${props.component.style.borderWidth}px solid ${props.component.style.borderColor ?? '#dcdfe6'}`
    : '1px solid #dcdfe6',
  borderRadius: props.component.style.borderRadius
    ? `${props.component.style.borderRadius}px`
    : '4px',
  padding: '8px 12px',
}))
</script>

<style scoped>
.input-component {
  outline: none;
  transition: border-color 0.2s;
  min-height: 32px;
  box-sizing: border-box;
}

.input-component:focus {
  border-color: #409eff !important;
}

.input-component::placeholder {
  color: #c0c4cc;
}
</style>
