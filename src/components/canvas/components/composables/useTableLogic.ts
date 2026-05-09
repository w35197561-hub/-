import { computed, ref, watch } from 'vue'

export type SortOrder = 'asc' | 'desc' | null
export type RowData = Record<string, unknown>

/**
 * TableComponent 核心排序 + 分页逻辑，抽取为独立 composable 以便单测。
 */
export function useTableLogic(
  sourceRows: () => RowData[],
  pageSizeGetter: () => number,
) {
  // ---- 内联编辑副本（运行态） ----
  const editRows = ref<RowData[]>([])

  // 当源数据变化时同步 editRows
  watch(
    sourceRows,
    (data) => {
      editRows.value = data.map((row) => ({ ...row }))
    },
    { immediate: true, deep: true },
  )

  const onCellInput = (row: number, field: string, val: string) => {
    const rows = [...editRows.value]
    rows[row] = { ...rows[row]!, [field]: val }
    editRows.value = rows
  }

  // ---- 排序 ----
  const sortField = ref<string | null>(null)
  const sortOrder = ref<SortOrder>(null)

  const toggleSort = (field: string) => {
    if (sortField.value !== field) {
      sortField.value = field
      sortOrder.value = 'asc'
    } else if (sortOrder.value === 'asc') {
      sortOrder.value = 'desc'
    } else if (sortOrder.value === 'desc') {
      sortField.value = null
      sortOrder.value = null
    }
    currentPage.value = 1
  }

  const getSortIcon = (field: string): string => {
    if (sortField.value !== field) return '↕'
    if (sortOrder.value === 'asc') return '↑'
    if (sortOrder.value === 'desc') return '↓'
    return '↕'
  }

  const sortedRows = computed<RowData[]>(() => {
    const rows = [...editRows.value]
    if (!sortField.value || !sortOrder.value) return rows
    const field = sortField.value
    const order = sortOrder.value
    return rows.sort((a, b) => {
      const av = a[field]
      const bv = b[field]
      if (av === bv) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = av < bv ? -1 : 1
      return order === 'asc' ? cmp : -cmp
    })
  })

  // ---- 分页 ----
  const currentPage = ref(1)

  const pageSize = computed(() => pageSizeGetter())

  const totalPages = computed(() => {
    if (pageSize.value <= 0) return 1
    return Math.max(1, Math.ceil(sortedRows.value.length / pageSize.value))
  })

  watch(totalPages, (n) => {
    if (currentPage.value > n) currentPage.value = n
  })

  const pagedRows = computed<RowData[]>(() => {
    if (pageSize.value <= 0) return sortedRows.value
    const start = (currentPage.value - 1) * pageSize.value
    return sortedRows.value.slice(start, start + pageSize.value)
  })

  const prevPage = () => {
    if (currentPage.value > 1) currentPage.value--
  }

  const nextPage = () => {
    if (currentPage.value < totalPages.value) currentPage.value++
  }

  return {
    editRows,
    onCellInput,
    sortField,
    sortOrder,
    toggleSort,
    getSortIcon,
    sortedRows,
    currentPage,
    totalPages,
    pagedRows,
    prevPage,
    nextPage,
  }
}
