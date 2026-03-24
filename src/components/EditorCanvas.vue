<template>
  <div class="editor-canvas">
    <div class="canvas-toolbar">
      <el-button-group>
        <el-button @click="zoomOut" :disabled="canvasScale <= 0.5">
          <el-icon><ZoomOut /></el-icon>
        </el-button>
        <el-button>{{ Math.round(canvasScale * 100) }}%</el-button>
        <el-button @click="zoomIn" :disabled="canvasScale >= 2">
          <el-icon><ZoomIn /></el-icon>
        </el-button>
        <el-button @click="resetZoom">
          <el-icon><FullScreen /></el-icon>
        </el-button>
      </el-button-group>
      
      <el-switch
        v-model="snapToGrid"
        active-text="吸附网格"
        inactive-text="自由拖拽"
      />
      
      <el-switch
        v-model="showGuidelines"
        active-text="显示辅助线"
        inactive-text="隐藏辅助线"
      />
    </div>
    
    <div 
      class="canvas-container"
      :style="{
        transform: `scale(${canvasScale})`,
        transformOrigin: 'center center'
      }"
      @mousedown="handleCanvasClick"
      @dragover="handleDragOver"
      @drop="handleDrop"
    >
      <div 
        class="canvas-background"
        :style="{
          width: `${currentPage?.style.width || 1200}px`,
          height: `${currentPage?.style.height || 800}px`,
          backgroundColor: currentPage?.style.backgroundColor || '#ffffff'
        }"
      >
        <div
          v-for="component in currentPage?.components"
          :key="component.id"
          class="component-wrapper"
          :class="{ selected: currentComponent?.id === component.id }"
          :style="{
            top: `${component.style.top}px`,
            left: `${component.style.left}px`,
            width: `${component.style.width}px`,
            height: `${component.style.height}px`,
            zIndex: component.style.zIndex,
            transform: `rotate(${component.style.rotate}deg)`
          }"
          @mousedown="handleComponentMouseDown(component, $event)"
        >
          <component
            :is="getComponentByType(component.type)"
            :component="component"
            class="component-content"
          />
          
          <div v-if="currentComponent?.id === component.id" class="component-resize-handles">
            <div class="handle handle-tl" @mousedown.stop="startResize(component, 'tl', $event)"></div>
            <div class="handle handle-tr" @mousedown.stop="startResize(component, 'tr', $event)"></div>
            <div class="handle handle-bl" @mousedown.stop="startResize(component, 'bl', $event)"></div>
            <div class="handle handle-br" @mousedown.stop="startResize(component, 'br', $event)"></div>
            <div class="handle handle-t" @mousedown.stop="startResize(component, 't', $event)"></div>
            <div class="handle handle-r" @mousedown.stop="startResize(component, 'r', $event)"></div>
            <div class="handle handle-b" @mousedown.stop="startResize(component, 'b', $event)"></div>
            <div class="handle handle-l" @mousedown.stop="startResize(component, 'l', $event)"></div>
          </div>
        </div>
        
        <div v-if="showGuidelines" class="guidelines">
          <!-- 简洁的十字辅助线 -->
          <div class="guideline vertical center" :style="{ left: '50%' }"></div>
          <div class="guideline horizontal center" :style="{ top: '50%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '@/stores/editor'
import type { ComponentData } from '@/types'
import { ComponentType } from '@/types'
import TextComponent from './components/TextComponent.vue'
import ImageComponent from './components/ImageComponent.vue'
import ButtonComponent from './components/ButtonComponent.vue'
import InputComponent from './components/InputComponent.vue'

const editorStore = useEditorStore()

const currentPage = computed(() => editorStore.currentPage)
const currentComponent = computed(() => editorStore.currentComponent)
const canvasScale = computed(() => editorStore.canvasScale)
const snapToGrid = computed({
  get: () => editorStore.snapToGrid,
  set: (value) => editorStore.setSnapToGrid(value)
})
const showGuidelines = computed({
  get: () => editorStore.showGuidelines,
  set: (value) => editorStore.setShowGuidelines(value)
})

const componentMap = {
  Text: TextComponent,
  Image: ImageComponent,
  Button: ButtonComponent,
  Input: InputComponent
}

const getComponentByType = (type: string) => {
  return componentMap[type as keyof typeof componentMap] || TextComponent
}

const selectComponent = (component: ComponentData) => {
  editorStore.selectComponent(component)
}

const handleComponentMouseDown = (component: ComponentData, event: MouseEvent) => {
  // 先选择组件
  selectComponent(component)
  
  // 然后开始拖拽
  startDrag(component, event)
  
  // 阻止事件冒泡，避免触发画布点击事件
  event.stopPropagation()
  event.preventDefault()
}

const handleCanvasClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    editorStore.selectComponent(null)
  }
}

const zoomIn = () => {
  editorStore.setCanvasScale(Math.min(canvasScale.value + 0.1, 2))
}

const zoomOut = () => {
  editorStore.setCanvasScale(Math.max(canvasScale.value - 0.1, 0.5))
}

const resetZoom = () => {
  editorStore.setCanvasScale(1)
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  
  if (!event.dataTransfer || !editorStore.currentPage) return
  
  const componentType = event.dataTransfer.getData('componentType') as ComponentType
  if (!componentType) return
  
  // 获取画布背景的实际位置（组件应该相对于canvas-background定位）
  const canvasBackground = document.querySelector('.canvas-background') as HTMLElement
  if (!canvasBackground) return
  
  const canvasRect = canvasBackground.getBoundingClientRect()
  
  // 计算相对于画布背景的精确位置
  // 注意：getBoundingClientRect返回的是实际渲染位置，已经包含了缩放
  // 所以我们需要将鼠标位置转换为画布坐标系中的位置
  const scale = canvasScale.value
  const offsetX = (event.clientX - canvasRect.left) / scale
  const offsetY = (event.clientY - canvasRect.top) / scale
  
  // 添加新组件到画布，放置在鼠标位置
  editorStore.addComponent(componentType, {
    left: Math.max(0, offsetX),
    top: Math.max(0, offsetY)
  })
}

let isDragging = false
let dragStartX = 0
let dragStartY = 0
let originalLeft = 0
let originalTop = 0

const startDrag = (component: ComponentData, event: MouseEvent) => {
  isDragging = true
  
  // 记录拖拽开始时的鼠标位置和组件位置
  dragStartX = event.clientX
  dragStartY = event.clientY
  originalLeft = component.style.left
  originalTop = component.style.top
  
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
  event.preventDefault()
}

const handleDrag = (event: MouseEvent) => {
  if (!isDragging || !currentComponent.value) return
  
  // 计算鼠标移动的偏移量（考虑缩放）
  const deltaX = (event.clientX - dragStartX) / canvasScale.value
  const deltaY = (event.clientY - dragStartY) / canvasScale.value
  
  // 计算新位置
  let newLeft = originalLeft + deltaX
  let newTop = originalTop + deltaY
  
  // 网格吸附功能
  if (snapToGrid.value) {
    newLeft = Math.round(newLeft / 10) * 10
    newTop = Math.round(newTop / 10) * 10
  }
  
  // 确保位置不超出画布边界
  newLeft = Math.max(0, newLeft)
  newTop = Math.max(0, newTop)
  
  // 立即更新组件位置
  editorStore.updateComponentStyle(currentComponent.value.id, {
    left: newLeft,
    top: newTop
  })
}

const stopDrag = () => {
  isDragging = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
}

let isResizing = false
let resizeDirection = ''
let resizeStartX = 0
let resizeStartY = 0
let originalWidth = 0
let originalHeight = 0
let originalLeftResize = 0
let originalTopResize = 0

const startResize = (component: ComponentData, direction: string, event: MouseEvent) => {
  isResizing = true
  resizeDirection = direction
  resizeStartX = event.clientX
  resizeStartY = event.clientY
  originalWidth = component.style.width
  originalHeight = component.style.height
  originalLeftResize = component.style.left
  originalTopResize = component.style.top
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  event.preventDefault()
  event.stopPropagation()
}

const handleResize = (event: MouseEvent) => {
  if (!isResizing || !currentComponent.value) return
  
  const deltaX = (event.clientX - resizeStartX) / canvasScale.value
  const deltaY = (event.clientY - resizeStartY) / canvasScale.value
  
  let newWidth = originalWidth
  let newHeight = originalHeight
  let newLeft = originalLeftResize
  let newTop = originalTopResize
  
  switch (resizeDirection) {
    case 'tl':
      newWidth = Math.max(20, originalWidth - deltaX)
      newHeight = Math.max(20, originalHeight - deltaY)
      newLeft = originalLeftResize + (originalWidth - newWidth)
      newTop = originalTopResize + (originalHeight - newHeight)
      break
    case 'tr':
      newWidth = Math.max(20, originalWidth + deltaX)
      newHeight = Math.max(20, originalHeight - deltaY)
      newTop = originalTopResize + (originalHeight - newHeight)
      break
    case 'bl':
      newWidth = Math.max(20, originalWidth - deltaX)
      newHeight = Math.max(20, originalHeight + deltaY)
      newLeft = originalLeftResize + (originalWidth - newWidth)
      break
    case 'br':
      newWidth = Math.max(20, originalWidth + deltaX)
      newHeight = Math.max(20, originalHeight + deltaY)
      break
    case 't':
      newHeight = Math.max(20, originalHeight - deltaY)
      newTop = originalTopResize + (originalHeight - newHeight)
      break
    case 'b':
      newHeight = Math.max(20, originalHeight + deltaY)
      break
    case 'l':
      newWidth = Math.max(20, originalWidth - deltaX)
      newLeft = originalLeftResize + (originalWidth - newWidth)
      break
    case 'r':
      newWidth = Math.max(20, originalWidth + deltaX)
      break
  }
  
  editorStore.updateComponentStyle(currentComponent.value.id, {
    width: newWidth,
    height: newHeight,
    left: newLeft,
    top: newTop
  })
}

const stopResize = () => {
  isResizing = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

onMounted(() => {
  // 确保页面在组件挂载时已经创建
  if (!currentPage.value) {
    editorStore.createNewPage()
  }
  
  // 添加拖放区域初始化检查
  const canvasContainer = document.querySelector('.canvas-container') as HTMLElement
  if (canvasContainer) {
    // 确保拖放区域已准备好
    console.log('Canvas container ready for drag and drop')
  }
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.editor-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}

.canvas-toolbar {
  padding: 10px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  gap: 20px;
  align-items: center;
}

.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow: auto;
  min-height: 400px;
  cursor: default;
  max-width: 100%;
}

.canvas-background {
  position: relative;
  background: white;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  min-width: 800px;
  min-height: 600px;
  max-width: 100%;
  max-height: 100%;
}

.component-wrapper {
  position: absolute;
  cursor: move;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.component-wrapper.selected {
  border-color: #409eff;
}

.component-content {
  width: 100%;
  height: 100%;
}

.component-resize-handles {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  pointer-events: none;
}

.component-resize-handles .handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #409eff;
  border: 1px solid white;
  border-radius: 1px;
  pointer-events: all;
  cursor: nwse-resize;
}

.handle-tl { top: -4px; left: -4px; cursor: nw-resize; }
.handle-tr { top: -4px; right: -4px; cursor: ne-resize; }
.handle-bl { bottom: -4px; left: -4px; cursor: sw-resize; }
.handle-br { bottom: -4px; right: -4px; cursor: se-resize; }
.handle-t { top: -4px; left: 50%; margin-left: -4px; cursor: n-resize; }
.handle-r { right: -4px; top: 50%; margin-top: -4px; cursor: e-resize; }
.handle-b { bottom: -4px; left: 50%; margin-left: -4px; cursor: s-resize; }
.handle-l { left: -4px; top: 50%; margin-top: -4px; cursor: w-resize; }

.guidelines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.guideline {
  position: absolute;
}

.guideline.vertical {
  width: 2px;
  top: 0;
  bottom: 0;
}

.guideline.horizontal {
  height: 2px;
  left: 0;
  right: 0;
}

.guideline.center {
  background: rgba(64, 158, 255, 0.3);
  box-shadow: 0 0 2px rgba(64, 158, 255, 0.5);
}
</style>