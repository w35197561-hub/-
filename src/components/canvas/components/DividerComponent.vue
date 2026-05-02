<template>
  <div :style="wrapperStyle">
    <div :style="lineStyle" />
    <span v-if="text" :style="textStyle">{{ text }}</span>
    <div v-if="text" :style="lineStyle" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentData } from '@/types'

const props = defineProps<{ component: ComponentData }>()

const text = computed(() => (props.component.props.text as string | undefined) ?? '')
const borderStyle = computed(() => (props.component.props.borderStyle as string | undefined) ?? 'solid')
const borderWidth = computed(() => props.component.style.borderWidth ?? 1)
const borderColor = computed(() => props.component.style.borderColor ?? '#dcdfe6')

const wrapperStyle = computed(() => ({
  width: '100%',
  height: '100%',
  boxSizing: 'border-box' as const,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}))

const lineStyle = computed(() => ({
  flex: 1,
  borderTop: `${borderWidth.value}px ${borderStyle.value} ${borderColor.value}`,
}))

const textStyle = computed(() => ({
  fontSize: '12px',
  color: borderColor.value,
  whiteSpace: 'nowrap' as const,
  flexShrink: 0,
}))
</script>
