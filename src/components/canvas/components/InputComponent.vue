<template>
  <div class="input-wrapper">
    <input
      class="input-component"
      :type="(component.props.type as string) || 'text'"
      :placeholder="(component.props.placeholder as string) ?? ''"
      :value="isPreview ? localValue : (component.props.value as string) || ''"
      :readonly="!isPreview"
      :style="inputStyle"
      @input="handleInput"
      @change="handleChange"
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
import { useActionExecutor } from '../composables/useActionExecutor'

const props = defineProps<{ component: ComponentData }>()

const isPreview = inject<Ref<boolean>>('isPreview', ref(false))
const editorStore = useEditorStore()
const { execute } = useActionExecutor()
const localValue = ref((props.component.props.value as string) || '')

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
  localValue.value = (e.target as HTMLInputElement).value
}

const handleChange = () => {
  if (!isPreview.value) return
  const ev = props.component.events?.find((e) => e.type === 'change')
  if (ev) execute(ev.actions)
}

watch(localValue, (val) => {
  if (isPreview.value) editorStore.setPreviewValue(props.component.id, val)
})
</script>

<style scoped>
.input-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.input-component {
  width: 100%;
  height: 100%;
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
