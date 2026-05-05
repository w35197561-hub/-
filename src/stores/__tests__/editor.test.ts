import { describe, it, expect } from 'vitest'
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

// ── 画布设置 ──────────────────────────────────────────────────
describe('canvas settings', () => {
  it('setCanvasScale 更新缩放比例', () => {
    const { editorStore } = setup()
    editorStore.setCanvasScale(1.5)
    expect(editorStore.canvasScale).toBe(1.5)
  })

  it('setSnapToGrid 更新网格吸附', () => {
    const { editorStore } = setup()
    editorStore.setSnapToGrid(false)
    expect(editorStore.snapToGrid).toBe(false)
  })

  it('setShowGuidelines 更新辅助线显示', () => {
    const { editorStore } = setup()
    editorStore.setShowGuidelines(false)
    expect(editorStore.showGuidelines).toBe(false)
  })
})

// ── 预览状态 ──────────────────────────────────────────────────
describe('preview state', () => {
  it('setPreviewHidden(true) 将组件 id 加入隐藏列表', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id

    editorStore.setPreviewHidden(id, true)
    expect(editorStore.previewHiddenIds).toContain(id)
  })

  it('setPreviewHidden(false) 将组件从隐藏列表移除', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id

    editorStore.setPreviewHidden(id, true)
    editorStore.setPreviewHidden(id, false)
    expect(editorStore.previewHiddenIds).not.toContain(id)
  })

  it('重复调用 setPreviewHidden(true) 不会重复添加 id', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id

    editorStore.setPreviewHidden(id, true)
    editorStore.setPreviewHidden(id, true)
    expect(editorStore.previewHiddenIds.filter((i) => i === id)).toHaveLength(1)
  })

  it('setPreviewValue 记录组件的运行时值', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.INPUT)
    const id = editorStore.currentComponent!.id

    editorStore.setPreviewValue(id, '用户输入')
    expect(editorStore.previewValues[id]).toBe('用户输入')
  })

  it('setValidationError 记录校验错误信息', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.INPUT)
    const id = editorStore.currentComponent!.id

    editorStore.setValidationError(id, '不能为空')
    expect(editorStore.validationErrors[id]).toBe('不能为空')
  })

  it('clearValidationErrors 清空所有校验错误', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.INPUT)
    const id = editorStore.currentComponent!.id

    editorStore.setValidationError(id, '不能为空')
    editorStore.clearValidationErrors()
    expect(Object.keys(editorStore.validationErrors)).toHaveLength(0)
  })

  it('clearPreviewState 清空所有预览状态', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id

    editorStore.setPreviewHidden(id, true)
    editorStore.setPreviewValue(id, 'test')
    editorStore.setValidationError(id, 'err')
    editorStore.clearPreviewState()

    expect(editorStore.previewHiddenIds).toHaveLength(0)
    expect(Object.keys(editorStore.previewValues)).toHaveLength(0)
    expect(Object.keys(editorStore.validationErrors)).toHaveLength(0)
  })
})

// ── updateComponentStyleSilent ────────────────────────────────
describe('updateComponentStyleSilent', () => {
  it('更新样式但不写入历史', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id

    editorStore.updateComponentStyleSilent(id, { left: 999 })
    expect(editorStore.getComponentById(id)?.style.left).toBe(999)
    // addComponent 产生 1 条历史，silent 不增加
    expect(historyStore.canUndo()).toBe(true)
    historyStore.undo()
    // undo 的是 addComponent，不是样式修改
    expect(editorStore.currentPage?.components).toHaveLength(0)
  })
})

// ── batchUpdateComponentStyle ─────────────────────────────────
describe('batchUpdateComponentStyle', () => {
  it('更新样式并支持 undo 恢复到旧值', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id
    const oldStyle = { ...editorStore.getComponentById(id)!.style }

    editorStore.batchUpdateComponentStyle(id, oldStyle, { left: 300, top: 200 })
    expect(editorStore.getComponentById(id)?.style.left).toBe(300)

    historyStore.undo()
    expect(editorStore.getComponentById(id)?.style.left).toBe(oldStyle.left)
    expect(editorStore.getComponentById(id)?.style.top).toBe(oldStyle.top)
  })
})

// ── moveComponentLayer ────────────────────────────────────────
describe('moveComponentLayer', () => {
  it('up 将组件与上层组件交换 zIndex', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id1 = editorStore.currentComponent!.id // zIndex=1
    editorStore.addComponent(ComponentType.BUTTON)
    const id2 = editorStore.currentComponent!.id // zIndex=2

    editorStore.moveComponentLayer(id1, 'up')
    expect(editorStore.getComponentById(id1)?.style.zIndex).toBe(2)
    expect(editorStore.getComponentById(id2)?.style.zIndex).toBe(1)
  })

  it('down 将组件与下层组件交换 zIndex', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id1 = editorStore.currentComponent!.id // zIndex=1
    editorStore.addComponent(ComponentType.BUTTON)
    const id2 = editorStore.currentComponent!.id // zIndex=2

    editorStore.moveComponentLayer(id2, 'down')
    expect(editorStore.getComponentById(id2)?.style.zIndex).toBe(1)
    expect(editorStore.getComponentById(id1)?.style.zIndex).toBe(2)
  })

  it('top 将组件置顶', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id1 = editorStore.currentComponent!.id // zIndex=1
    editorStore.addComponent(ComponentType.BUTTON) // zIndex=2
    editorStore.addComponent(ComponentType.IMAGE) // zIndex=3

    editorStore.moveComponentLayer(id1, 'top')
    expect(editorStore.getComponentById(id1)?.style.zIndex).toBe(4)
  })

  it('bottom 将组件置底，其他组件 zIndex +1', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT) // zIndex=1
    editorStore.addComponent(ComponentType.BUTTON) // zIndex=2
    const id2 = editorStore.currentComponent!.id
    editorStore.addComponent(ComponentType.IMAGE) // zIndex=3

    editorStore.moveComponentLayer(id2, 'bottom')
    expect(editorStore.getComponentById(id2)?.style.zIndex).toBe(1)
  })

  it('up 操作支持 undo', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id1 = editorStore.currentComponent!.id
    editorStore.addComponent(ComponentType.BUTTON)

    editorStore.moveComponentLayer(id1, 'up')
    historyStore.undo()
    expect(editorStore.getComponentById(id1)?.style.zIndex).toBe(1)
  })
})

// ── setComponentZIndex ────────────────────────────────────────
describe('setComponentZIndex', () => {
  it('直接设置 zIndex', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id

    editorStore.setComponentZIndex(id, 10)
    expect(editorStore.getComponentById(id)?.style.zIndex).toBe(10)
  })

  it('支持 undo', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id
    const original = editorStore.getComponentById(id)!.style.zIndex

    editorStore.setComponentZIndex(id, 10)
    historyStore.undo()
    expect(editorStore.getComponentById(id)?.style.zIndex).toBe(original)
  })

  it('zIndex 最小值为 1', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id

    editorStore.setComponentZIndex(id, -5)
    expect(editorStore.getComponentById(id)?.style.zIndex).toBe(1)
  })
})

// ── normalizeZIndex ───────────────────────────────────────────
describe('normalizeZIndex', () => {
  it('将组件 zIndex 归一化为从 1 开始的连续整数', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id1 = editorStore.currentComponent!.id
    editorStore.addComponent(ComponentType.BUTTON)
    const id2 = editorStore.currentComponent!.id

    // 手动设置不连续的 zIndex
    editorStore.updateComponentStyleSilent(id1, { zIndex: 5 })
    editorStore.updateComponentStyleSilent(id2, { zIndex: 10 })

    editorStore.normalizeZIndex()

    const z1 = editorStore.getComponentById(id1)?.style.zIndex
    const z2 = editorStore.getComponentById(id2)?.style.zIndex
    expect([z1, z2].sort()).toEqual([1, 2])
  })

  it('支持 undo', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.TEXT)
    const id = editorStore.currentComponent!.id
    editorStore.updateComponentStyleSilent(id, { zIndex: 5 })

    editorStore.normalizeZIndex()
    historyStore.undo()
    expect(editorStore.getComponentById(id)?.style.zIndex).toBe(5)
  })
})

// ── addChildComponent ─────────────────────────────────────────
describe('addChildComponent', () => {
  it('向 Form 的 col1 slot 添加子组件', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.FORM)
    const containerId = editorStore.currentComponent!.id

    editorStore.addChildComponent(containerId, ComponentType.INPUT, {}, 'col1')
    const container = editorStore.getComponentById(containerId)
    expect(container?.slots?.col1).toHaveLength(1)
    expect(container?.slots?.col1?.[0].type).toBe(ComponentType.INPUT)
  })

  it('子组件添加后 currentComponent 指向子组件', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.FORM)
    const containerId = editorStore.currentComponent!.id

    editorStore.addChildComponent(containerId, ComponentType.TEXT, {}, 'col2')
    expect(editorStore.currentComponent?.type).toBe(ComponentType.TEXT)
  })

  it('支持 undo 移除子组件', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.FORM)
    const containerId = editorStore.currentComponent!.id

    editorStore.addChildComponent(containerId, ComponentType.INPUT, {}, 'col1')
    expect(editorStore.getComponentById(containerId)?.slots?.col1).toHaveLength(1)

    historyStore.undo()
    expect(editorStore.getComponentById(containerId)?.slots?.col1).toHaveLength(0)
  })

  it('getComponentById 能找到容器内子组件', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.FORM)
    const containerId = editorStore.currentComponent!.id

    editorStore.addChildComponent(containerId, ComponentType.BUTTON, {}, 'col1')
    const childId = editorStore.currentComponent!.id
    expect(editorStore.getComponentById(childId)?.type).toBe(ComponentType.BUTTON)
  })
})

// ── updateComponentEvents ─────────────────────────────────────
describe('updateComponentEvents', () => {
  it('设置组件事件列表', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.BUTTON)
    const id = editorStore.currentComponent!.id

    editorStore.updateComponentEvents(id, [
      { type: 'click', actions: [{ type: 'alert', params: { message: '你好' } }] },
    ])
    expect(editorStore.getComponentById(id)?.events).toHaveLength(1)
    expect(editorStore.getComponentById(id)?.events?.[0].type).toBe('click')
  })

  it('支持 undo 恢复事件', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.BUTTON)
    const id = editorStore.currentComponent!.id

    editorStore.updateComponentEvents(id, [
      { type: 'click', actions: [{ type: 'alert', params: { message: '你好' } }] },
    ])
    historyStore.undo()
    expect(editorStore.getComponentById(id)?.events).toBeUndefined()
  })
})
