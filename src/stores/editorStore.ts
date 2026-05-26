import { create } from 'zustand'
import { produce } from 'immer'
import type { PageData, ComponentData, ComponentEvent, Command } from '@/types'
import { ComponentType } from '@/types'
import { useHistoryStore } from './historyStore'
import { componentConfigs } from '@/components/material/componentConfigs'

interface EditorState {
  currentPage: PageData | null
  currentComponent: ComponentData | null
  canvasScale: number
  snapToGrid: boolean
  showGuidelines: boolean
  selectedComponentIds: string[]
  previewHiddenIds: string[]
  previewValues: Record<string, unknown>
  validationErrors: Record<string, string>
}

interface EditorActions {
  // Page
  createNewPage: (title?: string) => void
  loadPageData: (page: PageData) => void
  exportPageData: () => string | null

  // Component selection
  selectComponent: (componentId: string, multi?: boolean) => void
  clearSelectedComponents: () => void

  // Component CRUD
  addComponent: (type: ComponentType, initialProps?: Record<string, unknown>) => void
  addChildComponent: (
    containerId: string,
    type: ComponentType,
    initialProps?: Record<string, unknown>,
    slotKey?: string,
  ) => void
  deleteComponent: (componentId: string) => void
  batchAddComponents: (
    components: Array<{
      type: ComponentType
      style?: Partial<ComponentData['style']>
      props?: Record<string, unknown>
    }>,
    clearFirst: boolean,
  ) => void

  // Component queries
  getComponentById: (id: string) => ComponentData | undefined
  findParentContainer: (componentId: string) => {
    parent: ComponentData | null
    slotKey: string | null
    index: number
  }
  getMaxZIndex: () => number

  // Style/Props updates
  updateComponentStyle: (componentId: string, styleUpdates: Partial<ComponentData['style']>) => void
  updateComponentStyleSilent: (
    componentId: string,
    styleUpdates: Partial<ComponentData['style']>,
  ) => void
  batchUpdateComponentStyle: (
    componentId: string,
    oldStyle: ComponentData['style'],
    newStyle: Partial<ComponentData['style']>,
  ) => void
  updateComponentProps: (componentId: string, propUpdates: Partial<ComponentData['props']>) => void
  updateComponentEvents: (componentId: string, events: ComponentEvent[]) => void

  // Reorder (flow layout)
  reorderComponent: (componentId: string, targetIndex: number) => void

  // Layer management
  moveComponentLayer: (componentId: string, direction: 'up' | 'down' | 'top' | 'bottom') => void
  setComponentZIndex: (componentId: string, zIndex: number) => void
  normalizeZIndex: () => void

  // Preview state
  setPreviewHidden: (componentId: string, hidden: boolean) => void
  setPreviewValue: (componentId: string, value: unknown) => void
  setValidationError: (componentId: string, message: string) => void
  clearValidationErrors: () => void
  clearPreviewState: () => void

  // Settings
  setCanvasScale: (scale: number) => void
  setSnapToGrid: (enabled: boolean) => void
  setShowGuidelines: (enabled: boolean) => void
}

const createComponentId = () => `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

// Helper: traverse component tree to build a lookup map
function buildComponentMap(components: ComponentData[]): Map<string, ComponentData> {
  const map = new Map<string, ComponentData>()
  const traverse = (list: ComponentData[]) => {
    list.forEach((c) => {
      map.set(c.id, c)
      if (c.children?.length) traverse(c.children)
      if (c.slots) {
        Object.values(c.slots).forEach((slotChildren) => {
          if (slotChildren.length) traverse(slotChildren)
        })
      }
    })
  }
  traverse(components)
  return map
}

function findComponentById(components: ComponentData[], id: string): ComponentData | undefined {
  return buildComponentMap(components).get(id)
}

function findParentContainerInTree(
  components: ComponentData[],
  componentId: string,
): { parent: ComponentData | null; slotKey: string | null; index: number } {
  const traverse = (
    list: ComponentData[],
  ): { parent: ComponentData | null; slotKey: string | null; index: number } => {
    const directIndex = list.findIndex((item) => item.id === componentId)
    if (directIndex !== -1) {
      return { parent: null, slotKey: null, index: directIndex }
    }

    for (const node of list) {
      if (node.children?.length) {
        const childIndex = node.children.findIndex((item) => item.id === componentId)
        if (childIndex !== -1) {
          return { parent: node, slotKey: 'children', index: childIndex }
        }
        const deepResult = traverse(node.children)
        if (deepResult.index !== -1) return deepResult
      }

      if (node.slots) {
        for (const [key, slotChildren] of Object.entries(node.slots)) {
          const slotIndex = slotChildren.findIndex((item) => item.id === componentId)
          if (slotIndex !== -1) {
            return { parent: node, slotKey: key, index: slotIndex }
          }
          const deepResult = traverse(slotChildren)
          if (deepResult.index !== -1) return deepResult
        }
      }
    }
    return { parent: null, slotKey: null, index: -1 }
  }
  return traverse(components)
}

export const useEditorStore = create<EditorState & EditorActions>((set, get) => ({
  // State
  currentPage: null,
  currentComponent: null,
  canvasScale: 1,
  snapToGrid: true,
  showGuidelines: true,
  selectedComponentIds: [],
  previewHiddenIds: [],
  previewValues: {},
  validationErrors: {},

  // Settings
  setCanvasScale: (scale) => set({ canvasScale: scale }),
  setSnapToGrid: (enabled) => set({ snapToGrid: enabled }),
  setShowGuidelines: (enabled) => set({ showGuidelines: enabled }),

  // Page
  createNewPage: (title = '\u65b0\u9875\u9762') => {
    set({
      currentPage: {
        id: `page_${Date.now()}`,
        title,
        components: [],
        style: { width: 1200, height: 800, backgroundColor: '#ffffff' },
      },
      currentComponent: null,
      selectedComponentIds: [],
    })
  },

  loadPageData: (page) => {
    set({
      currentPage: { ...page },
      currentComponent: null,
      selectedComponentIds: [],
    })
    useHistoryStore.getState().clearHistory()
  },

  exportPageData: () => {
    const { currentPage } = get()
    return currentPage ? JSON.stringify(currentPage, null, 2) : null
  },

  // Queries
  getComponentById: (id) => {
    const { currentPage } = get()
    if (!currentPage?.components) return undefined
    return findComponentById(currentPage.components, id)
  },

  findParentContainer: (componentId) => {
    const { currentPage } = get()
    if (!currentPage) return { parent: null, slotKey: null, index: -1 }
    return findParentContainerInTree(currentPage.components, componentId)
  },

  getMaxZIndex: () => {
    const { currentPage } = get()
    if (!currentPage?.components.length) return 0
    return Math.max(...currentPage.components.map((c) => c.style.zIndex || 1))
  },

  // Selection
  selectComponent: (componentId, multi = false) => {
    const state = get()
    const comp = state.getComponentById(componentId)
    if (!comp) return

    if (multi) {
      const ids = [...state.selectedComponentIds]
      const idx = ids.indexOf(componentId)
      if (idx > -1) ids.splice(idx, 1)
      else ids.push(componentId)
      set({ selectedComponentIds: ids, currentComponent: comp })
    } else {
      set({ selectedComponentIds: [componentId], currentComponent: comp })
    }
  },

  clearSelectedComponents: () => {
    set({ selectedComponentIds: [], currentComponent: null })
  },

  // Add component
  addComponent: (type, initialProps = {}) => {
    const state = get()
    if (!state.currentPage) return

    const defaultStyle = {
      width: 200,
      height: 50,
      zIndex: state.getMaxZIndex() + 1,
    }

    const { width, height, zIndex, ...otherProps } = initialProps
    const finalStyle = {
      ...defaultStyle,
      ...(componentConfigs[type].defaultStyle ?? {}),
      ...(width !== undefined && { width: width as number }),
      ...(height !== undefined && { height: height as number }),
      ...(zIndex !== undefined && { zIndex: zIndex as number }),
    }

    const resolvedDefaultProps = componentConfigs[type].defaultProps
    const component: ComponentData = {
      id: createComponentId(),
      type,
      style: finalStyle,
      props: { ...resolvedDefaultProps, ...otherProps },
      isContainer: type === ComponentType.FORM || type === ComponentType.TABS,
      children: type === ComponentType.FORM ? [] : undefined,
      slots:
        type === ComponentType.FORM
          ? { col1: [], col2: [] }
          : type === ComponentType.TABS
            ? { tab1: [], tab2: [] }
            : undefined,
    }

    const command: Command = {
      execute: () => {
        set(
          produce((draft: EditorState) => {
            draft.currentPage?.components.push(component)
            draft.currentComponent = component
          }),
        )
      },
      undo: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            const index = draft.currentPage.components.findIndex((c) => c.id === component.id)
            if (index !== -1) draft.currentPage.components.splice(index, 1)
            if (draft.currentComponent?.id === component.id) draft.currentComponent = null
          }),
        )
      },
    }

    useHistoryStore.getState().executeCommand(command)
  },

  addChildComponent: (containerId, type, initialProps = {}, slotKey = 'children') => {
    const state = get()
    const container = state.getComponentById(containerId)
    if (!container) return

    const defaultStyle = { width: 180, height: 40, zIndex: 1 }
    const { width, height, zIndex, ...otherProps } = initialProps
    const resolvedChildDefaultProps = componentConfigs[type].defaultProps

    const child: ComponentData = {
      id: createComponentId(),
      type,
      style: {
        ...defaultStyle,
        ...(componentConfigs[type].defaultStyle ?? {}),
        ...(width !== undefined && { width: width as number }),
        ...(height !== undefined && { height: height as number }),
        ...(zIndex !== undefined && { zIndex: zIndex as number }),
      },
      props: { ...resolvedChildDefaultProps, ...otherProps },
      isContainer: type === ComponentType.FORM || type === ComponentType.TABS,
      children: type === ComponentType.FORM ? [] : undefined,
      slots:
        type === ComponentType.FORM
          ? { col1: [], col2: [] }
          : type === ComponentType.TABS
            ? { tab1: [], tab2: [] }
            : undefined,
    }

    const command: Command = {
      execute: () => {
        set(
          produce((draft: EditorState) => {
            const c = draft.currentPage
              ? findComponentById(draft.currentPage.components, containerId)
              : undefined
            if (!c) return
            if (slotKey === 'children') {
              if (!c.children) c.children = []
              c.children.push(child)
            } else {
              if (!c.slots) c.slots = {}
              if (!c.slots[slotKey]) c.slots[slotKey] = []
              c.slots[slotKey]!.push(child)
            }
            draft.currentComponent = child
          }),
        )
      },
      undo: () => {
        set(
          produce((draft: EditorState) => {
            const c = draft.currentPage
              ? findComponentById(draft.currentPage.components, containerId)
              : undefined
            if (!c) return
            const removeFrom = slotKey === 'children' ? c.children : c.slots?.[slotKey]
            if (!removeFrom) return
            const index = removeFrom.findIndex((item) => item.id === child.id)
            if (index !== -1) removeFrom.splice(index, 1)
            if (draft.currentComponent?.id === child.id) draft.currentComponent = null
          }),
        )
      },
    }

    useHistoryStore.getState().executeCommand(command)
  },

  deleteComponent: (componentId) => {
    const state = get()
    if (!state.currentPage) return

    const parentInfo = state.findParentContainer(componentId)
    if (parentInfo.index === -1) return

    const targetList = parentInfo.parent
      ? parentInfo.slotKey === 'children'
        ? parentInfo.parent.children
        : parentInfo.parent.slots?.[parentInfo.slotKey || '']
      : state.currentPage.components

    if (!targetList) return
    const component = targetList[parentInfo.index]
    if (!component) return

    const wasSelected = state.currentComponent?.id === componentId
    const parentId = parentInfo.parent?.id ?? null
    const { slotKey, index } = parentInfo

    const command: Command = {
      execute: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            const list = parentId
              ? (() => {
                  const p = findComponentById(draft.currentPage!.components, parentId)
                  return slotKey === 'children' ? p?.children : p?.slots?.[slotKey || '']
                })()
              : draft.currentPage.components
            if (list) {
              const i = list.findIndex((c) => c.id === componentId)
              if (i !== -1) list.splice(i, 1)
            }
            if (wasSelected) draft.currentComponent = null
          }),
        )
      },
      undo: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            const list = parentId
              ? (() => {
                  const p = findComponentById(draft.currentPage!.components, parentId)
                  return slotKey === 'children' ? p?.children : p?.slots?.[slotKey || '']
                })()
              : draft.currentPage.components
            if (list) list.splice(index, 0, component)
            if (wasSelected) draft.currentComponent = component
          }),
        )
      },
    }

    useHistoryStore.getState().executeCommand(command)
  },

  // Style updates
  updateComponentStyleSilent: (componentId, styleUpdates) => {
    set(
      produce((draft: EditorState) => {
        if (!draft.currentPage) return
        const comp = findComponentById(draft.currentPage.components, componentId)
        if (comp) Object.assign(comp.style, styleUpdates)
      }),
    )
  },

  batchUpdateComponentStyle: (componentId, oldStyle, newStyle) => {
    const command: Command = {
      execute: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            const comp = findComponentById(draft.currentPage.components, componentId)
            if (comp) Object.assign(comp.style, newStyle)
          }),
        )
      },
      undo: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            const comp = findComponentById(draft.currentPage.components, componentId)
            if (comp) Object.assign(comp.style, oldStyle)
          }),
        )
      },
    }
    useHistoryStore.getState().executeCommand(command)
  },

  updateComponentStyle: (componentId, styleUpdates) => {
    const state = get()
    if (!state.currentPage) return
    const component = state.getComponentById(componentId)
    if (!component) return

    const oldStyle = { ...component.style }
    const command: Command = {
      execute: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            const comp = findComponentById(draft.currentPage.components, componentId)
            if (comp) Object.assign(comp.style, styleUpdates)
          }),
        )
      },
      undo: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            const comp = findComponentById(draft.currentPage.components, componentId)
            if (comp) Object.assign(comp.style, oldStyle)
          }),
        )
      },
    }
    useHistoryStore.getState().executeCommand(command)
  },

  updateComponentProps: (componentId, propUpdates) => {
    const state = get()
    if (!state.currentPage) return
    const component = state.getComponentById(componentId)
    if (!component) return

    const oldProps = { ...component.props }
    const command: Command = {
      execute: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            const comp = findComponentById(draft.currentPage.components, componentId)
            if (comp) Object.assign(comp.props, propUpdates)
          }),
        )
      },
      undo: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            const comp = findComponentById(draft.currentPage.components, componentId)
            if (comp) Object.assign(comp.props, oldProps)
          }),
        )
      },
    }
    useHistoryStore.getState().executeCommand(command)
  },

  updateComponentEvents: (componentId, events) => {
    const state = get()
    const component = state.getComponentById(componentId)
    if (!component) return

    const oldEvents = component.events ? [...component.events] : undefined
    const newEvents = [...events]
    const command: Command = {
      execute: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            const comp = findComponentById(draft.currentPage.components, componentId)
            if (comp) comp.events = newEvents
          }),
        )
      },
      undo: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            const comp = findComponentById(draft.currentPage.components, componentId)
            if (comp) comp.events = oldEvents
          }),
        )
      },
    }
    useHistoryStore.getState().executeCommand(command)
  },

  // Layer management
  moveComponentLayer: (componentId, direction) => {
    const state = get()
    if (!state.currentPage) return

    const components = state.currentPage.components
    const comp = state.getComponentById(componentId)
    if (!comp) return

    const currentZIndex = comp.style.zIndex
    const allZIndices = components.map((c) => c.style.zIndex).sort((a, b) => a - b)
    const uniqueZIndices = [...new Set(allZIndices)]

    if (direction === 'up') {
      const higherZ = uniqueZIndices.find((z) => z > currentZIndex)
      if (higherZ !== undefined) {
        const higherComp = components.find((c) => c.style.zIndex === higherZ)
        if (higherComp) {
          const higherId = higherComp.id
          const command: Command = {
            execute: () => {
              set(
                produce((draft: EditorState) => {
                  if (!draft.currentPage) return
                  const a = findComponentById(draft.currentPage.components, componentId)
                  const b = findComponentById(draft.currentPage.components, higherId)
                  if (a && b) {
                    a.style.zIndex = higherZ
                    b.style.zIndex = currentZIndex
                  }
                }),
              )
            },
            undo: () => {
              set(
                produce((draft: EditorState) => {
                  if (!draft.currentPage) return
                  const a = findComponentById(draft.currentPage.components, componentId)
                  const b = findComponentById(draft.currentPage.components, higherId)
                  if (a && b) {
                    a.style.zIndex = currentZIndex
                    b.style.zIndex = higherZ
                  }
                }),
              )
            },
          }
          useHistoryStore.getState().executeCommand(command)
          return
        }
      }
    } else if (direction === 'down') {
      const lowerZs = uniqueZIndices.filter((z) => z < currentZIndex)
      const lowerZ = lowerZs[lowerZs.length - 1]
      if (lowerZ !== undefined) {
        const lowerComp = components.find((c) => c.style.zIndex === lowerZ)
        if (lowerComp) {
          const lowerId = lowerComp.id
          const command: Command = {
            execute: () => {
              set(
                produce((draft: EditorState) => {
                  if (!draft.currentPage) return
                  const a = findComponentById(draft.currentPage.components, componentId)
                  const b = findComponentById(draft.currentPage.components, lowerId)
                  if (a && b) {
                    a.style.zIndex = lowerZ
                    b.style.zIndex = currentZIndex
                  }
                }),
              )
            },
            undo: () => {
              set(
                produce((draft: EditorState) => {
                  if (!draft.currentPage) return
                  const a = findComponentById(draft.currentPage.components, componentId)
                  const b = findComponentById(draft.currentPage.components, lowerId)
                  if (a && b) {
                    a.style.zIndex = currentZIndex
                    b.style.zIndex = lowerZ
                  }
                }),
              )
            },
          }
          useHistoryStore.getState().executeCommand(command)
          return
        }
      }
    } else if (direction === 'top') {
      const targetZ = state.getMaxZIndex() + 1
      if (targetZ === currentZIndex) return
      const command: Command = {
        execute: () => {
          set(
            produce((draft: EditorState) => {
              if (!draft.currentPage) return
              const c = findComponentById(draft.currentPage.components, componentId)
              if (c) c.style.zIndex = targetZ
            }),
          )
        },
        undo: () => {
          set(
            produce((draft: EditorState) => {
              if (!draft.currentPage) return
              const c = findComponentById(draft.currentPage.components, componentId)
              if (c) c.style.zIndex = currentZIndex
            }),
          )
        },
      }
      useHistoryStore.getState().executeCommand(command)
    } else if (direction === 'bottom') {
      const oldZIndices = components.map((c) => ({ id: c.id, zIndex: c.style.zIndex }))
      const command: Command = {
        execute: () => {
          set(
            produce((draft: EditorState) => {
              if (!draft.currentPage) return
              draft.currentPage.components.forEach((c) => {
                if (c.id !== componentId) c.style.zIndex += 1
              })
              const c = findComponentById(draft.currentPage.components, componentId)
              if (c) c.style.zIndex = 1
            }),
          )
        },
        undo: () => {
          set(
            produce((draft: EditorState) => {
              if (!draft.currentPage) return
              oldZIndices.forEach(({ id, zIndex }) => {
                const c = findComponentById(draft.currentPage!.components, id)
                if (c) c.style.zIndex = zIndex
              })
            }),
          )
        },
      }
      useHistoryStore.getState().executeCommand(command)
    }
  },

  setComponentZIndex: (componentId, zIndex) => {
    const state = get()
    if (!state.currentPage) return
    const comp = state.getComponentById(componentId)
    if (!comp) return
    const oldZ = comp.style.zIndex
    const newZ = Math.max(1, zIndex)
    if (oldZ === newZ) return

    const command: Command = {
      execute: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            const c = findComponentById(draft.currentPage.components, componentId)
            if (c) c.style.zIndex = newZ
          }),
        )
      },
      undo: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            const c = findComponentById(draft.currentPage.components, componentId)
            if (c) c.style.zIndex = oldZ
          }),
        )
      },
    }
    useHistoryStore.getState().executeCommand(command)
  },

  normalizeZIndex: () => {
    const state = get()
    if (!state.currentPage) return
    const components = state.currentPage.components
    if (components.length === 0) return

    const sorted = [...components].sort((a, b) => (a.style.zIndex || 1) - (b.style.zIndex || 1))
    const oldZIndices = components.map((c) => ({ id: c.id, zIndex: c.style.zIndex }))
    const newZIndices = sorted.map((c, i) => ({ id: c.id, zIndex: i + 1 }))

    const command: Command = {
      execute: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            newZIndices.forEach(({ id, zIndex }) => {
              const c = findComponentById(draft.currentPage!.components, id)
              if (c) c.style.zIndex = zIndex
            })
          }),
        )
      },
      undo: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            oldZIndices.forEach(({ id, zIndex }) => {
              const c = findComponentById(draft.currentPage!.components, id)
              if (c) c.style.zIndex = zIndex
            })
          }),
        )
      },
    }
    useHistoryStore.getState().executeCommand(command)
  },

  // Reorder (flow layout)
  reorderComponent: (componentId, targetIndex) => {
    const state = get()
    if (!state.currentPage) return
    const components = state.currentPage.components
    const currentIndex = components.findIndex((c) => c.id === componentId)
    if (currentIndex === -1 || currentIndex === targetIndex) return
    const clampedTarget = Math.max(0, Math.min(targetIndex, components.length - 1))
    if (currentIndex === clampedTarget) return

    const command: Command = {
      execute: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            const [item] = draft.currentPage.components.splice(currentIndex, 1)
            if (item) draft.currentPage.components.splice(clampedTarget, 0, item)
          }),
        )
      },
      undo: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            const [item] = draft.currentPage.components.splice(clampedTarget, 1)
            if (item) draft.currentPage.components.splice(currentIndex, 0, item)
          }),
        )
      },
    }
    useHistoryStore.getState().executeCommand(command)
  },

  // Batch add (AI orchestration)
  batchAddComponents: (componentDefs, clearFirst) => {
    const state = get()
    if (!state.currentPage) return

    const oldComponents = state.currentPage.components.map((c) => ({ ...c }))
    const baseZIndex = clearFirst ? 1 : state.getMaxZIndex() + 1

    const newComponents: ComponentData[] = componentDefs.map((def, i) => {
      const config = componentConfigs[def.type]
      const defaultStyle = { width: 200, height: 50, zIndex: baseZIndex + i }
      return {
        id: createComponentId(),
        type: def.type,
        style: {
          ...defaultStyle,
          ...(config.defaultStyle ?? {}),
          ...(def.style ?? {}),
          zIndex: baseZIndex + i,
        },
        props: { ...config.defaultProps, ...(def.props ?? {}) },
        isContainer: def.type === ComponentType.FORM || def.type === ComponentType.TABS,
        children: def.type === ComponentType.FORM ? [] : undefined,
        slots: (() => {
          if (def.type === ComponentType.FORM)
            return { col1: [], col2: [] } as Record<string, ComponentData[]>
          if (def.type === ComponentType.TABS)
            return { tab1: [], tab2: [] } as Record<string, ComponentData[]>
          return undefined
        })(),
      }
    })

    const command: Command = {
      execute: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            if (clearFirst) {
              draft.currentPage.components = [...newComponents]
            } else {
              draft.currentPage.components.push(...newComponents)
            }
            draft.currentComponent = null
            draft.selectedComponentIds = []
          }),
        )
      },
      undo: () => {
        set(
          produce((draft: EditorState) => {
            if (!draft.currentPage) return
            draft.currentPage.components = oldComponents
            draft.currentComponent = null
            draft.selectedComponentIds = []
          }),
        )
      },
    }
    useHistoryStore.getState().executeCommand(command)
  },

  // Preview state
  setPreviewHidden: (componentId, hidden) => {
    set((state) => {
      if (hidden) {
        return state.previewHiddenIds.includes(componentId)
          ? state
          : { previewHiddenIds: [...state.previewHiddenIds, componentId] }
      } else {
        return { previewHiddenIds: state.previewHiddenIds.filter((id) => id !== componentId) }
      }
    })
  },

  setPreviewValue: (componentId, value) => {
    set((state) => ({
      previewValues: { ...state.previewValues, [componentId]: value },
    }))
  },

  setValidationError: (componentId, message) => {
    set((state) => ({
      validationErrors: { ...state.validationErrors, [componentId]: message },
    }))
  },

  clearValidationErrors: () => set({ validationErrors: {} }),

  clearPreviewState: () =>
    set({
      previewHiddenIds: [],
      previewValues: {},
      validationErrors: {},
    }),
}))
