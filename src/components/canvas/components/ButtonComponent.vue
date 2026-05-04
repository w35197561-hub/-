<template>
  <button class="button-component" :style="computedStyle" @click="handleClick">
    {{ component.props.content ?? '' }}
  </button>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { Ref } from 'vue'
import type { ComponentData } from '@/types'
import { useComponentStyle } from './composables/useComponentStyle'
import { useActionExecutor } from '../composables/useActionExecutor'

const props = defineProps<{
  component: ComponentData
}>()

const { baseStyle } = useComponentStyle(props.component.style)
const isPreview = inject<Ref<boolean>>('isPreview', ref(false))
const { execute } = useActionExecutor()

const computedStyle = computed(() => ({
  ...baseStyle.value,
  color: props.component.style.color ?? '#ffffff',
  backgroundColor: props.component.style.backgroundColor ?? '#409eff',
  padding: '8px 16px',
  cursor: 'pointer',
}))

const handleClick = () => {
  if (!isPreview.value) return
  const clickEvent = props.component.events?.find((e) => e.type === 'click')
  if (clickEvent?.actions?.length) execute(clickEvent.actions)
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
