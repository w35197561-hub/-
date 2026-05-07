<template>
  <div class="tabs-component">
    <div class="tabs-header">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: localActiveTab === tab.key }"
        @click.stop="setActiveTab(tab.key)"
      >
        {{ tab.label }}
      </div>
    </div>

    <div
      class="tabs-body"
      :class="{ 'is-drag-over': dragOverSlot === localActiveTab }"
      @dragover.prevent="handleSingleDragOver"
      @dragleave="handleDragLeave"
      @drop.stop.prevent="handleSingleDrop"
    >
      <div
        v-for="child in activeChildren"
        :key="child.id"
        class="child-wrapper"
        :class="{ selected: currentComponentId === child.id }"
        :style="childWrapperStyle(child)"
        @mousedown.stop="handleChildMouseDown(child, localActiveTab, $event)"
      >
        <ComponentRenderer :component="child" />
      </div>
      <div v-if="dragOverSlot === localActiveTab" class="drop-tip">放到当前 Tab</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
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

// Tab 配置
const tabs = computed(() => {
  const configured = props.component.props.tabs as Array<{ key: string; label: string }> | undefined
  return configured?.length
    ? configured
    : [
        { key: 'tab1', label: 'Tab 1' },
        { key: 'tab2', label: 'Tab 2' },
      ]
})

// 使用本地状态代替直接修改 props，避免违反单向数据流
const localActiveTab = ref(
  (props.component.props.activeTab as string | undefined) ?? tabs.value[0]?.key ?? 'tab1',
)

// 当外部 props.activeTab 变化时（如 PropertyPanel 修改），同步本地状态
watch(
  () => props.component.props.activeTab as string | undefined,
  (val) => {
    if (val && val !== localActiveTab.value) {
      localActiveTab.value = val
    }
  },
)

const setActiveTab = (key: string) => {
  localActiveTab.value = key
  // 通过 store 更新，记录到历史
  editorStore.updateComponentProps(props.component.id, { activeTab: key })
  if (isPreview) {
    const ev = props.component.events?.find((e) => e.type === 'tabChange')
    if (ev) execute(ev.actions)
  }
}

const activeChildren = computed(() => props.component.slots?.[localActiveTab.value] ?? [])

// 子组件 wrapper 样式
const childWrapperStyle = (child: ComponentData) => ({
  top: `${child.style.top}px`,
  left: `${child.style.left}px`,
  width: `${child.style.width}px`,
  height: `${child.style.height}px`,
  zIndex: child.style.zIndex,
  transform: `rotate(${child.style.rotate}deg)`,
})

// 拖放：Tabs 是单体 drop 区域，getSlotKey 返回当前激活 tab
const {
  dragOverSlot,
  handleDragLeave,
  handleSingleDragOver,
  handleSingleDrop,
  handleChildMouseDown,
} = useContainerDrop(props.component.id, () => localActiveTab.value)
</script>

<style scoped>
.tabs-component {
  width: 100%;
  height: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.tabs-header {
  height: 40px;
  border-bottom: 1px solid #ebeef5;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 8px;
  flex-shrink: 0;
}

.tab-item {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;
  user-select: none;
}

.tab-item.active {
  color: #409eff;
  background: rgba(64, 158, 255, 0.12);
}

.tabs-body {
  flex: 1;
  position: relative;
  min-height: 80px;
  transition:
    background 0.15s,
    outline 0.15s;
}

.tabs-body.is-drag-over {
  background: rgba(64, 158, 255, 0.06);
  outline: 1px dashed #409eff;
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
</style>
