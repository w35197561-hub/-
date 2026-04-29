<template>
  <input
    class="number-input-component"
    type="number"
    :min="(component.props.min as number)"
    :max="(component.props.max as number)"
    :step="(component.props.step as number)"
    :value="(component.props.value as number)"
    :placeholder="(component.props.placeholder as string) || ''"
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
.number-input-component {
  outline: none;
  transition: border-color 0.2s;
  min-height: 32px;
  box-sizing: border-box;
}

.number-input-component:focus {
  border-color: #409eff !important;
}

.number-input-component::placeholder {
  color: #c0c4cc;
}

.number-input-component::-webkit-inner-spin-button,
.number-input-component::-webkit-outer-spin-button {
  opacity: 1;
}
</style>
