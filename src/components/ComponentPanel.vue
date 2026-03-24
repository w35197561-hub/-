<template>
  <div class="component-panel">
    <div class="panel-header">
      <h3>组件库</h3>
    </div>
    
    <div class="component-list">
      <div 
        v-for="component in componentTypes" 
        :key="component.type"
        class="component-item"
        draggable="true"
        @dragstart="handleDragStart(component.type, $event)"
        @dragend="handleDragEnd"
      >
        <div class="component-icon">
          <el-icon>
            <component :is="component.icon" />
          </el-icon>
        </div>
        <div class="component-name">{{ component.name }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ComponentType } from '@/types'
import {
  Document,
  Picture,
  CircleCheck,
  EditPen
} from '@element-plus/icons-vue'

const componentTypes = ref([
  { type: ComponentType.TEXT, name: '文本', icon: Document },
  { type: ComponentType.IMAGE, name: '图片', icon: Picture },
  { type: ComponentType.BUTTON, name: '按钮', icon: CircleCheck },
  { type: ComponentType.INPUT, name: '输入框', icon: EditPen }
])

const handleDragStart = (componentType: ComponentType, event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('componentType', componentType)
    event.dataTransfer.effectAllowed = 'copy'
  }
}

const handleDragEnd = () => {
  // 拖拽结束处理
}
</script>

<style scoped>
.component-panel {
  width: 200px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
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
  padding: 16px;
  overflow-y: auto;
}

.component-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: grab;
  transition: all 0.2s;
  user-select: none;
}

.component-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.component-item:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.component-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.component-icon .el-icon {
  font-size: 20px;
  color: #409eff;
}

.component-name {
  font-size: 12px;
  color: #666;
  text-align: center;
}
</style>