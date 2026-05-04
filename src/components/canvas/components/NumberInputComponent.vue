<template>
  <div class="number-input-wrapper">
    <input
      class="number-input-component"
      type="number"
      :readonly="!isPreview"
      :min="component.props.min as number"
      :max="component.props.max as number"
      :step="component.props.step as number"
      :value="isPreview ? localValue : (component.props.value as number)"
      :placeholder="(component.props.placeholder as string) || ''"
      :style="inputStyle"
      @input="handleInput"
    />
    <span v-if="errorMessage" class="validation-error">{{ errorMessage }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { ComponentData } from '@/types'
import { useComponentStyle } from './composables/useComponentStyle'
import { useEditorStore } from '@/stores/editor'

const props = defineProps<{ component: ComponentData }>()

const isPreview = inject<Ref<boolean>>('isPreview', ref(false))
const editorStore = useEditorStore()
const localValue = ref<number | ''>(props.component.props.value as number ?? '')

const { baseStyle } = useComponentStyle(props.component.style)

const inputStyle = computed(() => ({
  ...baseStyle.value,
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

const errorMessage = computed(() => editorStore.validationErrors[props.component.id] ?? '')

const handleInput = (e: Event) => {
  if (!isPreview.value) return
  const raw = (e.target as HTMLInputElement).value
  localValue.value = raw === '' ? '' : Number(raw)
}

watch(localValue, (val) => {
  if (isPreview.value) editorStore.setPreviewValue(props.component.id, val)
})
</script>

<style scoped>
.number-input-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.number-input-component {
  width: 100%;
  height: 100%;
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

.validation-error {
  position: absolute;
  top: 100%;
  left: 0;
  font-size: 11px;
  color: #f56c6c;
  margin-top: 2px;
  white-space: nowrap;
}
</style>
