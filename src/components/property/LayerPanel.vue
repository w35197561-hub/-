<template>
  <div class="layer-panel">
    <div class="layer-panel-header">
      <span class="layer-panel-title">图层列表</span>
      <span class="layer-count">{{ layers.length }} 个组件</span>
    </div>
    <div class="layer-list" v-if="layers.length">
      <div
        v-for="layer in layers"
        :key="layer.id"
        class="layer-item"
        :class="{
          'layer-item--selected': layer.id === currentComponentId,
          'layer-item--dragging-over': dragOverId === layer.id
        }"
        draggable="true"
        @click="handleSelectLayer(layer.id)"
        @dragstart="handleDragStart(layer, $event)"
        @dragover.prevent="handleDragOver(layer.id, $event)"
        @dragleave="handleDragLeave"
        @drop="handleDrop(layer, $event)"
        @dragend="handleDragEnd"
      >
        <!-- 拖拽手柄 -->
        <el-icon class="drag-handle" title="拖拽调整层级顺序">
          <Rank />
        </el-icon>

        <!-- 组件类型图标 -->
        <span class="layer-type-icon">{{ getTypeIcon(layer.type) }}</span>

        <!-- 组件名称 -->
        <span class="layer-name" :title="layer.name">{{ layer.name }}</span>

        <!-- z-index 徽章 -->
        <span
          class="layer-zindex"
          :class="getZIndexClass(layer.zIndex)"
          :title="`z-index: ${layer.zIndex}`"
        >
          {{ layer.zIndex }}
        </span>

        <!-- 快速操作：上移/下移 -->
        <div class="layer-actions">
          <el-tooltip content="上移一层" placement="top" :show-after="500">
            <el-icon
              class="layer-action-btn"
              :class="{ disabled: layer.id === topLayerId }"
              @click.stop="moveUp(layer.id)"
            >
              <ArrowUp />
            </el-icon>
          </el-tooltip>
          <el-tooltip content="下移一层" placement="top" :show-after="500">
            <el-icon
              class="layer-action-btn"
              :class="{ disabled: layer.id === bottomLayerId }"
              @click.stop="moveDown(layer.id)"
            >
              <ArrowDown />
            </el-icon>
          </el-tooltip>
        </div>
      </div>
    </div>
    <div v-else class="layer-empty">
      <el-icon><PictureFilled /></el-icon>
      <p>暂无组件</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { ComponentType } from '@/types'
import type { ComponentData } from '@/types'
import { ArrowUp, ArrowDown, Rank, PictureFilled } from '@element-plus/icons-vue'

const editorStore = useEditorStore()

// 按 zIndex 从大到小排列（越靠上的层级越高）
const layers = computed(() => {
  if (!editorStore.currentPage) return []
  return [...editorStore.currentPage.components]
    .sort((a, b) => b.style.zIndex - a.style.zIndex)
    .map((c, idx) => ({
      id: c.id,
      type: c.type,
      name: getComponentName(c, idx),
      zIndex: c.style.zIndex
    }))
})

const currentComponentId = computed(() => editorStore.currentComponent?.id)

const topLayerId = computed(() => layers.value[0]?.id)
const bottomLayerId = computed(() => layers.value[layers.value.length - 1]?.id)

const getComponentName = (c: ComponentData, idx: number): string => {
  const typeNames: Record<ComponentType, string> = {
    [ComponentType.TEXT]: '文本',
    [ComponentType.IMAGE]: '图片',
    [ComponentType.BUTTON]: '按钮',
    [ComponentType.INPUT]: '输入框',
    [ComponentType.FORM]: '表单容器',
    [ComponentType.CHART]: '图表',
    [ComponentType.TABS]: '标签页',
    [ComponentType.NUMBER_INPUT]: '数字输入',
    [ComponentType.SELECT]: '下拉复选',
    [ComponentType.TEXTAREA]: '多行文本',
    [ComponentType.RADIO_GROUP]: '单选按钮',
  }
  const baseName = typeNames[c.type] || c.type
  // 尝试取 props 中有意义的标识
  const label = (c.props.content || c.props.title || c.props.placeholder) as string | undefined
  return label ? `${baseName}·${String(label).slice(0, 8)}` : `${baseName} ${idx + 1}`
}

const getTypeIcon = (type: ComponentType): string => {
  const icons: Record<ComponentType, string> = {
    [ComponentType.TEXT]: 'T',
    [ComponentType.IMAGE]: '🖼',
    [ComponentType.BUTTON]: '⬡',
    [ComponentType.INPUT]: '▭',
    [ComponentType.FORM]: '⊞',
    [ComponentType.CHART]: '📊',
    [ComponentType.TABS]: '⧉',
    [ComponentType.NUMBER_INPUT]: '⓪',
    [ComponentType.SELECT]: '▾',
    [ComponentType.TEXTAREA]: '≡',
    [ComponentType.RADIO_GROUP]: '◉',
  }
  return icons[type] || '□'
}

const getZIndexClass = (z: number): string => {
  const max = layers.value[0]?.zIndex ?? 1
  const min = layers.value[layers.value.length - 1]?.zIndex ?? 1
  const range = max - min || 1
  const ratio = (z - min) / range
  if (ratio >= 0.67) return 'zindex-high'
  if (ratio >= 0.34) return 'zindex-mid'
  return 'zindex-low'
}

const handleSelectLayer = (id: string) => {
  editorStore.selectComponent(id)
}

const moveUp = (id: string) => {
  editorStore.moveComponentLayer(id, 'up')
}

const moveDown = (id: string) => {
  editorStore.moveComponentLayer(id, 'down')
}

// ---- 拖拽排序 ----
const draggingId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)

const handleDragStart = (layer: { id: string }, event: DragEvent) => {
  draggingId.value = layer.id
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('layerId', layer.id)
  }
}

const handleDragOver = (id: string, event: DragEvent) => {
  if (id === draggingId.value) return
  dragOverId.value = id
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleDragLeave = () => {
  dragOverId.value = null
}

const handleDrop = (targetLayer: { id: string; zIndex: number }, event: DragEvent) => {
  event.preventDefault()
  const sourceId = event.dataTransfer?.getData('layerId') || draggingId.value
  if (!sourceId || sourceId === targetLayer.id) {
    dragOverId.value = null
    return
  }
  // 将拖拽来源的 zIndex 设置为目标的 zIndex，目标 zIndex 调整
  const sourceComp = editorStore.getComponentById(sourceId)
  const targetComp = editorStore.getComponentById(targetLayer.id)
  if (!sourceComp || !targetComp) return

  const oldSourceZ = sourceComp.style.zIndex
  const oldTargetZ = targetComp.style.zIndex
  // 交换两者的 zIndex
  editorStore.setComponentZIndex(sourceId, oldTargetZ)
  editorStore.setComponentZIndex(targetLayer.id, oldSourceZ)

  dragOverId.value = null
  draggingId.value = null
}

const handleDragEnd = () => {
  draggingId.value = null
  dragOverId.value = null
}
</script>

<style scoped>
.layer-panel {
  border-top: 1px solid #f0f0f0;
  padding: 0;
}

.layer-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 8px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.layer-panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.layer-count {
  font-size: 11px;
  color: #999;
  background: #eef2f8;
  padding: 1px 7px;
  border-radius: 10px;
}

.layer-list {
  max-height: 240px;
  overflow-y: auto;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.15s;
  user-select: none;
}

.layer-item:hover {
  background: #f0f6ff;
}

.layer-item--selected {
  background: #e6f0ff;
  border-left: 3px solid #409eff;
  padding-left: 7px;
}

.layer-item--dragging-over {
  background: #fff3e6;
  border-top: 2px dashed #f5a623;
}

.drag-handle {
  font-size: 14px;
  color: #bbb;
  cursor: grab;
  flex-shrink: 0;
}

.drag-handle:active {
  cursor: grabbing;
}

.layer-type-icon {
  font-size: 13px;
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.layer-name {
  flex: 1;
  font-size: 12px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.layer-zindex {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 8px;
  flex-shrink: 0;
}

.zindex-high {
  background: #fef0e7;
  color: #e6740a;
}

.zindex-mid {
  background: #eef7ee;
  color: #4caf50;
}

.zindex-low {
  background: #edf1f5;
  color: #888;
}

.layer-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.layer-action-btn {
  font-size: 14px;
  padding: 2px;
  border-radius: 3px;
  color: #666;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.layer-action-btn:hover {
  background: #409eff;
  color: white;
}

.layer-action-btn.disabled {
  color: #ccc;
  cursor: not-allowed;
  pointer-events: none;
}

.layer-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  color: #bbb;
  font-size: 12px;
  gap: 6px;
}

.layer-empty .el-icon {
  font-size: 28px;
}

.layer-empty p {
  margin: 0;
}
</style>
