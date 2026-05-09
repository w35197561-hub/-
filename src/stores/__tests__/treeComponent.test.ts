import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEditorStore } from '../editor'
import { useHistoryStore } from '../history'
import { ComponentType } from '@/types'

function setup() {
  setActivePinia(createPinia())
  const editorStore = useEditorStore()
  const historyStore = useHistoryStore()
  editorStore.createNewPage()
  return { editorStore, historyStore }
}

describe('addComponent - Tree', () => {
  it('ComponentType.TREE 枚举值为 "Tree"', () => {
    expect(ComponentType.TREE).toBe('Tree')
  })

  it('携带正确的默认 props（data 数组含 2 个根节点）', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TREE)
    const props = editorStore.currentComponent?.props
    expect(Array.isArray(props?.data)).toBe(true)
    expect((props?.data as unknown[]).length).toBe(2)
  })

  it('根节点包含 children 字段', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TREE)
    const data = editorStore.currentComponent?.props.data as Array<{
      label: string
      value: string
      children?: unknown[]
    }>
    expect(data[0].children).toHaveLength(2)
    expect(data[1].children).toHaveLength(1)
  })

  it('默认 defaultExpandAll 为 false', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TREE)
    expect(editorStore.currentComponent?.props.defaultExpandAll).toBe(false)
  })

  it('携带正确的默认样式（width / height / fontSize）', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TREE)
    const style = editorStore.currentComponent?.style
    expect(style?.width).toBe(240)
    expect(style?.height).toBe(200)
    expect(style?.fontSize).toBe(14)
  })

  it('addComponent 后 undo 移除组件', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.TREE)
    expect(editorStore.currentPage?.components).toHaveLength(1)
    historyStore.undo()
    expect(editorStore.currentPage?.components).toHaveLength(0)
  })

  it('undo 后 redo 恢复组件', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.TREE)
    historyStore.undo()
    historyStore.redo()
    expect(editorStore.currentPage?.components).toHaveLength(1)
    expect(editorStore.currentComponent?.type).toBe(ComponentType.TREE)
  })
})
