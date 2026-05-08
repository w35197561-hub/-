<template>
  <div :style="containerStyle" class="collapse-wrap">
    <div
      v-for="item in items"
      :key="item.name"
      class="collapse-item"
      :class="{ 'collapse-item--active': isExpanded(item.name) }"
    >
      <!-- 面板头 -->
      <div
        class="collapse-header"
        :style="headerStyle"
        @click="isPreview ? togglePanel(item.name) : undefined"
      >
        <svg
          class="collapse-arrow"
          :class="{ 'collapse-arrow--open': isExpanded(item.name) }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="9 6 15 12 9 18" />
        </svg>
        <span class="collapse-title">{{ item.title }}</span>
      </div>

      <!-- 面板内容 -->
      <div v-show="isExpanded(item.name)" class="collapse-body">
        <span class="collapse-content">{{ item.content }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { ComponentData } from '@/types'

interface CollapseItem {
  name: string
  title: string
  content: string
}

const props = defineProps<{ component: ComponentData }>()

const isPreview = inject('isPreview', false)

const items = computed<CollapseItem[]>(
  () =>
    (props.component.props.items as CollapseItem[] | undefined) ?? [
      { name: 'panel1', title: '面板一', content: '面板一的内容' },
      { name: 'panel2', title: '面板二', content: '面板二的内容' },
    ],
)

const accordion = computed(() => props.component.props.accordion === true)

// 运行态：记录当前展开的面板名称集合
const expandedNames = ref<Set<string>>(new Set(items.value.map((item) => item.name)))

// 设计态全部展开，运行态由 expandedNames 控制
function isExpanded(name: string): boolean {
  if (!isPreview) return true
  return expandedNames.value.has(name)
}

function togglePanel(name: string) {
  if (accordion.value) {
    // 手风琴：只允许一个展开
    if (expandedNames.value.has(name)) {
      expandedNames.value.delete(name)
    } else {
      expandedNames.value.clear()
      expandedNames.value.add(name)
    }
  } else {
    if (expandedNames.value.has(name)) {
      expandedNames.value.delete(name)
    } else {
      expandedNames.value.add(name)
    }
  }
  // 触发响应式更新
  expandedNames.value = new Set(expandedNames.value)
}

const containerStyle = computed(() => ({
  width: '100%',
  height: '100%',
  boxSizing: 'border-box' as const,
  backgroundColor: props.component.style.backgroundColor ?? '#ffffff',
  borderRadius: props.component.style.borderRadius
    ? `${props.component.style.borderRadius}px`
    : '4px',
  border: '1px solid #e4e7ed',
  overflow: 'hidden',
}))

const headerStyle = computed(() => ({
  cursor: isPreview ? 'pointer' : 'default',
  userSelect: 'none' as const,
}))
</script>

<style scoped>
.collapse-wrap {
  display: flex;
  flex-direction: column;
}

.collapse-item {
  border-bottom: 1px solid #e4e7ed;
}

.collapse-item:last-child {
  border-bottom: none;
}

.collapse-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: #fafafa;
  font-size: 14px;
  color: #333;
  transition: background 0.15s;
}

.collapse-item--active .collapse-header {
  color: #409eff;
}

.collapse-header:hover {
  background: #f0f6ff;
}

.collapse-arrow {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: #909399;
  transition: transform 0.2s;
}

.collapse-arrow--open {
  transform: rotate(90deg);
  color: #409eff;
}

.collapse-title {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collapse-body {
  padding: 12px 14px;
  background: #fff;
}

.collapse-content {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}
</style>
