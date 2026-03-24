<template>
  <input
    class="input-component"
    :type="component.props.type || 'text'"
    :placeholder="component.props.placeholder || '请输入内容'"
    :value="component.props.value || ''"
    :style="{
      fontSize: `${component.style.fontSize || 14}px`,
      color: component.style.color || '#333333',
      backgroundColor: component.style.backgroundColor || '#ffffff',
      border: component.style.borderWidth ? `${component.style.borderWidth}px solid ${component.style.borderColor || '#dcdfe6'}` : '1px solid #dcdfe6',
      borderRadius: component.style.borderRadius ? `${component.style.borderRadius}px` : '4px',
      padding: '8px 12px',
      boxSizing: 'border-box',
      width: '100%',
      height: '100%'
    }"
    @input="handleInput"
    @focus="handleFocus"
    @blur="handleBlur"
  />
</template>

<script setup lang="ts">
import type { ComponentData } from '@/types'

defineProps<{
  component: ComponentData
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  console.log('输入内容:', target.value)
}

const handleFocus = () => {
  console.log('输入框获得焦点')
}

const handleBlur = () => {
  console.log('输入框失去焦点')
}
</script>

<style scoped>
.input-component {
  outline: none;
  transition: border-color 0.2s;
  min-height: 32px;
}

.input-component:focus {
  border-color: #409eff !important;
}

.input-component::placeholder {
  color: #c0c4cc;
}
</style>