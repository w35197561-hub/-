<template>
  <div :style="wrapperStyle">
    <label
      v-for="(option, idx) in options"
      :key="idx"
      class="checkbox-item"
      :class="{ interactive: isPreview }"
    >
      <input
        type="checkbox"
        :value="option"
        :checked="isPreview ? localValues.includes(option) : defaultValues.includes(option)"
        :disabled="!isPreview"
        @change="toggleOption(option)"
      />
      <span :style="labelStyle">{{ option }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { ComponentData } from '@/types'

const props = defineProps<{ component: ComponentData }>()

const isPreview = inject('isPreview', false)

const options = computed(() => (props.component.props.options as string[] | undefined) ?? [])

const defaultValues = computed(
  () => (props.component.props.defaultValues as string[] | undefined) ?? [],
)

const localValues = ref<string[]>([...defaultValues.value])

function toggleOption(option: string) {
  const idx = localValues.value.indexOf(option)
  if (idx === -1) localValues.value.push(option)
  else localValues.value.splice(idx, 1)
}

const wrapperStyle = computed(() => ({
  width: '100%',
  height: '100%',
  boxSizing: 'border-box' as const,
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  gap: '8px',
  padding: '8px 12px',
  backgroundColor: props.component.style.backgroundColor ?? '',
}))

const labelStyle = computed(() => ({
  fontSize: props.component.style.fontSize ? `${props.component.style.fontSize}px` : '14px',
  color: props.component.style.color ?? '#333333',
}))
</script>

<style scoped>
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: default;
  user-select: none;
}

.checkbox-item.interactive {
  cursor: pointer;
}

.checkbox-item input[type='checkbox'] {
  cursor: default;
  flex-shrink: 0;
}

.checkbox-item.interactive input[type='checkbox'] {
  cursor: pointer;
}
</style>
