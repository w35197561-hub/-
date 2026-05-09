<template>
  <!-- 设计态：静态递归渲染，禁止交互 -->
  <div v-if="!isPreview" :style="containerStyle" class="tree-static">
    <div v-for="node in treeData" :key="node.value" class="tree-node">
      <div class="tree-node-label">
        <span class="tree-node-icon">{{ node.children?.length ? '▶' : '·' }}</span>
        <span>{{ node.label }}</span>
      </div>
      <div v-if="node.children?.length" class="tree-children">
        <div v-for="child in node.children" :key="child.value" class="tree-child-node">
          <span class="tree-node-icon tree-node-icon--child">·</span>
          <span>{{ child.label }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 运行态：原生交互树 -->
  <div v-else :style="containerStyle" class="tree-interactive">
    <div v-for="node in treeData" :key="node.value" class="tree-node">
      <div class="tree-node-label tree-node-label--interactive" @click="toggleNode(node.value)">
        <span class="tree-node-icon">
          {{ node.children?.length ? (isExpanded(node.value) ? '▼' : '▶') : '·' }}
        </span>
        <span>{{ node.label }}</span>
      </div>
      <div v-if="node.children?.length && isExpanded(node.value)" class="tree-children">
        <div v-for="child in node.children" :key="child.value" class="tree-child-node">
          <span class="tree-node-icon tree-node-icon--child">·</span>
          <span>{{ child.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import type { ComponentData } from '@/types'

interface TreeNode {
  label: string
  value: string
  children?: TreeNode[]
}

const props = defineProps<{ component: ComponentData }>()

const isPreview = inject('isPreview', false)

const treeData = computed(() => (props.component.props.data as TreeNode[] | undefined) ?? [])

const defaultExpandAll = computed(() => !!props.component.props.defaultExpandAll)

// 运行态展开状态：存储当前展开节点的 value 集合
const expandedKeys = ref<Set<string>>(new Set())

// 当 defaultExpandAll 或 treeData 变化时同步展开状态
watch(
  [defaultExpandAll, treeData],
  ([expand, data]) => {
    if (expand) {
      expandedKeys.value = new Set(data.map((n) => n.value))
    } else {
      expandedKeys.value = new Set()
    }
  },
  { immediate: true },
)

const isExpanded = (value: string): boolean => expandedKeys.value.has(value)

const toggleNode = (value: string) => {
  const next = new Set(expandedKeys.value)
  if (next.has(value)) {
    next.delete(value)
  } else {
    next.add(value)
  }
  expandedKeys.value = next
}

// 容器样式：overflow:auto 保证内容溢出时可滚动
const containerStyle = computed(() => ({
  width: '100%',
  height: '100%',
  boxSizing: 'border-box' as const,
  overflow: 'auto',
  fontSize: props.component.style.fontSize ? `${props.component.style.fontSize}px` : '14px',
  padding: '8px',
}))
</script>

<style scoped>
.tree-static,
.tree-interactive {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tree-node {
  display: flex;
  flex-direction: column;
}

.tree-node-label {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px;
  border-radius: 3px;
  cursor: default;
  user-select: none;
  white-space: nowrap;
}

.tree-node-label--interactive {
  cursor: pointer;
}

.tree-node-label--interactive:hover {
  background-color: #f0f6ff;
}

.tree-node-icon {
  display: inline-block;
  width: 14px;
  text-align: center;
  font-size: 10px;
  color: #909399;
  flex-shrink: 0;
}

.tree-node-icon--child {
  margin-left: 16px;
}

.tree-children {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tree-child-node {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px;
  border-radius: 3px;
  user-select: none;
  white-space: nowrap;
}
</style>
