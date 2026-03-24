import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PageData, ComponentData, Command } from '@/types'
import { ComponentType } from '@/types'
import { useHistoryStore } from './history'

export const useEditorStore = defineStore('editor', () => {
  const currentPage = ref<PageData | null>(null)
  const currentComponent = ref<ComponentData | null>(null)
  const canvasScale = ref(1)
  const snapToGrid = ref(true)
  const showGuidelines = ref(true)

  const createNewPage = (title: string = '新页面') => {
    currentPage.value = {
      id: `page_${Date.now()}`,
      title,
      components: [],
      style: {
        width: 1200,
        height: 800,
        backgroundColor: '#ffffff'
      }
    }
  }

  const addComponent = (type: ComponentType, initialProps: Record<string, unknown> = {}) => {
    if (!currentPage.value) return

    const historyStore = useHistoryStore()

    const defaultStyle = {
      top: 100,
      left: 100,
      width: 200,
      height: 50,
      zIndex: 1,
      rotate: 0
    }

    // 从initialProps中提取style相关的属性
    const { left, top, width, height, zIndex, rotate, ...otherProps } = initialProps as Record<string, unknown>
    
    // 合并style，优先使用传入的位置参数
    const finalStyle = {
      ...defaultStyle,
      ...(left !== undefined && { left: left as number }),
      ...(top !== undefined && { top: top as number }),
      ...(width !== undefined && { width: width as number }),
      ...(height !== undefined && { height: height as number }),
      ...(zIndex !== undefined && { zIndex: zIndex as number }),
      ...(rotate !== undefined && { rotate: rotate as number })
    }

    const defaultProps: Record<ComponentType, Record<string, unknown>> = {
      [ComponentType.TEXT]: { content: '文本内容' },
      [ComponentType.IMAGE]: { src: '' },
      [ComponentType.BUTTON]: { content: '按钮' },
      [ComponentType.INPUT]: { placeholder: '请输入内容' },
      [ComponentType.FORM]: { fields: [] },
      [ComponentType.CHART]: { type: 'bar' }
    }

    const component: ComponentData = {
      id: `comp_${Date.now()}`,
      type,
      style: finalStyle,
      props: { ...defaultProps[type], ...otherProps }
    }

    // 创建命令对象
    const command: Command = {
      execute: () => {
        currentPage.value?.components.push(component)
        currentComponent.value = component
      },
      undo: () => {
        if (!currentPage.value) return
        const index = currentPage.value.components.findIndex(comp => comp.id === component.id)
        if (index !== -1) {
          currentPage.value.components.splice(index, 1)
        }
        if (currentComponent.value?.id === component.id) {
          currentComponent.value = null
        }
      }
    }

    historyStore.executeCommand(command)
  }

  const selectComponent = (component: ComponentData | null) => {
    currentComponent.value = component
  }

  const updateComponentStyle = (componentId: string, styleUpdates: Partial<ComponentData['style']>) => {
    if (!currentPage.value) return

    const component = currentPage.value.components.find(comp => comp.id === componentId)
    if (!component) return

    const historyStore = useHistoryStore()
    const oldStyle = { ...component.style }

    // 创建命令对象
    const command: Command = {
      execute: () => {
        Object.assign(component.style, styleUpdates)
      },
      undo: () => {
        Object.assign(component.style, oldStyle)
      }
    }

    historyStore.executeCommand(command)
  }

  const updateComponentProps = (componentId: string, propUpdates: Partial<ComponentData['props']>) => {
    if (!currentPage.value) return

    const component = currentPage.value.components.find(comp => comp.id === componentId)
    if (!component) return

    const historyStore = useHistoryStore()
    const oldProps = { ...component.props }

    // 创建命令对象
    const command: Command = {
      execute: () => {
        Object.assign(component.props, propUpdates)
      },
      undo: () => {
        Object.assign(component.props, oldProps)
      }
    }

    historyStore.executeCommand(command)
  }

  const deleteComponent = (componentId: string) => {
    if (!currentPage.value) return

    const historyStore = useHistoryStore()
    const index = currentPage.value.components.findIndex(comp => comp.id === componentId)
    if (index === -1) return

    const component = currentPage.value.components[index]
    if (!component) return
    
    const wasSelected = currentComponent.value?.id === componentId

    // 创建命令对象
    const command: Command = {
      execute: () => {
        currentPage.value?.components.splice(index, 1)
        if (wasSelected) {
          currentComponent.value = null
        }
      },
      undo: () => {
        currentPage.value?.components.splice(index, 0, component)
        if (wasSelected) {
          currentComponent.value = component
        }
      }
    }

    historyStore.executeCommand(command)
  }

  const moveComponentLayer = (componentId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (!currentPage.value) return

    const components = currentPage.value.components
    const index = components.findIndex(comp => comp.id === componentId)
    if (index === -1) return

    if (direction === 'up' && index < components.length - 1) {
      const temp = components[index]
      if (temp) {
        components.splice(index, 1)
        components.splice(index + 1, 0, temp)
      }
    } else if (direction === 'down' && index > 0) {
      const temp = components[index]
      if (temp) {
        components.splice(index, 1)
        components.splice(index - 1, 0, temp)
      }
    } else if (direction === 'top') {
      const component = components.splice(index, 1)[0]
      if (component) {
        components.push(component)
      }
    } else if (direction === 'bottom') {
      const comp = components.splice(index, 1)[0]
      if (comp) {
        components.unshift(comp)
      }
    }
  }

  const exportPageData = () => {
    return currentPage.value ? JSON.stringify(currentPage.value, null, 2) : null
  }

  return {
    currentPage: computed(() => currentPage.value),
    currentComponent: computed(() => currentComponent.value),
    canvasScale: computed(() => canvasScale.value),
    snapToGrid: computed(() => snapToGrid.value),
    showGuidelines: computed(() => showGuidelines.value),
    
    createNewPage,
    addComponent,
    selectComponent,
    updateComponentStyle,
    updateComponentProps,
    deleteComponent,
    moveComponentLayer,
    exportPageData,
    
    setCanvasScale: (scale: number) => canvasScale.value = scale,
    setSnapToGrid: (enabled: boolean) => snapToGrid.value = enabled,
    setShowGuidelines: (enabled: boolean) => showGuidelines.value = enabled
  }
})