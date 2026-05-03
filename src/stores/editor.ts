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

  // 多选组件 id 列表
  const selectedComponentIds = ref<string[]>([])
  /**
   * 多选操作
   */
  const selectComponent = (componentId: string, multi = false) => {
    if (multi) {
      // 多选：已选中则取消，否则加入
      const idx = selectedComponentIds.value.indexOf(componentId)
      if (idx > -1) {
        selectedComponentIds.value.splice(idx, 1)
      } else {
        selectedComponentIds.value.push(componentId)
      }
    } else {
      selectedComponentIds.value = [componentId]
    }
    // 同步 currentComponent 以兼容原有逻辑
    const comp = getComponentById(componentId)
    if (comp) currentComponent.value = comp
  }

  // 清空多选
  const clearSelectedComponents = () => {
    selectedComponentIds.value = []
    currentComponent.value = null
  }
  /**
   * 多选拖拽
   * @param event 鼠标事件
   */
  const startMultiDrag = (event: MouseEvent) => {
    if (selectedComponentIds.value.length < 2) return
    const historyStore = useHistoryStore()
    const startX = event.clientX
    const startY = event.clientY
    // 记录所有选中组件的初始位置
    const originMap = selectedComponentIds.value.map(id => {
      const comp = getComponentById(id)
      return comp ? { id, left: comp.style.left, top: comp.style.top } : null
    }).filter(Boolean) as { id: string; left: number; top: number }[]

    const moveHandler = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / canvasScale.value
      const deltaY = (moveEvent.clientY - startY) / canvasScale.value
      originMap.forEach(({ id, left, top }) => {
        const comp = getComponentById(id)
        if (comp) {
          let newLeft = left + deltaX
          let newTop = top + deltaY
          if (snapToGrid.value) {
            newLeft = Math.round(newLeft / 10) * 10
            newTop = Math.round(newTop / 10) * 10
          }
          comp.style.left = Math.max(0, newLeft)
          comp.style.top = Math.max(0, newTop)
        }
      })
    }

    const upHandler = () => {
      // 记录新旧位置，批量提交
      const hasMoved = originMap.some(({ id, left, top }) => {
        const comp = getComponentById(id)
        return comp && (comp.style.left !== left || comp.style.top !== top)
      })
      if (hasMoved) {
        const oldStyles = originMap.map(({ id, left, top }) => ({ id, left, top }))
        const newStyles = originMap.map(({ id }) => {
          const comp = getComponentById(id)
          return comp ? { id, left: comp.style.left, top: comp.style.top } : null
        }).filter(Boolean) as { id: string; left: number; top: number }[]
        const command: Command = {
          execute: () => {
            newStyles.forEach(({ id, left, top }) => {
              const comp = getComponentById(id)
              if (comp) {
                comp.style.left = left
                comp.style.top = top
              }
            })
          },
          undo: () => {
            oldStyles.forEach(({ id, left, top }) => {
              const comp = getComponentById(id)
              if (comp) {
                comp.style.left = left
                comp.style.top = top
              }
            })
          }
        }
        historyStore.executeCommand(command)
      }
      document.removeEventListener('mousemove', moveHandler)
      document.removeEventListener('mouseup', upHandler)
    }
    document.addEventListener('mousemove', moveHandler)
    document.addEventListener('mouseup', upHandler)
    event.preventDefault()
    event.stopPropagation()
  }

  const createComponentId = () => {
    return `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

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

  // 获取当前页面最大 zIndex
  const getMaxZIndex = (): number => {
    if (!currentPage.value?.components.length) return 0
    return Math.max(...currentPage.value.components.map(c => c.style.zIndex || 1))
  }

  // 归一化所有组件的 zIndex（使其连续从 1 开始）
  const normalizeZIndex = () => {
    if (!currentPage.value) return
    const historyStore = useHistoryStore()
    const components = currentPage.value.components
    if (components.length === 0) return

    // 按当前 zIndex 排序
    const sorted = [...components].sort((a, b) => (a.style.zIndex || 1) - (b.style.zIndex || 1))
    const oldZIndices = components.map(c => ({ id: c.id, zIndex: c.style.zIndex }))
    const newZIndices = sorted.map((c, i) => ({ id: c.id, zIndex: i + 1 }))

    const command: Command = {
      execute: () => {
        newZIndices.forEach(({ id, zIndex }) => {
          const comp = getComponentById(id)
          if (comp) comp.style.zIndex = zIndex
        })
      },
      undo: () => {
        oldZIndices.forEach(({ id, zIndex }) => {
          const comp = getComponentById(id)
          if (comp) comp.style.zIndex = zIndex
        })
      }
    }
    historyStore.executeCommand(command)
  }

  const addComponent = (type: ComponentType, initialProps: Record<string, unknown> = {}) => {
    if (!currentPage.value) return

    const historyStore = useHistoryStore()

    const defaultStyle = {
      top: 100,
      left: 100,
      width: 200,
      height: 50,
      zIndex: getMaxZIndex() + 1,
      rotate: 0
    }

    const typeStyleMap: Partial<Record<ComponentType, { width: number; height: number }>> = {
      [ComponentType.FORM]: { width: 520, height: 260 },
      [ComponentType.TABS]: { width: 560, height: 320 }
    }

    // 从initialProps中提取style相关的属性
    const { left, top, width, height, zIndex, rotate, ...otherProps } = initialProps as Record<string, unknown>
    
    // 合并style，优先使用传入的位置参数
    const finalStyle = {
      ...defaultStyle,
      ...(typeStyleMap[type] || {}),
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
      [ComponentType.FORM]: { title: '表单容器', columns: ['col1', 'col2'] },
      [ComponentType.CHART]: { type: 'bar' },
      [ComponentType.TABS]: {
        tabs: [
          { key: 'tab1', label: 'Tab 1' },
          { key: 'tab2', label: 'Tab 2' }
        ],
        activeTab: 'tab1'
      }
    }

    const component: ComponentData = {
      id: createComponentId(),
      type,
      style: finalStyle,
      props: { ...defaultProps[type], ...otherProps },
      isContainer: type === ComponentType.FORM || type === ComponentType.TABS,
      children: type === ComponentType.FORM ? [] : undefined,
      slots: type === ComponentType.FORM
        ? { col1: [], col2: [] }
        : type === ComponentType.TABS
          ? { tab1: [], tab2: [] }
          : undefined
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

  // 组件快速查找 Map（O(1) 查找优化，支持嵌套）
  const componentMap = computed(() => {
    const map = new Map<string, ComponentData>()

    const traverse = (list: ComponentData[]) => {
      list.forEach(c => {
        map.set(c.id, c)
        if (c.children?.length) {
          traverse(c.children)
        }
        if (c.slots) {
          Object.values(c.slots).forEach(slotChildren => {
            if (slotChildren.length) {
              traverse(slotChildren)
            }
          })
        }
      })
    }

    if (currentPage.value?.components) {
      traverse(currentPage.value.components)
    }

    return map
  })

  const getComponentById = (id: string): ComponentData | undefined => {
    return componentMap.value.get(id)
  }

  const findParentContainer = (
    componentId: string
  ): { parent: ComponentData | null; slotKey: string | null; index: number } => {
    if (!currentPage.value) {
      return { parent: null, slotKey: null, index: -1 }
    }

    const traverse = (list: ComponentData[]): { parent: ComponentData | null; slotKey: string | null; index: number } => {
      const directIndex = list.findIndex(item => item.id === componentId)
      if (directIndex !== -1) {
        return { parent: null, slotKey: null, index: directIndex }
      }

      for (const node of list) {
        if (node.children?.length) {
          const childIndex = node.children.findIndex(item => item.id === componentId)
          if (childIndex !== -1) {
            return { parent: node, slotKey: 'children', index: childIndex }
          }

          const deepResult = traverse(node.children)
          if (deepResult.index !== -1) {
            return deepResult
          }
        }

        if (node.slots) {
          for (const [key, slotChildren] of Object.entries(node.slots)) {
            const slotIndex = slotChildren.findIndex(item => item.id === componentId)
            if (slotIndex !== -1) {
              return { parent: node, slotKey: key, index: slotIndex }
            }

            const deepResult = traverse(slotChildren)
            if (deepResult.index !== -1) {
              return deepResult
            }
          }
        }
      }

      return { parent: null, slotKey: null, index: -1 }
    }

    return traverse(currentPage.value.components)
  }

  // 已由新版 selectComponent 统一实现多选/单选

  const addChildComponent = (
    containerId: string,
    type: ComponentType,
    initialProps: Record<string, unknown> = {},
    slotKey: string = 'children'
  ) => {
    const container = getComponentById(containerId)
    if (!container) return

    const historyStore = useHistoryStore()
    const defaultStyle = {
      top: 12,
      left: 12,
      width: 180,
      height: 40,
      zIndex: 1,
      rotate: 0
    }

    const { left, top, width, height, zIndex, rotate, ...otherProps } = initialProps as Record<string, unknown>

    const childDefaultProps: Record<ComponentType, Record<string, unknown>> = {
      [ComponentType.TEXT]: { content: '文本内容' },
      [ComponentType.IMAGE]: { src: '' },
      [ComponentType.BUTTON]: { content: '按钮' },
      [ComponentType.INPUT]: { placeholder: '请输入内容' },
      [ComponentType.FORM]: { title: '表单容器', columns: ['col1', 'col2'] },
      [ComponentType.CHART]: { type: 'bar' },
      [ComponentType.TABS]: {
        tabs: [
          { key: 'tab1', label: 'Tab 1' },
          { key: 'tab2', label: 'Tab 2' }
        ],
        activeTab: 'tab1'
      }
    }

    const child: ComponentData = {
      id: createComponentId(),
      type,
      style: {
        ...defaultStyle,
        ...(left !== undefined && { left: left as number }),
        ...(top !== undefined && { top: top as number }),
        ...(width !== undefined && { width: width as number }),
        ...(height !== undefined && { height: height as number }),
        ...(zIndex !== undefined && { zIndex: zIndex as number }),
        ...(rotate !== undefined && { rotate: rotate as number })
      },
      props: { ...childDefaultProps[type], ...otherProps },
      isContainer: type === ComponentType.FORM || type === ComponentType.TABS,
      children: type === ComponentType.FORM ? [] : undefined,
      slots: type === ComponentType.FORM
        ? { col1: [], col2: [] }
        : type === ComponentType.TABS
          ? { tab1: [], tab2: [] }
          : undefined
    }

    const command: Command = {
      execute: () => {
        if (slotKey === 'children') {
          if (!container.children) {
            container.children = []
          }
          container.children.push(child)
        } else {
          if (!container.slots) {
            container.slots = {}
          }
          if (!container.slots[slotKey]) {
            container.slots[slotKey] = []
          }
          container.slots[slotKey]?.push(child)
        }
        currentComponent.value = child
      },
      undo: () => {
        const removeFrom = slotKey === 'children'
          ? container.children
          : container.slots?.[slotKey]

        if (!removeFrom) return
        const index = removeFrom.findIndex(item => item.id === child.id)
        if (index !== -1) {
          removeFrom.splice(index, 1)
        }
        if (currentComponent.value?.id === child.id) {
          currentComponent.value = null
        }
      }
    }

    historyStore.executeCommand(command)
  }

  const startChildDrag = (
    child: ComponentData,
    parentId: string,
    event: MouseEvent,
    slotKey: string = 'children'
  ) => {
    const historyStore = useHistoryStore()
    const startX = event.clientX
    const startY = event.clientY
    const originLeft = child.style.left
    const originTop = child.style.top
    const oldStyle = { ...child.style }

    const moveHandler = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / canvasScale.value
      const deltaY = (moveEvent.clientY - startY) / canvasScale.value

      let newLeft = originLeft + deltaX
      let newTop = originTop + deltaY

      if (snapToGrid.value) {
        newLeft = Math.round(newLeft / 10) * 10
        newTop = Math.round(newTop / 10) * 10
      }

      child.style.left = Math.max(0, newLeft)
      child.style.top = Math.max(0, newTop)
    }

    const upHandler = () => {
      const hasMoved = child.style.left !== oldStyle.left || child.style.top !== oldStyle.top
      if (hasMoved) {
        const newStyle = { ...child.style }
        const command: Command = {
          execute: () => {
            Object.assign(child.style, newStyle)
          },
          undo: () => {
            Object.assign(child.style, oldStyle)
          }
        }
        historyStore.executeCommand(command)
      }

      document.removeEventListener('mousemove', moveHandler)
      document.removeEventListener('mouseup', upHandler)
    }

    document.addEventListener('mousemove', moveHandler)
    document.addEventListener('mouseup', upHandler)
    event.preventDefault()
    event.stopPropagation()

    // 保留参数，方便后续扩展（如跨slot拖动）
    void parentId
    void slotKey
  }

  // 静默更新样式（不记录历史，用于拖拽过程中的实时更新）
  const updateComponentStyleSilent = (componentId: string, styleUpdates: Partial<ComponentData['style']>) => {
    const component = getComponentById(componentId)
    if (component) {
      Object.assign(component.style, styleUpdates)
    }
  }

  // 批量更新样式（记录一次历史，用于拖拽结束时）
  const batchUpdateComponentStyle = (
    componentId: string, 
    oldStyle: ComponentData['style'], 
    newStyle: Partial<ComponentData['style']>
  ) => {
    const component = getComponentById(componentId)
    if (!component) return

    const historyStore = useHistoryStore()
    const finalOldStyle = { ...oldStyle }
    const finalNewStyle = { ...component.style, ...newStyle }

    const command: Command = {
      execute: () => {
        Object.assign(component.style, finalNewStyle)
      },
      undo: () => {
        Object.assign(component.style, finalOldStyle)
      }
    }

    historyStore.executeCommand(command)
  }

  const updateComponentStyle = (componentId: string, styleUpdates: Partial<ComponentData['style']>) => {
    if (!currentPage.value) return

    const component = getComponentById(componentId)
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

    const component = getComponentById(componentId)
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
    const parentInfo = findParentContainer(componentId)
    if (parentInfo.index === -1) return

    const targetList = parentInfo.parent
      ? parentInfo.slotKey === 'children'
        ? parentInfo.parent.children
        : parentInfo.parent.slots?.[parentInfo.slotKey || '']
      : currentPage.value.components

    if (!targetList) return

    const component = targetList[parentInfo.index]
    if (!component) return
    
    const wasSelected = currentComponent.value?.id === componentId

    // 创建命令对象
    const command: Command = {
      execute: () => {
        targetList.splice(parentInfo.index, 1)
        if (wasSelected) {
          currentComponent.value = null
        }
      },
      undo: () => {
        targetList.splice(parentInfo.index, 0, component)
        if (wasSelected) {
          currentComponent.value = component
        }
      }
    }

    historyStore.executeCommand(command)
  }

  const moveComponentLayer = (componentId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (!currentPage.value) return

    const historyStore = useHistoryStore()
    const components = currentPage.value.components
    const comp = getComponentById(componentId)
    if (!comp) return

    const currentZIndex = comp.style.zIndex
    const allZIndices = components.map(c => c.style.zIndex).sort((a, b) => a - b)
    const uniqueZIndices = [...new Set(allZIndices)]

    let targetZIndex = currentZIndex

    if (direction === 'up') {
      // 找到比当前大的最小 zIndex
      const higherZ = uniqueZIndices.find(z => z > currentZIndex)
      if (higherZ !== undefined) {
        // 与该层的组件交换 zIndex
        const higherComp = components.find(c => c.style.zIndex === higherZ)
        if (higherComp) {
          const oldZ = currentZIndex
          const newZ = higherZ
          const command: Command = {
            execute: () => {
              comp.style.zIndex = newZ
              higherComp.style.zIndex = oldZ
            },
            undo: () => {
              comp.style.zIndex = oldZ
              higherComp.style.zIndex = newZ
            }
          }
          historyStore.executeCommand(command)
          return
        }
      }
    } else if (direction === 'down') {
      // 找到比当前小的最大 zIndex
      const lowerZs = uniqueZIndices.filter(z => z < currentZIndex)
      const lowerZ = lowerZs[lowerZs.length - 1]
      if (lowerZ !== undefined) {
        const lowerComp = components.find(c => c.style.zIndex === lowerZ)
        if (lowerComp) {
          const oldZ = currentZIndex
          const newZ = lowerZ
          const command: Command = {
            execute: () => {
              comp.style.zIndex = newZ
              lowerComp.style.zIndex = oldZ
            },
            undo: () => {
              comp.style.zIndex = oldZ
              lowerComp.style.zIndex = newZ
            }
          }
          historyStore.executeCommand(command)
          return
        }
      }
    } else if (direction === 'top') {
      targetZIndex = getMaxZIndex() + 1
    } else if (direction === 'bottom') {
      // 将所有组件 zIndex +1，然后将目标设为 1
      const oldZIndices = components.map(c => ({ id: c.id, zIndex: c.style.zIndex }))
      const command: Command = {
        execute: () => {
          components.forEach(c => { if (c.id !== componentId) c.style.zIndex += 1 })
          comp.style.zIndex = 1
        },
        undo: () => {
          oldZIndices.forEach(({ id, zIndex }) => {
            const c = getComponentById(id)
            if (c) c.style.zIndex = zIndex
          })
        }
      }
      historyStore.executeCommand(command)
      return
    }

    if (targetZIndex !== currentZIndex) {
      const oldZ = currentZIndex
      const newZ = targetZIndex
      const command: Command = {
        execute: () => { comp.style.zIndex = newZ },
        undo: () => { comp.style.zIndex = oldZ }
      }
      historyStore.executeCommand(command)
    }
  }

  // 直接设置组件的 zIndex
  const setComponentZIndex = (componentId: string, zIndex: number) => {
    if (!currentPage.value) return
    const historyStore = useHistoryStore()
    const comp = getComponentById(componentId)
    if (!comp) return

    const oldZ = comp.style.zIndex
    const newZ = Math.max(1, zIndex)
    if (oldZ === newZ) return

    const command: Command = {
      execute: () => { comp.style.zIndex = newZ },
      undo: () => { comp.style.zIndex = oldZ }
    }
    historyStore.executeCommand(command)
  }

  const exportPageData = () => {
    return currentPage.value ? JSON.stringify(currentPage.value, null, 2) : null
  }

  /** 从外部数据（如后端返回）加载页面，替换当前画布 */
  const loadPageData = (page: PageData) => {
    currentPage.value = page
    currentComponent.value = null
    selectedComponentIds.value = []
    const historyStore = useHistoryStore()
    historyStore.clearHistory()
  }

  return {
    currentPage: computed(() => currentPage.value),
    currentComponent: computed(() => currentComponent.value),
    canvasScale: computed(() => canvasScale.value),
    snapToGrid: computed(() => snapToGrid.value),
    showGuidelines: computed(() => showGuidelines.value),
    selectedComponentIds: computed(() => selectedComponentIds.value),
    selectComponent,
    clearSelectedComponents,
    startMultiDrag,
    createNewPage,
    addComponent,
    addChildComponent,
    getComponentById,
    startChildDrag,
    updateComponentStyle,
    updateComponentStyleSilent,
    batchUpdateComponentStyle,
    updateComponentProps,
    deleteComponent,
    moveComponentLayer,
    setComponentZIndex,
    normalizeZIndex,
    getMaxZIndex,
    exportPageData,
    loadPageData,
    setCanvasScale: (scale: number) => canvasScale.value = scale,
    setSnapToGrid: (enabled: boolean) => snapToGrid.value = enabled,
    setShowGuidelines: (enabled: boolean) => showGuidelines.value = enabled
  }
})