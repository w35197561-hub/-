<template>
  <!-- 设计态：静态占位，与 SelectComponent 风格一致 -->
  <div v-if="!isPreview" :style="wrapperStyle" class="timepicker-display">
    <svg class="timepicker-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
    <span class="timepicker-placeholder">{{ component.props.placeholder ?? '请选择时间' }}</span>
    <svg class="timepicker-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </div>

  <!-- 运行态：可交互 -->
  <div
    v-else
    ref="rootEl"
    :style="wrapperStyle"
    class="timepicker-display timepicker-interactive"
    @click="togglePanel"
  >
    <svg class="timepicker-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
    <span :class="['timepicker-value', { 'timepicker-placeholder': !displayValue }]">
      {{ displayValue || (component.props.placeholder ?? '请选择时间') }}
    </span>
    <svg
      class="timepicker-arrow"
      :class="{ open: panelOpen }"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>

    <!-- 时间选择面板 -->
    <div v-if="panelOpen" class="timepicker-panel" @click.stop>
      <!-- 三列滚动区 -->
      <div class="timepicker-columns">
        <!-- 小时列 -->
        <div class="timepicker-col">
          <div class="timepicker-col-header">时</div>
          <ul ref="hourList" class="timepicker-col-list">
            <li
              v-for="h in hours"
              :key="h"
              :class="['timepicker-col-item', { active: h === selectedHour }]"
              @click.stop="selectHour(h)"
            >
              {{ h }}
            </li>
          </ul>
        </div>

        <!-- 分钟列 -->
        <div class="timepicker-col">
          <div class="timepicker-col-header">分</div>
          <ul ref="minuteList" class="timepicker-col-list">
            <li
              v-for="m in minutes"
              :key="m"
              :class="['timepicker-col-item', { active: m === selectedMinute }]"
              @click.stop="selectMinute(m)"
            >
              {{ m }}
            </li>
          </ul>
        </div>

        <!-- 秒列 -->
        <div class="timepicker-col">
          <div class="timepicker-col-header">秒</div>
          <ul ref="secondList" class="timepicker-col-list">
            <li
              v-for="s in seconds"
              :key="s"
              :class="['timepicker-col-item', { active: s === selectedSecond }]"
              @click.stop="selectSecond(s)"
            >
              {{ s }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 操作栏 -->
      <div class="timepicker-footer">
        <button class="timepicker-btn timepicker-btn-cancel" @click.stop="cancelPanel">取消</button>
        <button class="timepicker-btn timepicker-btn-confirm" @click.stop="confirmPanel">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { ComponentData } from '@/types'

const props = defineProps<{ component: ComponentData }>()

const isPreview = inject('isPreview', false)

// ---- 面板开关 ----
const panelOpen = ref(false)
const rootEl = ref<HTMLElement | null>(null)

// ---- 时间单位数组 ----
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const seconds = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

// ---- 当前选中值（临时，面板内部状态） ----
const selectedHour = ref('00')
const selectedMinute = ref('00')
const selectedSecond = ref('00')

// ---- 已确认并显示的值 ----
const displayValue = ref((props.component.props.value as string) ?? '')

// 列表 ref（用于自动滚动到选中项）
const hourList = ref<HTMLElement | null>(null)
const minuteList = ref<HTMLElement | null>(null)
const secondList = ref<HTMLElement | null>(null)

// ---- 从 value prop 解析初始选中 ----
const parseValue = (val: string) => {
  const parts = val.split(':')
  if (parts.length === 3) {
    selectedHour.value   = parts[0].padStart(2, '0')
    selectedMinute.value = parts[1].padStart(2, '0')
    selectedSecond.value = parts[2].padStart(2, '0')
  }
}

watch(
  () => props.component.props.value as string,
  (val) => {
    if (val) {
      displayValue.value = val
      parseValue(val)
    }
  },
  { immediate: true },
)

// ---- 滚动列表到选中项 ----
const scrollToSelected = (listEl: HTMLElement | null, selectedVal: string, items: string[]) => {
  if (!listEl) return
  const idx = items.indexOf(selectedVal)
  if (idx < 0) return
  const itemHeight = 36
  listEl.scrollTop = idx * itemHeight
}

// ---- 打开/关闭面板 ----
const togglePanel = () => {
  if (props.component.props.disabled) return
  panelOpen.value = !panelOpen.value
  if (panelOpen.value) {
    // 解析当前显示值，初始化临时选择
    if (displayValue.value) parseValue(displayValue.value)
    // 下一帧滚动到已选中项
    nextTick(() => {
      scrollToSelected(hourList.value, selectedHour.value, hours)
      scrollToSelected(minuteList.value, selectedMinute.value, minutes)
      scrollToSelected(secondList.value, selectedSecond.value, seconds)
    })
  }
}

const selectHour = (h: string) => {
  selectedHour.value = h
}

const selectMinute = (m: string) => {
  selectedMinute.value = m
}

const selectSecond = (s: string) => {
  selectedSecond.value = s
}

const confirmPanel = () => {
  displayValue.value = `${selectedHour.value}:${selectedMinute.value}:${selectedSecond.value}`
  panelOpen.value = false
}

const cancelPanel = () => {
  panelOpen.value = false
}

// ---- 点击外部关闭 ----
const onClickOutside = (e: MouseEvent) => {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) {
    panelOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

// ---- 样式 ----
const wrapperStyle = computed(() => ({
  width: '100%',
  height: '100%',
  boxSizing: 'border-box' as const,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '0 10px',
  backgroundColor: props.component.style.backgroundColor ?? '#ffffff',
  border: panelOpen.value ? '1px solid #409eff' : '1px solid #dcdfe6',
  borderRadius: props.component.style.borderRadius
    ? `${props.component.style.borderRadius}px`
    : '4px',
  cursor: isPreview ? (props.component.props.disabled ? 'not-allowed' : 'pointer') : 'default',
  position: 'relative' as const,
  userSelect: 'none' as const,
  opacity: props.component.props.disabled ? 0.5 : 1,
}))
</script>

<style scoped>
.timepicker-display {
  user-select: none;
}

.timepicker-icon {
  width: 14px;
  height: 14px;
  color: #c0c4cc;
  flex-shrink: 0;
}

.timepicker-placeholder {
  font-size: 14px;
  color: #c0c4cc;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timepicker-value {
  font-size: 14px;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timepicker-arrow {
  width: 14px;
  height: 14px;
  color: #c0c4cc;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.timepicker-arrow.open {
  transform: rotate(180deg);
}

.timepicker-interactive:hover .timepicker-arrow {
  color: #409eff;
}

/* ---- 面板 ---- */
.timepicker-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 9999;
  min-width: 220px;
  overflow: hidden;
}

.timepicker-columns {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
}

.timepicker-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f5f5f5;
}

.timepicker-col:last-child {
  border-right: none;
}

.timepicker-col-header {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  padding: 6px 0;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
}

.timepicker-col-list {
  list-style: none;
  margin: 0;
  padding: 0;
  height: 180px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.timepicker-col-list::-webkit-scrollbar {
  width: 4px;
}

.timepicker-col-list::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 2px;
}

.timepicker-col-item {
  height: 36px;
  line-height: 36px;
  text-align: center;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.timepicker-col-item:hover {
  background: #f5f7fa;
}

.timepicker-col-item.active {
  color: #409eff;
  font-weight: 600;
  background: #ecf5ff;
}

/* ---- 操作栏 ---- */
.timepicker-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 12px;
  background: #fafafa;
}

.timepicker-btn {
  height: 28px;
  padding: 0 14px;
  font-size: 13px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.timepicker-btn-cancel {
  background: #fff;
  color: #606266;
}

.timepicker-btn-cancel:hover {
  border-color: #409eff;
  color: #409eff;
}

.timepicker-btn-confirm {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.timepicker-btn-confirm:hover {
  background: #337ecc;
  border-color: #337ecc;
}
</style>
