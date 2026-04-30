<template>
  <textarea
    class="textarea-component"
    :placeholder="(component.props.placeholder as string) ?? '请输入内容'"
    :rows="(component.props.rows as number) ?? 4"
    :maxlength="(component.props.maxlength as number) || undefined"
    readonly
    :style="computedStyle"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentData } from '@/types'
import { useComponentStyle } from './composables/useComponentStyle'

const props = defineProps<{ component: ComponentData }>()

const { baseStyle } = useComponentStyle(props.component.style)

const computedStyle = computed(() => ({
  ...baseStyle.value,
  color: props.component.style.color ?? '#333333',
  backgroundColor: props.component.style.backgroundColor ?? '#ffffff',
  border: '1px solid #dcdfe6',
  borderRadius: props.component.style.borderRadius
    ? `${props.component.style.borderRadius}px`
    : '4px',
  padding: '8px 12px',
  resize: 'none' as const,
}))
</script>

<style scoped>
.textarea-component {
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.textarea-component::placeholder {
  color: #c0c4cc;
}
</style>
