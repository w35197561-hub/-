<template>
  <div class="preview-page">
    <div class="preview-toolbar">
      <el-button @click="router.back()" :icon="ArrowLeft" size="small">返回编辑器</el-button>
      <span class="preview-title">{{ currentPage?.title || '页面预览' }}</span>
    </div>

    <div v-if="currentPage" class="preview-scroll">
      <div
        class="preview-canvas"
        :style="{
          width: `${currentPage.style.width}px`,
          height: `${currentPage.style.height}px`,
          backgroundColor: currentPage.style.backgroundColor,
        }"
      >
        <div
          v-for="component in currentPage.components"
          :key="component.id"
          class="preview-component"
          :style="{
            top: `${component.style.top}px`,
            left: `${component.style.left}px`,
            width: `${component.style.width}px`,
            height: `${component.style.height}px`,
            zIndex: component.style.zIndex,
            transform: `rotate(${component.style.rotate}deg)`,
          }"
        >
          <ComponentRenderer :component="component" />
        </div>
      </div>
    </div>

    <div v-else class="preview-empty">
      <el-empty description="请先在编辑器中打开或创建页面" />
      <el-button type="primary" @click="router.push('/')">去编辑器</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useEditorStore } from '@/stores/editor'
import ComponentRenderer from '@/components/canvas/components/ComponentRenderer.vue'

const router = useRouter()
const editorStore = useEditorStore()
const currentPage = computed(() => editorStore.currentPage)

provide('isPreview', true)
</script>

<style scoped>
.preview-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.preview-toolbar {
  height: 48px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  flex-shrink: 0;
}

.preview-title {
  font-size: 14px;
  color: #666;
}

.preview-scroll {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px;
}

.preview-canvas {
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.preview-component {
  position: absolute;
}

.preview-component > * {
  width: 100%;
  height: 100%;
}

.preview-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
</style>
