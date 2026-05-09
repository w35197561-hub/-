/**
 * TableComponent 核心逻辑测试
 *
 * 直接测试 useTableLogic composable（纯 TypeScript），
 * 覆盖排序三态、分页切片、排序+分页组合、pageSize=0 不分页等场景。
 */
import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { useTableLogic, type RowData } from '@/components/canvas/components/composables/useTableLogic'
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

describe('addComponent - Table', () => {
  it('携带正确的默认 props（columns 3 列、data 3 行、pageSize 5）', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TABLE)
    const p = editorStore.currentComponent?.props
    expect(Array.isArray(p?.columns)).toBe(true)
    expect((p?.columns as unknown[]).length).toBe(3)
    expect(Array.isArray(p?.data)).toBe(true)
    expect((p?.data as unknown[]).length).toBe(3)
    expect(p?.pageSize).toBe(5)
  })

  it('携带正确的默认样式（width 500 / height 240 / backgroundColor #ffffff）', () => {
    const { editorStore } = setup()
    editorStore.addComponent(ComponentType.TABLE)
    const s = editorStore.currentComponent?.style
    expect(s?.width).toBe(500)
    expect(s?.height).toBe(240)
    expect(s?.backgroundColor).toBe('#ffffff')
  })

  it('addComponent 后 undo 移除组件', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.TABLE)
    expect(editorStore.currentPage?.components).toHaveLength(1)
    historyStore.undo()
    expect(editorStore.currentPage?.components).toHaveLength(0)
  })

  it('undo 后 redo 恢复组件', () => {
    const { editorStore, historyStore } = setup()
    editorStore.addComponent(ComponentType.TABLE)
    historyStore.undo()
    historyStore.redo()
    expect(editorStore.currentPage?.components).toHaveLength(1)
    expect(editorStore.currentComponent?.type).toBe(ComponentType.TABLE)
  })
})

// ---- 辅助：从 pagedRows computed 取当前值 ----
function names(rows: RowData[]): string[] {
  return rows.map((r) => String(r['name']))
}

function ages(rows: RowData[]): string[] {
  return rows.map((r) => String(r['age']))
}

// ---- 基础数据 ----
const BASE_DATA: RowData[] = [
  { name: '张三', age: 28 },
  { name: '李四', age: 32 },
  { name: '王五', age: 25 },
]

describe('排序三态（运行态）', () => {
  it('初始无排序：数据保持原始顺序', () => {
    const data = ref<RowData[]>([...BASE_DATA])
    const { pagedRows } = useTableLogic(() => data.value, () => 10)
    expect(names(pagedRows.value)).toEqual(['张三', '李四', '王五'])
  })

  it('第 1 次 toggleSort → 升序（age: 25,28,32）', () => {
    const data = ref<RowData[]>([...BASE_DATA])
    const { toggleSort, pagedRows } = useTableLogic(() => data.value, () => 10)
    toggleSort('age')
    expect(ages(pagedRows.value)).toEqual(['25', '28', '32'])
  })

  it('第 2 次 toggleSort 同一列 → 降序（age: 32,28,25）', () => {
    const data = ref<RowData[]>([...BASE_DATA])
    const { toggleSort, pagedRows } = useTableLogic(() => data.value, () => 10)
    toggleSort('age')
    toggleSort('age')
    expect(ages(pagedRows.value)).toEqual(['32', '28', '25'])
  })

  it('第 3 次 toggleSort 同一列 → 取消排序，恢复原始顺序', () => {
    const data = ref<RowData[]>([...BASE_DATA])
    const { toggleSort, pagedRows } = useTableLogic(() => data.value, () => 10)
    toggleSort('age')
    toggleSort('age')
    toggleSort('age')
    expect(names(pagedRows.value)).toEqual(['张三', '李四', '王五'])
  })

  it('排序图标随三态切换：↕ → ↑ → ↓ → ↕', () => {
    const data = ref<RowData[]>([...BASE_DATA])
    const { toggleSort, getSortIcon } = useTableLogic(() => data.value, () => 10)
    expect(getSortIcon('age')).toBe('↕')
    toggleSort('age')
    expect(getSortIcon('age')).toBe('↑')
    toggleSort('age')
    expect(getSortIcon('age')).toBe('↓')
    toggleSort('age')
    expect(getSortIcon('age')).toBe('↕')
  })
})

describe('分页切片（运行态）', () => {
  const FIVE_ROWS: RowData[] = [
    { name: 'A', age: 1 },
    { name: 'B', age: 2 },
    { name: 'C', age: 3 },
    { name: 'D', age: 4 },
    { name: 'E', age: 5 },
  ]

  it('pageSize=2，第 1 页显示前 2 行', () => {
    const data = ref<RowData[]>([...FIVE_ROWS])
    const { pagedRows } = useTableLogic(() => data.value, () => 2)
    const rows = names(pagedRows.value)
    expect(rows).toHaveLength(2)
    expect(rows).toEqual(['A', 'B'])
  })

  it('pageSize=2，nextPage() 后显示第 3-4 行', () => {
    const data = ref<RowData[]>([...FIVE_ROWS])
    const { pagedRows, nextPage } = useTableLogic(() => data.value, () => 2)
    nextPage()
    expect(names(pagedRows.value)).toEqual(['C', 'D'])
  })
})

describe('排序 + 分页组合（先全量排序再切片）', () => {
  const FIVE_ROWS: RowData[] = [
    { name: '张三', age: 28 },
    { name: '李四', age: 32 },
    { name: '王五', age: 25 },
    { name: '赵六', age: 19 },
    { name: '孙七', age: 41 },
  ]

  it('对全量数据升序后，第 1 页是最小的 2 条', () => {
    const data = ref<RowData[]>([...FIVE_ROWS])
    const { toggleSort, pagedRows } = useTableLogic(() => data.value, () => 2)
    toggleSort('age')
    expect(ages(pagedRows.value)).toEqual(['19', '25'])
  })

  it('对全量数据升序后，第 2 页是第 3-4 小的条目', () => {
    const data = ref<RowData[]>([...FIVE_ROWS])
    const { toggleSort, pagedRows, nextPage } = useTableLogic(() => data.value, () => 2)
    toggleSort('age')
    nextPage()
    expect(ages(pagedRows.value)).toEqual(['28', '32'])
  })
})

describe('pageSize=0 不分页（运行态）', () => {
  it('pageSize=0 时所有行都显示', () => {
    const data = ref<RowData[]>(
      Array.from({ length: 8 }, (_, i) => ({ name: `用户${i + 1}`, age: i + 20 })),
    )
    const { pagedRows } = useTableLogic(() => data.value, () => 0)
    expect(pagedRows.value).toHaveLength(8)
  })

  it('pageSize=0 时 totalPages 为 1（无需翻页）', () => {
    const data = ref<RowData[]>([...BASE_DATA])
    const { totalPages } = useTableLogic(() => data.value, () => 0)
    expect(totalPages.value).toBe(1)
  })
})

describe('内联编辑（运行态）', () => {
  it('onCellInput 修改后 editRows 立即反映新值', () => {
    const data = ref<RowData[]>([...BASE_DATA])
    const { onCellInput, editRows } = useTableLogic(() => data.value, () => 10)
    onCellInput(0, 'name', '新名字')
    expect(editRows.value[0]!['name']).toBe('新名字')
  })

  it('onCellInput 修改后不影响其他行', () => {
    const data = ref<RowData[]>([...BASE_DATA])
    const { onCellInput, editRows } = useTableLogic(() => data.value, () => 10)
    onCellInput(1, 'age', '99')
    expect(String(editRows.value[0]!['name'])).toBe('张三')
    expect(String(editRows.value[2]!['name'])).toBe('王五')
  })
})

describe('翻页与排序列切换的页码重置', () => {
  const FIVE_ROWS: RowData[] = [
    { name: 'A', age: 1 },
    { name: 'B', age: 2 },
    { name: 'C', age: 3 },
    { name: 'D', age: 4 },
    { name: 'E', age: 5 },
  ]

  it('翻到第 2 页后切换排序列，currentPage 自动重置为 1', () => {
    const data = ref<RowData[]>([...FIVE_ROWS])
    const { toggleSort, nextPage, currentPage } = useTableLogic(() => data.value, () => 2)
    toggleSort('age')
    nextPage()
    expect(currentPage.value).toBe(2)
    toggleSort('name')
    expect(currentPage.value).toBe(1)
  })

  it('prevPage 在第 1 页时调用不越界', () => {
    const data = ref<RowData[]>([...FIVE_ROWS])
    const { prevPage, currentPage } = useTableLogic(() => data.value, () => 2)
    expect(currentPage.value).toBe(1)
    prevPage()
    expect(currentPage.value).toBe(1)
  })
})
