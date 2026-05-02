<template>
  <!-- 设计态：静态占位 -->
  <div v-if="!isPreview" :style="wrapperStyle" class="timepicker-display">
    <svg class="timepicker-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
    <span class="timepicker-placeholder">{{ component.props.placeholder ?? '请选择日期时间' }}</span>
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
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
    <span :class="['timepicker-value', { 'timepicker-placeholder': !displayValue }]">
      {{ displayValue || (component.props.placeholder ?? '请选择日期时间') }}
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

    <!-- 选择面板 -->
    <div v-if="panelOpen" class="timepicker-panel" @click.stop>
      <div class="timepicker-columns">
        <!-- 年 -->
        <div class="timepicker-col">
          <div class="timepicker-col-header">年</div>
          <ul ref="yearList" class="timepicker-col-list">
            <li
              v-for="y in years"
              :key="y"
              :class="['timepicker-col-item', { active: y === selectedYear }]"
              @click.stop="selectYear(y)"
            >{{ y }}</li>
          </ul>
        </div>
        <!-- 月 -->
        <div class="timepicker-col">
          <div class="timepicker-col-header">月</div>
          <ul ref="monthList" class="timepicker-col-list">
            <li
              v-for="m in months"
              :key="m"
              :class="['timepicker-col-item', { active: m === selectedMonth }]"
              @click.stop="selectMonth(m)"
            >{{ m }}</li>
          </ul>
        </div>
        <!-- 日 -->
        <div class="timepicker-col">
          <div class="timepicker-col-header">日</div>
          <ul ref="dayList" class="timepicker-col-list">
            <li
              v-for="d in days"
              :key="d"
              :class="['timepicker-col-item', { active: d === selectedDay }]"
              @click.stop="selectDay(d)"
            >{{ d }}</li>
          </ul>
        </div>
        <!-- 分隔线 -->
        <div class="timepicker-col-divider" />
        <!-- 时 -->
        <div class="timepicker-col">
          <div class="timepicker-col-header">时</div>
          <ul ref="hourList" class="timepicker-col-list">
            <li
              v-for="h in hours"
              :key="h"
              :class="['timepicker-col-item', { active: h === selectedHour }]"
              @click.stop="selectHour(h)"
            >{{ h }}</li>
          </ul>
        </div>
        <!-- 分 -->
        <div class="timepicker-col">
          <div class="timepicker-col-header">分</div>
          <ul ref="minuteList" class="timepicker-col-list">
            <li
              v-for="m in minutes"
              :key="m"
              :class="['timepicker-col-item', { active: m === selectedMinute }]"
              @click.stop="selectMinute(m)"
            >{{ m }}</li>
          </ul>
        </div>
        <!-- 秒 -->
        <div class="timepicker-col">
          <div class="timepicker-col-header">秒</div>
          <ul ref="secondList" class="timepicker-col-list">
            <li
              v-for="s in seconds"
              :key="s"
              :class="['timepicker-col-item', { active: s === selectedSecond }]"
              @click.stop="selectSecond(s)"
            >{{ s }}</li>
          </ul>
        </div>
      </div>

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

const panelOpen = ref(false)
const rootEl = ref<HTMLElement | null>(null)

// ---- 静态数据 ----
const currentYear = new Date().getFullYear()
const years  = Array.from({ length: 21 }, (_, i) => String(currentYear - 10 + i))
const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
const hours   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const seconds = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

// ---- 临时选中状态 ----
const selectedYear   = ref(String(currentYear))
const selectedMonth  = ref('01')
const selectedDay    = ref('01')
const selectedHour   = ref('00')
const selectedMinute = ref('00')
const selectedSecond = ref('00')

// ---- 日列表（随年月变化） ----
const days = computed(() => {
  const d = new Date(Number(selectedYear.value), Number(selectedMonth.value), 0).getDate()
  return Array.from({ length: d }, (_, i) => String(i + 1).padStart(2, '0'))
})

// 切换月份时若当前日超出范围则修正
watch(days, (list) => {
  if (!list.includes(selectedDay.value)) {
    selectedDay.value = list[list.length - 1]
  }
})

// ---- 已确认并显示的值 ----
const displayValue = ref((props.component.props.value as string) ?? '')

// ---- 列表 ref ----
const yearList   = ref<HTMLElement | null>(null)
const monthList  = ref<HTMLElement | null>(null)
const dayList    = ref<HTMLElement | null>(null)
const hourList   = ref<HTMLElement | null>(null)
const minuteList = ref<HTMLElement | null>(null)
const secondList = ref<HTMLElement | null>(null)

// ---- 解析 value 字符串 ----
const parseValue = (val: string) => {
  // 支持 "YYYY-MM-DD HH:mm:ss" 或 "HH:mm:ss"
  const dtMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})$/)
  if (dtMatch) {
    selectedYear.value   = dtMatch[1]
    selectedMonth.value  = dtMatch[2]
    selectedDay.value    = dtMatch[3]
    selectedHour.value   = dtMatch[4]
    selectedMinute.value = dtMatch[5]
    selectedSecond.value = dtMatch[6]
    return
  }
  const tMatch = val.match(/^(\d{2}):(\d{2}):(\d{2})$/)
  if (tMatch) {
    selectedHour.value   = tMatch[1]
    selectedMinute.value = tMatch[2]
    selectedSecond.value = tMatch[3]
  }
}

watch(
  () => props.component.props.value as string,
  (val) => { if (val) { displayValue.value = val; parseValue(val) } },
  { immediate: true },
)

// ---- 滚动到选中项 ----
const scrollTo = (el: HTMLElement | null, val: string, list: string[]) => {
  if (!el) return
  const idx = list.indexOf(val)
  if (idx >= 0) el.scrollTop = idx * 36
}

// ---- 面板开关 ----
const togglePanel = () => {
  if (props.component.props.disabled) return
  panelOpen.value = !panelOpen.value
  if (panelOpen.value) {
    if (displayValue.value) parseValue(displayValue.value)
    nextTick(() => {
      scrollTo(yearList.value,   selectedYear.value,   years)
      scrollTo(monthList.value,  selectedMonth.value,  months)
      scrollTo(dayList.value,    selectedDay.value,    days.value)
      scrollTo(hourList.value,   selectedHour.value,   hours)
      scrollTo(minuteList.value, selectedMinute.value, minutes)
      scrollTo(secondList.value, selectedSecond.value, seconds)
    })
  }
}

const selectYear   = (v: string) => { selectedYear.value = v }
const selectMonth  = (v: string) => { selectedMonth.value = v }
const selectDay    = (v: string) => { selectedDay.value = v }
const selectHour   = (v: string) => { selectedHour.value = v }
const selectMinute = (v: string) => { selectedMinute.value = v }
const selectSecond = (v: string) => { selectedSecond.value = v }

const confirmPanel = () => {
  displayValue.value = `${selectedYear.value}-${selectedMonth.value}-${selectedDay.value} ${selectedHour.value}:${selectedMinute.value}:${selectedSecond.value}`
  panelOpen.value = false
}

const cancelPanel = () => { panelOpen.value = false }

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

.timepicker-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 9999;
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
  min-width: 52px;
  border-right: 1px solid #f5f5f5;
}

.timepicker-col:last-child {
  border-right: none;
}

.timepicker-col-divider {
  width: 1px;
  background: #e0e0e0;
  flex-shrink: 0;
}

.timepicker-col-header {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  padding: 6px 0;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
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
  font-size: 13px;
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
