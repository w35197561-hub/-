<template>
  <!-- 设计态：静态占位，禁止交互 -->
  <div v-if="!isPreview" :style="triggerStyle" class="cascader-trigger cascader-trigger--design">
    <span :class="['cascader-value', { 'cascader-placeholder': !displayText }]">
      {{ displayText || (component.props.placeholder ?? '请选择') }}
    </span>
    <svg
      class="cascader-arrow"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </div>

  <!-- 运行态：完整交互逻辑 -->
  <div
    v-else
    ref="triggerEl"
    :style="triggerStyle"
    class="cascader-trigger cascader-trigger--interactive"
    @click="toggleOpen"
  >
    <span :class="['cascader-value', { 'cascader-placeholder': !displayText }]">
      {{ displayText || (component.props.placeholder ?? '请选择') }}
    </span>
    <!-- 清空按钮 -->
    <span v-if="clearable && displayText" class="cascader-clear" @click.stop="clearSelection">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </span>
    <svg
      v-else
      class="cascader-arrow"
      :class="{ open: isOpen }"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>

    <!-- 浮层：fixed 定位，通过 getBoundingClientRect 计算位置 -->
    <Teleport to="body">
      <div v-if="isOpen" :style="dropdownStyle" class="cascader-dropdown" @click.stop>
        <!-- 逐列渲染 -->
        <div v-for="(colOptions, colIdx) in activeColumns" :key="colIdx" class="cascader-column">
          <div
            v-for="opt in colOptions"
            :key="opt.value"
            :class="[
              'cascader-option',
              {
                'cascader-option--active': isActive(colIdx, opt.value),
                'cascader-option--has-children': !!opt.children?.length,
              },
            ]"
            @click="selectOption(colIdx, opt)"
          >
            <span class="cascader-option-label">{{ opt.label }}</span>
            <svg
              v-if="opt.children?.length"
              class="cascader-option-arrow"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, onUnmounted, nextTick } from 'vue'
import type { ComponentData } from '@/types'

interface CascaderOption {
  label: string
  value: string
  children?: CascaderOption[]
}

const props = defineProps<{ component: ComponentData }>()

const isPreview = inject('isPreview', false)

// 运行态状态
const isOpen = ref(false)
const triggerEl = ref<HTMLElement | null>(null)
// 每一级选中的 value，selectedPath[i] 对应第 i 级选中项
const selectedPath = ref<string[]>([])

const options = computed(
  () => (props.component.props.options as CascaderOption[] | undefined) ?? [],
)

const clearable = computed(() => props.component.props.clearable !== false)

// 当前展示文本（选中路径用 / 拼接）
const displayText = computed(() => {
  if (selectedPath.value.length === 0) return ''
  const labels: string[] = []
  let list: CascaderOption[] = options.value
  for (const val of selectedPath.value) {
    const found = list.find((o) => o.value === val)
    if (!found) break
    labels.push(found.label)
    list = found.children ?? []
  }
  return labels.join(' / ')
})

// 根据 selectedPath 构建列数组：第 0 列是 options，后续列是各级 children
const activeColumns = computed<CascaderOption[][]>(() => {
  const cols: CascaderOption[][] = [options.value]
  let list: CascaderOption[] = options.value
  for (const val of selectedPath.value) {
    const found = list.find((o) => o.value === val)
    if (!found || !found.children?.length) break
    cols.push(found.children)
    list = found.children
  }
  return cols
})

// 判断某一列某个选项是否被选中（active）
function isActive(colIdx: number, value: string): boolean {
  return selectedPath.value[colIdx] === value
}

// 触发框样式
const triggerStyle = computed(() => ({
  width: '100%',
  height: '100%',
  boxSizing: 'border-box' as const,
  display: 'flex',
  alignItems: 'center',
  padding: '0 10px',
  backgroundColor: '#ffffff',
  border: isOpen.value ? '1px solid #409eff' : '1px solid #dcdfe6',
  borderRadius: props.component.style.borderRadius
    ? `${props.component.style.borderRadius}px`
    : '4px',
  cursor: isPreview ? 'pointer' : 'default',
  userSelect: 'none' as const,
  position: 'relative' as const,
}))

// 浮层定位样式（fixed，通过 getBoundingClientRect 计算）
const dropdownStyle = ref<Record<string, string>>({})

function updateDropdownPosition() {
  if (!triggerEl.value) return
  const rect = triggerEl.value.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    minWidth: `${rect.width}px`,
    zIndex: '9999',
  }
}

async function toggleOpen() {
  if (!isOpen.value) {
    isOpen.value = true
    await nextTick()
    updateDropdownPosition()
  } else {
    isOpen.value = false
  }
}

function selectOption(colIdx: number, opt: CascaderOption) {
  // 截断到当前列并设置选中值
  const newPath = selectedPath.value.slice(0, colIdx)
  newPath.push(opt.value)
  selectedPath.value = newPath

  // 叶子节点（无 children）→ 完成选中，关闭浮层
  if (!opt.children?.length) {
    isOpen.value = false
  }
}

function clearSelection() {
  selectedPath.value = []
  isOpen.value = false
}

function onClickOutside(e: MouseEvent) {
  if (!triggerEl.value) return
  if (!triggerEl.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside, true))
onUnmounted(() => document.removeEventListener('click', onClickOutside, true))
</script>

<style scoped>
.cascader-trigger {
  user-select: none;
}

.cascader-trigger--design {
  pointer-events: none;
}

.cascader-placeholder {
  font-size: 14px;
  color: #c0c4cc;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cascader-value {
  font-size: 14px;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cascader-arrow {
  width: 14px;
  height: 14px;
  color: #c0c4cc;
  flex-shrink: 0;
  transition: transform 0.2s;
  margin-left: 4px;
}

.cascader-arrow.open {
  transform: rotate(180deg);
}

.cascader-clear {
  display: flex;
  align-items: center;
  margin-left: 4px;
  flex-shrink: 0;
  cursor: pointer;
  color: #c0c4cc;
  transition: color 0.15s;
}

.cascader-clear:hover {
  color: #909399;
}

.cascader-clear svg {
  width: 14px;
  height: 14px;
}

/* 浮层（通过 Teleport 挂载到 body） */
.cascader-dropdown {
  display: flex;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.cascader-column {
  min-width: 120px;
  max-height: 220px;
  overflow-y: auto;
  border-right: 1px solid #f0f0f0;
}

.cascader-column:last-child {
  border-right: none;
}

.cascader-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  white-space: nowrap;
}

.cascader-option:hover {
  background: #f5f7fa;
}

.cascader-option--active {
  color: #409eff;
  background: #f0f6ff;
  font-weight: 500;
}

.cascader-option-label {
  flex: 1;
}

.cascader-option-arrow {
  width: 12px;
  height: 12px;
  color: #909399;
  margin-left: 8px;
  flex-shrink: 0;
}

.cascader-option--active .cascader-option-arrow {
  color: #409eff;
}
</style>
