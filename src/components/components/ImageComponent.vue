<template>
  <div class="image-component" :style="containerStyle">
    <img
      v-if="src"
      :src="src"
      :alt="(component.props.alt as string) || '图片'"
      class="image-content"
    />
    <div v-else class="image-placeholder">
      <el-icon><Picture /></el-icon>
      <span>请设置图片地址</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import type { ComponentData } from '@/types'

const props = defineProps<{
  component: ComponentData
}>()

const src = computed(() => props.component.props.src as string | undefined)

const containerStyle = computed(() => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  border: props.component.style.borderWidth
    ? `${props.component.style.borderWidth}px solid ${props.component.style.borderColor ?? '#cccccc'}`
    : 'none',
  borderRadius: props.component.style.borderRadius
    ? `${props.component.style.borderRadius}px`
    : '0',
  backgroundColor: props.component.style.backgroundColor ?? '#f5f5f5',
  boxSizing: 'border-box' as const,
}))
</script>

<style scoped>
.image-component {
  width: 100%;
  height: 100%;
}

.image-content {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 12px;
}
</style>
