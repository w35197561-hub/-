<template>
  <div class="form-component">
    <div class="form-header">{{ (component.props.title as string) ?? '' }}</div>
    <div class="form-columns">
      <div v-for="col in columns" :key="col.key" class="form-column">
        <div class="column-title">{{ col.label }}</div>
        <div
          class="column-body"
          :class="{ 'is-drag-over': dragOverSlot === col.key }"
          @dragover.prevent="handleDragOver(col.key, $event)"
          @dragleave="handleDragLeave"
          @drop.stop.prevent="handleDrop(col.key, $event)"
        >
          <div
            v-for="child in getSlotChildren(col.key)"
            :key="child.id"
            class="child-wrapper"
            :class="{ selected: currentComponentId === child.id }"
            :style="childWrapperStyle(child)"
            @mousedown.stop="handleChildMouseDown(child, col.key, $event)"
          >
            <ComponentRenderer :component="child" />
          </div>
          <div v-if="dragOverSlot === col.key" class="drop-tip">放到该列</div>
        </div>
      </div>
    </div>
    <!-- 运行态：提交按钮 -->
    <div v-if="isPreview" class="form-footer">
      <button class="form-submit-btn" @click="handleSubmit">提交</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useEditorStore } from '@/stores/editor'
import type { ComponentData } from '@/types'
import ComponentRenderer from './ComponentRenderer.vue'
import { useContainerDrop } from './composables/useContainerDrop'
import { useActionExecutor } from '../composables/useActionExecutor'

const props = defineProps<{
  component: ComponentData
}>()

const editorStore = useEditorStore()
const isPreview = inject('isPreview', false)
const { execute } = useActionExecutor()
const currentComponentId = computed(() => editorStore.currentComponent?.id)

const handleSubmit = () => {
  const ev = props.component.events?.find((e) => e.type === 'submit')
  if (ev) execute(ev.actions)
}

// 列配置
const columns = computed(() => {
  const configured = props.component.props.columns as string[] | undefined
  const keys = configured?.length ? configured : ['col1', 'col2']
  return keys.map((key, index) => ({ key, label: `列 ${index + 1}` }))
})

const getSlotChildren = (slotKey: string) => props.component.slots?.[slotKey] ?? []

// 子组件外层 wrapper 样式（独立函数，避免模板中的内联对象导致重渲染）
const childWrapperStyle = (child: ComponentData) => ({
  top: `${child.style.top}px`,
  left: `${child.style.left}px`,
  width: `${child.style.width}px`,
  height: `${child.style.height}px`,
  zIndex: child.style.zIndex,
  transform: `rotate(${child.style.rotate}deg)`,
})

// 拖放逻辑：Form 是多 slot 容器，getSlotKey 不需要（每列独立传 slotKey）
const { dragOverSlot, handleDragOver, handleDragLeave, handleDrop, handleChildMouseDown } =
  useContainerDrop(props.component.id, () => columns.value[0]?.key ?? 'col1')
</script>

<style scoped>
.form-component {
  width: 100%;
  height: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.form-header {
  height: 36px;
  line-height: 36px;
  padding: 0 12px;
  font-size: 13px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  background: #f5f7fa;
  flex-shrink: 0;
}

.form-columns {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 8px;
  overflow: hidden;
}

.form-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.column-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
  flex-shrink: 0;
}

.column-body {
  flex: 1;
  position: relative;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  background: #fafafa;
  min-height: 80px;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.column-body.is-drag-over {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.06);
}

.child-wrapper {
  position: absolute;
  border: 1px solid transparent;
}

.child-wrapper.selected {
  border-color: #409eff;
}

.drop-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #409eff;
  font-size: 12px;
  pointer-events: none;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px;
  border-top: 1px solid #ebeef5;
  background: #fafafa;
  flex-shrink: 0;
}

.form-submit-btn {
  height: 32px;
  padding: 0 20px;
  font-size: 13px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
}

.form-submit-btn:hover {
  background: #337ecc;
}
</style>
