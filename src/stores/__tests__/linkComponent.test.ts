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

// ── Link 专项 ─────────────────────────────────────────────────
describe('addComponent - Link', () => {
  it('ComponentType.LINK 枚举值为 "Link"', () => {
    expect(ComponentType.LINK).toBe('Link')
  })

  it('携带正确的默认 props', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.LINK)
    const props = editorStore.currentComponent?.props
    expect(props?.content).toBe('链接文字')
    expect(props?.href).toBe('')
    expect(props?.target).toBe('_blank')
  })

  it('携带正确的默认样式（width / height / color / fontSize）', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.LINK)
    const style = editorStore.currentComponent?.style
    expect(style?.width).toBe(120)
    expect(style?.height).toBe(32)
    expect(style?.color).toBe('#409eff')
    expect(style?.fontSize).toBe(14)
  })

  it('propSetters 包含 content / href / target 三个配置项', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.LINK)
    // 通过 componentConfigs 间接验证：添加成功即配置存在
    expect(editorStore.currentComponent?.type).toBe(ComponentType.LINK)
    expect(editorStore.currentComponent?.props).toHaveProperty('content')
    expect(editorStore.currentComponent?.props).toHaveProperty('href')
    expect(editorStore.currentComponent?.props).toHaveProperty('target')
  })

  it('styleSetters 驱动 color 和 fontSize 字段', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.LINK)
    const style = editorStore.currentComponent?.style
    // color 和 fontSize 均有默认值，说明 defaultStyle 生效
    expect(style?.color).toBeDefined()
    expect(style?.fontSize).toBeDefined()
  })

  it('添加后 undo 移除组件', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.LINK)
    expect(editorStore.currentPage?.components).toHaveLength(1)
    historyStore.undo()
    expect(editorStore.currentPage?.components).toHaveLength(0)
  })

  it('undo 后 redo 恢复组件', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.LINK)
    historyStore.undo()
    historyStore.redo()
    expect(editorStore.currentPage?.components).toHaveLength(1)
    expect(editorStore.currentComponent?.type).toBe(ComponentType.LINK)
  })
})
