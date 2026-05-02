import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEditorStore } from '../editor'
import { useHistoryStore } from '../history'
import { ComponentType } from '@/types'

// ── 初始化 ────────────────────────────────────────────────────
function setup() {
  setActivePinia(createPinia())
  const editorStore = useEditorStore()
  const historyStore = useHistoryStore()
  editorStore.createNewPage()
  return { editorStore, historyStore }
}

// ── addComponent ──────────────────────────────────────────────
describe('addComponent', () => {
  it('添加组件后页面组件数量 +1', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    expect(editorStore.currentPage?.components).toHaveLength(1)
  })

  it('添加后 currentComponent 指向新组件', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.BUTTON)
    expect(editorStore.currentComponent?.type).toBe(ComponentType.BUTTON)
  })

  it('新组件携带正确的默认 props', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    expect(editorStore.currentComponent?.props.content).toBe('文本内容')
  })

  it('新组件携带正确的默认样式', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const style = editorStore.currentComponent?.style
    expect(style?.top).toBe(100)
    expect(style?.left).toBe(100)
    expect(style?.zIndex).toBe(1)
    expect(style?.fontSize).toBe(14)
  })

  it('可通过 initialProps 覆盖默认位置', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT, { left: 200, top: 300 })
    const style = editorStore.currentComponent?.style
    expect(style?.left).toBe(200)
    expect(style?.top).toBe(300)
  })

  it('Form 组件默认 isContainer=true 并初始化 slots', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.FORM)
    const comp = editorStore.currentComponent
    expect(comp?.isContainer).toBe(true)
    expect(comp?.slots).toHaveProperty('col1')
    expect(comp?.slots).toHaveProperty('col2')
  })

  it('添加组件后可以 undo 恢复', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    expect(editorStore.currentPage?.components).toHaveLength(1)

    historyStore.undo()
    expect(editorStore.currentPage?.components).toHaveLength(0)
    expect(editorStore.currentComponent).toBeNull()
  })

  it('undo 后可以 redo 再次添加', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    historyStore.undo()
    historyStore.redo()
    expect(editorStore.currentPage?.components).toHaveLength(1)
  })

  it('多个组件的 zIndex 递增', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    editorStore.addComponent(ComponentType.BUTTON)
    const comps = editorStore.currentPage!.components
    expect(comps[0].style.zIndex).toBe(1)
    expect(comps[1].style.zIndex).toBe(2)
  })
})

// ── NumberInput 专项 ──────────────────────────────────────────
describe('addComponent - NumberInput', () => {
  it('携带正确的默认 props', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.NUMBER_INPUT)
    const props = editorStore.currentComponent?.props
    expect(props?.min).toBe(0)
    expect(props?.max).toBe(100)
    expect(props?.step).toBe(1)
    expect(props?.value).toBe(0)
  })

  it('携带正确的默认样式（fontSize / borderWidth / borderRadius）', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.NUMBER_INPUT)
    const style = editorStore.currentComponent?.style
    expect(style?.fontSize).toBe(14)
    expect(style?.borderWidth).toBe(1)
    expect(style?.borderRadius).toBe(4)
  })

  it('添加后 undo 移除组件', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.NUMBER_INPUT)
    expect(editorStore.currentPage?.components).toHaveLength(1)
    historyStore.undo()
    expect(editorStore.currentPage?.components).toHaveLength(0)
  })

  it('undo 后 redo 恢复组件', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.NUMBER_INPUT)
    historyStore.undo()
    historyStore.redo()
    expect(editorStore.currentPage?.components).toHaveLength(1)
    expect(editorStore.currentComponent?.type).toBe(ComponentType.NUMBER_INPUT)
  })
})

// ── deleteComponent ───────────────────────────────────────────
describe('deleteComponent', () => {
  it('删除组件后数量 -1', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id

    editorStore.deleteComponent(id)
    expect(editorStore.currentPage?.components).toHaveLength(0)
  })

  it('删除当前选中组件后 currentComponent 置空', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id

    editorStore.deleteComponent(id)
    expect(editorStore.currentComponent).toBeNull()
  })

  it('删除后可以 undo 恢复', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id

    editorStore.deleteComponent(id)
    expect(editorStore.currentPage?.components).toHaveLength(0)

    historyStore.undo()
    expect(editorStore.currentPage?.components).toHaveLength(1)
  })
})

// ── updateComponentStyle ──────────────────────────────────────
describe('updateComponentStyle', () => {
  it('更新样式后属性正确变更', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id

    editorStore.updateComponentStyle(id, { left: 500, top: 400 })
    const comp = editorStore.getComponentById(id)
    expect(comp?.style.left).toBe(500)
    expect(comp?.style.top).toBe(400)
  })

  it('更新样式后可以 undo 恢复', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id
    const originalLeft = editorStore.currentComponent!.style.left

    editorStore.updateComponentStyle(id, { left: 999 })
    historyStore.undo()

    expect(editorStore.getComponentById(id)?.style.left).toBe(originalLeft)
  })
})

// ── updateComponentProps ──────────────────────────────────────
describe('updateComponentProps', () => {
  it('更新 props 后内容正确变更', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id

    editorStore.updateComponentProps(id, { content: '新内容' })
    expect(editorStore.getComponentById(id)?.props.content).toBe('新内容')
  })

  it('更新 props 后可以 undo 恢复', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id

    editorStore.updateComponentProps(id, { content: '新内容' })
    historyStore.undo()

    expect(editorStore.getComponentById(id)?.props.content).toBe('文本内容')
  })
})

// ── getComponentById ──────────────────────────────────────────
describe('getComponentById', () => {
  it('能找到顶层组件', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id

    expect(editorStore.getComponentById(id)).toBeDefined()
  })

  it('能找到容器内的嵌套子组件', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.FORM)
    const containerId = editorStore.currentComponent!.id

    editorStore.addChildComponent(containerId, ComponentType.TEXT, {}, 'col1')
    const childId = editorStore.currentComponent!.id

    expect(editorStore.getComponentById(childId)).toBeDefined()
    expect(editorStore.getComponentById(childId)?.type).toBe(ComponentType.TEXT)
  })

  it('不存在的 id 返回 undefined', () => {
    const { editorStore } = setup()
    expect(editorStore.getComponentById('not-exist')).toBeUndefined()
  })
})

// ── selectComponent ───────────────────────────────────────────
describe('selectComponent', () => {
  it('单选后 currentComponent 指向目标组件', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id

    editorStore.addComponent(ComponentType.BUTTON)
    editorStore.selectComponent(id)

    expect(editorStore.currentComponent?.id).toBe(id)
    expect(editorStore.selectedComponentIds).toEqual([id])
  })

  it('多选模式下追加选中', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id1 = editorStore.currentComponent!.id
    editorStore.addComponent(ComponentType.BUTTON)
    const id2 = editorStore.currentComponent!.id

    editorStore.selectComponent(id1)
    editorStore.selectComponent(id2, true)

    expect(editorStore.selectedComponentIds).toContain(id1)
    expect(editorStore.selectedComponentIds).toContain(id2)
  })

  it('clearSelectedComponents 清空所有选中', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id
    editorStore.selectComponent(id)

    editorStore.clearSelectedComponents()
    expect(editorStore.selectedComponentIds).toHaveLength(0)
    expect(editorStore.currentComponent).toBeNull()
  })
})

// ── TimePicker 专项 ───────────────────────────────────────────
describe('addComponent - TimePicker', () => {
  it('携带正确的默认 props', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TIME_PICKER)
    const props = editorStore.currentComponent?.props
    expect(props?.placeholder).toBe('请选择日期时间')
    expect(props?.value).toBe('')
    expect(props?.disabled).toBe(false)
  })

  it('携带正确的默认样式（width / height / borderRadius / backgroundColor）', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TIME_PICKER)
    const style = editorStore.currentComponent?.style
    expect(style?.width).toBe(290)
    expect(style?.height).toBe(40)
    expect(style?.borderRadius).toBe(4)
    expect(style?.backgroundColor).toBe('#ffffff')
  })

  it('添加后 undo 移除组件', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.TIME_PICKER)
    expect(editorStore.currentPage?.components).toHaveLength(1)
    historyStore.undo()
    expect(editorStore.currentPage?.components).toHaveLength(0)
  })

  it('undo 后 redo 恢复组件', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.TIME_PICKER)
    historyStore.undo()
    historyStore.redo()
    expect(editorStore.currentPage?.components).toHaveLength(1)
    expect(editorStore.currentComponent?.type).toBe(ComponentType.TIME_PICKER)
  })
})

// ── exportPageData / loadPageData ─────────────────────────────
describe('exportPageData / loadPageData', () => {
  it('导出的 JSON 可以再次加载', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    editorStore.addComponent(ComponentType.BUTTON)

    const json = editorStore.exportPageData()
    expect(json).not.toBeNull()

    const page = JSON.parse(json!)
    editorStore.createNewPage()
    editorStore.loadPageData(page)

    expect(editorStore.currentPage?.components).toHaveLength(2)
  })

  it('loadPageData 后历史记录被清空', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)

    const page = JSON.parse(editorStore.exportPageData()!)
    editorStore.loadPageData(page)

    expect(historyStore.canUndo()).toBe(false)
  })
})
