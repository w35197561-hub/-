<template>
  <div class="page-editor-container">
    <div class="editor-header">
      <div class="header-left">
        <h1>可视化页面编辑器</h1>
        <span class="page-title">{{ currentPage?.title || '未命名页面' }}</span>
      </div>
      
      <div class="header-center">
        <el-button-group>
          <el-button @click="handleUndo" :disabled="!canUndo">
            <el-icon><RefreshLeft /></el-icon>
            撤销
          </el-button>
          <el-button @click="handleRedo" :disabled="!canRedo">
            <el-icon><RefreshRight /></el-icon>
            重做
          </el-button>
        </el-button-group>
        
        <el-button @click="handlePreview" type="primary">
          <el-icon><View /></el-icon>
          预览
        </el-button>
        
        <el-button @click="handleExport" type="success">
          <el-icon><Download /></el-icon>
          导出JSON
        </el-button>
      </div>
      
      <div class="header-right">
        <el-button @click="handleSave">
          <el-icon><Document /></el-icon>
          保存
        </el-button>
        <el-button @click="handleNewPage">
          <el-icon><Plus /></el-icon>
          新建页面
        </el-button>
      </div>
    </div>
    
    <div class="editor-body">
      <ComponentPanel />
      <EditorCanvas />
      <PropertyPanel />
    </div>
    
    <el-dialog
      v-model="previewVisible"
      title="页面预览"
      width="80%"
      top="5vh"
    >
      <div class="preview-container">
        <div 
          class="preview-content"
          :style="{
            width: `${currentPage?.style.width || 1200}px`,
            height: `${currentPage?.style.height || 800}px`,
            backgroundColor: currentPage?.style.backgroundColor || '#ffffff',
            margin: '0 auto'
          }"
        >
          <div
            v-for="component in currentPage?.components"
            :key="component.id"
            class="preview-component"
            :style="{
              top: `${component.style.top}px`,
              left: `${component.style.left}px`,
              width: `${component.style.width}px`,
              height: `${component.style.height}px`,
              zIndex: component.style.zIndex,
              transform: `rotate(${component.style.rotate}deg)`
            }"
          >
            <component
              :is="getComponentByType(component.type)"
              :component="component"
            />
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// eslint-disable-next-line vue/multi-word-component-names
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'
import ComponentPanel from './ComponentPanel.vue'
import EditorCanvas from './EditorCanvas.vue'
import PropertyPanel from './PropertyPanel.vue'
import TextComponent from './components/TextComponent.vue'
import ImageComponent from './components/ImageComponent.vue'
import ButtonComponent from './components/ButtonComponent.vue'
import InputComponent from './components/InputComponent.vue'
import {
  RefreshLeft,
  RefreshRight,
  View,
  Download,
  Document,
  Plus
} from '@element-plus/icons-vue'

const editorStore = useEditorStore()
const historyStore = useHistoryStore()

const previewVisible = ref(false)

const currentPage = computed(() => editorStore.currentPage)
const canUndo = computed(() => historyStore.canUndo())
const canRedo = computed(() => historyStore.canRedo())

const componentMap = {
  Text: TextComponent,
  Image: ImageComponent,
  Button: ButtonComponent,
  Input: InputComponent
}

const getComponentByType = (type: string) => {
  return componentMap[type as keyof typeof componentMap] || TextComponent
}

const handleUndo = () => {
  historyStore.undo()
}

const handleRedo = () => {
  historyStore.redo()
}

const handlePreview = () => {
  previewVisible.value = true
}

const handleExport = () => {
  const pageData = editorStore.exportPageData()
  if (pageData) {
    const blob = new Blob([pageData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentPage.value?.title || 'page'}.json`
    a.click()
    URL.revokeObjectURL(url)
  } else {
    ElMessage.warning('没有页面数据可导出')
  }
}

const handleSave = () => {
  ElMessage.success('页面已保存')
}

const handleNewPage = () => {
  editorStore.createNewPage()
}
</script>

<style scoped>
.page-editor-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}

.editor-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.page-title {
  color: #666;
  font-size: 14px;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.preview-container {
  max-height: 70vh;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding: 20px;
}

.preview-content {
  position: relative;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-component {
  position: absolute;
  pointer-events: none;
}

.preview-component > * {
  width: 100%;
  height: 100%;
}
</style>