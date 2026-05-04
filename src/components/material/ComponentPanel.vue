<template>
  <div class="component-panel">
    <div class="panel-header">
      <h3>组件库</h3>
    </div>

    <div class="component-list">
      <div v-for="group in componentGroups" :key="group.label" class="component-group">
        <div class="group-label">{{ group.label }}</div>
        <div class="component-grid">
          <div
            v-for="component in group.items"
            :key="component.type"
            class="component-item"
            :data-testid="`component-item-${component.type}`"
            draggable="true"
            @dragstart="handleDragStart(component.type, $event)"
            @dragend="handleDragEnd"
          >
            <el-icon class="component-icon">
              <component :is="component.icon" />
            </el-icon>
            <span class="component-name">{{ component.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ComponentType } from '@/types'
import {
  Document,
  Picture,
  CircleCheck,
  EditPen,
  Tickets,
  Menu,
  Odometer,
  ArrowDown,
  Memo,
  Select,
  TrendCharts,
  Grid,
  Minus,
  Timer,
  List,
} from '@element-plus/icons-vue'

const componentGroups = [
  {
    label: '基础',
    items: [
      { type: ComponentType.TEXT, name: '文本', icon: Document },
      { type: ComponentType.TEXTAREA, name: '多行文本', icon: Memo },
      { type: ComponentType.INPUT, name: '输入框', icon: EditPen },
      { type: ComponentType.NUMBER_INPUT, name: '数字输入', icon: Odometer },
      { type: ComponentType.BUTTON, name: '按钮', icon: CircleCheck },
      { type: ComponentType.IMAGE, name: '图片', icon: Picture },
      { type: ComponentType.RADIO_GROUP, name: '单选按钮', icon: Select },
      { type: ComponentType.SELECT, name: '下拉复选', icon: ArrowDown },
      { type: ComponentType.CHECKBOX_GROUP, name: '多选复选框', icon: Grid },
      { type: ComponentType.DIVIDER, name: '分割线', icon: Minus },
      { type: ComponentType.TIME_PICKER, name: '时间选择', icon: Timer },
    ],
  },
  {
    label: '容器',
    items: [
      { type: ComponentType.FORM, name: '表单容器', icon: Tickets },
      { type: ComponentType.TABS, name: 'Tabs容器', icon: Menu },
      { type: ComponentType.TABLE, name: '表格', icon: List },
      { type: ComponentType.CHART, name: '图表', icon: TrendCharts },
    ],
  },
]

const handleDragStart = (componentType: ComponentType, event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('componentType', componentType)
    event.dataTransfer.effectAllowed = 'copy'
  }
}

const handleDragEnd = () => {}
</script>

<style scoped>
.component-panel {
  width: 240px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 14px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.component-list {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.component-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  padding: 0 2px;
}

.component-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: white;
  cursor: grab;
  user-select: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  overflow: hidden;
}

.component-item:hover {
  border-color: #409eff;
  box-shadow: 0 1px 6px rgba(64, 158, 255, 0.12);
}

.component-item:active {
  cursor: grabbing;
  transform: scale(0.97);
}

.component-icon {
  font-size: 15px;
  color: #606266;
  flex-shrink: 0;
}

.component-name {
  font-size: 12px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
