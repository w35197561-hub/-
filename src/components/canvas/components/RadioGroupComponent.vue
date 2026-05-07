<template>
  <div :style="wrapperStyle">
    <label
      v-for="(option, idx) in options"
      :key="idx"
      class="radio-item"
      :class="{ interactive: isPreview }"
    >
      <input
        type="radio"
        :name="`radio-${component.id}`"
        :value="option"
        :checked="option === (isPreview ? localValue : defaultValue)"
        :disabled="!isPreview"
        @change="handleChange(option)"
      />
      <span :style="labelStyle">{{ option }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { ComponentData } from '@/types'
import { useActionExecutor } from '../composables/useActionExecutor'

const props = defineProps<{ component: ComponentData }>()

const isPreview = inject('isPreview', false)
const { execute } = useActionExecutor()

const options = computed(() => (props.component.props.options as string[] | undefined) ?? [])

const defaultValue = computed(
  () => (props.component.props.defaultValue as string | undefined) ?? '',
)

const localValue = ref(defaultValue.value)

const handleChange = (option: string) => {
  localValue.value = option
  if (!isPreview) return
  const ev = props.component.events?.find((e) => e.type === 'change')
  if (ev) execute(ev.actions)
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
.radio-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: default;
  user-select: none;
}

.radio-item.interactive {
  cursor: pointer;
}

.radio-item input[type='radio'] {
  cursor: default;
  flex-shrink: 0;
}

.radio-item.interactive input[type='radio'] {
  cursor: pointer;
}
</style>
