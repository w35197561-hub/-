<template>
  <div class="textarea-wrapper">
    <textarea
      class="textarea-component"
      :placeholder="(component.props.placeholder as string) ?? '请输入内容'"
      :rows="(component.props.rows as number) ?? 4"
      :maxlength="(component.props.maxlength as number) || undefined"
      :readonly="!isPreview"
      :style="textareaStyle"
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
const localValue = ref('')

const { baseStyle } = useComponentStyle(props.component.style)

const textareaStyle = computed(() => ({
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

const errorMessage = computed(() => editorStore.validationErrors[props.component.id] ?? '')

const handleInput = (e: Event) => {
  if (!isPreview.value) return
  localValue.value = (e.target as HTMLTextAreaElement).value
}

watch(localValue, (val) => {
  if (isPreview.value) editorStore.setPreviewValue(props.component.id, val)
})
</script>

<style scoped>
.textarea-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.textarea-component {
  width: 100%;
  height: 100%;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.textarea-component::placeholder {
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
