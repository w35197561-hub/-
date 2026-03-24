<template>
  <div 
    class="image-component"
    :style="{
      border: component.style.borderWidth ? `${component.style.borderWidth}px solid ${component.style.borderColor || '#ccc'}` : 'none',
      borderRadius: component.style.borderRadius ? `${component.style.borderRadius}px` : '0',
      overflow: 'hidden'
    }"
  >
    <img
      v-if="component.props.src"
      :src="component.props.src"
      :alt="component.props.alt as string || '图片'"
      class="image-content"
      :style="{
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }"
    />
    <div v-else class="image-placeholder">
      <el-icon><Picture /></el-icon>
      <span>请设置图片地址</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Picture } from '@element-plus/icons-vue'
import type { ComponentData } from '@/types'

defineProps<{
  component: ComponentData
}>()
</script>

<style scoped>
.image-component {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 12px;
}

.image-content {
  display: block;
}
</style>