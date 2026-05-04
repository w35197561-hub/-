<template>
  <!-- 设计态：静态占位 -->
  <div v-if="!isPreview" :style="wrapperStyle" class="select-display">
    <span class="select-placeholder">{{ component.props.placeholder ?? '请选择' }}</span>
    <svg
      class="select-arrow"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </div>

  <!-- 运行态：真实可交互下拉 -->
  <div
    v-else
    ref="rootEl"
    :style="wrapperStyle"
    class="select-display select-interactive"
    @click="toggle"
  >
    <span :class="['select-value', { 'select-placeholder': !selected }]">
      {{ selected || (component.props.placeholder ?? '请选择') }}
    </span>
    <svg
      class="select-arrow"
      :class="{ open }"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>

    <ul v-if="open" class="select-dropdown" @click.stop>
      <li
        v-for="opt in options"
        :key="opt"
        :class="['select-option', { active: opt === selected }]"
        @click="select(opt)"
      >
        {{ opt }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, onUnmounted } from 'vue'
import type { ComponentData } from '@/types'

const props = defineProps<{ component: ComponentData }>()

const isPreview = inject('isPreview', false)

const open = ref(false)
const selected = ref('')
const rootEl = ref<HTMLElement | null>(null)

const options = computed(() => (props.component.props.options as string[] | undefined) ?? [])

const wrapperStyle = computed(() => ({
  width: '100%',
  height: '100%',
  boxSizing: 'border-box' as const,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 10px',
  backgroundColor: props.component.style.backgroundColor ?? '#ffffff',
  border: open.value ? '1px solid #409eff' : '1px solid #dcdfe6',
  borderRadius: props.component.style.borderRadius
    ? `${props.component.style.borderRadius}px`
    : '4px',
  cursor: isPreview ? 'pointer' : 'default',
  position: 'relative' as const,
  userSelect: 'none' as const,
}))

function toggle() {
  open.value = !open.value
}

function select(opt: string) {
  selected.value = opt
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.select-display {
  user-select: none;
}

.select-placeholder {
  font-size: 14px;
  color: #c0c4cc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-value {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.select-arrow {
  width: 14px;
  height: 14px;
  color: #c0c4cc;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.select-arrow.open {
  transform: rotate(180deg);
}

.select-interactive:hover .select-arrow {
  color: #409eff;
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  list-style: none;
  margin: 0;
  padding: 4px 0;
  z-index: 9999;
  max-height: 200px;
  overflow-y: auto;
}

.select-option {
  padding: 8px 12px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.select-option:hover {
  background: #f5f7fa;
}

.select-option.active {
  color: #409eff;
  font-weight: 500;
}
</style>
