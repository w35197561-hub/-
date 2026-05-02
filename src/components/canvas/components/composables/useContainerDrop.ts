import { ref, inject } from 'vue'
import { useEditorStore } from '@/stores/editor'
import type { ComponentData } from '@/types'
import { ComponentType } from '@/types'

/**
 * 容器组件（Form / Tabs）共用的子组件拖放 & 子组件鼠标交互逻辑
 *
 * @param containerId  容器组件的 id
 * @param getSlotKey   返回当前要操作的 slotKey 的函数（Form 传入列 key，Tabs 传入当前 activeTab）
 */
export function useContainerDrop(containerId: string, getSlotKey: () => string) {
  const editorStore = useEditorStore()
  const isPreview = inject('isPreview', false)

  // 当前正在 dragover 的 slot key（或用布尔值表示单区域容器）
  const dragOverSlot = ref<string | null>(null)

  const handleDragOver = (slotKey: string, event: DragEvent) => {
    if (isPreview) return
    dragOverSlot.value = slotKey
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleDragLeave = () => {
    dragOverSlot.value = null
  }

  const handleDrop = (slotKey: string, event: DragEvent) => {
    if (isPreview) return
    dragOverSlot.value = null
    if (!event.dataTransfer) return

    const componentType = event.dataTransfer.getData('componentType') as ComponentType
    if (!componentType) return

    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const scale = editorStore.canvasScale || 1

    const left = Math.max(0, (event.clientX - rect.left) / scale)
    const top = Math.max(0, (event.clientY - rect.top) / scale)

    editorStore.addChildComponent(containerId, componentType, { left, top }, slotKey)
  }

  /** 单区域容器（Tabs body）的简化版 dragover */
  const handleSingleDragOver = (event: DragEvent) => {
    handleDragOver(getSlotKey(), event)
  }

  /** 单区域容器（Tabs body）的简化版 drop */
  const handleSingleDrop = (event: DragEvent) => {
    handleDrop(getSlotKey(), event)
  }

  const handleChildMouseDown = (child: ComponentData, slotKey: string, event: MouseEvent) => {
    if (isPreview) return
    editorStore.selectComponent(child.id)
    editorStore.startChildDrag(child, containerId, event, slotKey)
  }

  return {
    dragOverSlot,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleSingleDragOver,
    handleSingleDrop,
    handleChildMouseDown,
  }
}
