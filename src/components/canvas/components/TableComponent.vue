<template>
  <div :style="containerStyle" class="table-wrapper">
    <!-- 设计态：静态展示，禁止交互 -->
    <template v-if="!isPreview">
      <table class="table" :class="{ 'table--stripe': stripe }">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.field"
              class="table-th"
              :style="col.width ? { width: `${col.width}px` } : {}"
            >
              <span>{{ col.label }}</span>
              <span v-if="col.sortable" class="sort-icon sort-icon--static">↕</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rIdx) in pagedRows" :key="rIdx">
            <td v-for="col in columns" :key="col.field" class="table-td">
              {{ row[col.field] ?? '' }}
            </td>
          </tr>
          <tr v-if="pagedRows.length === 0">
            <td :colspan="columns.length" class="table-empty">暂无数据</td>
          </tr>
        </tbody>
      </table>
      <div v-if="pageSizeVal > 0" class="pagination pagination--static">
        <button class="page-btn" disabled>上一页</button>
        <span class="page-info">第 1 / 共 {{ totalPages }} 页</span>
        <button class="page-btn" disabled>下一页</button>
      </div>
    </template>

    <!-- 运行态：完整交互 -->
    <template v-else>
      <table class="table" :class="{ 'table--stripe': stripe }">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.field"
              class="table-th"
              :style="col.width ? { width: `${col.width}px` } : {}"
              :class="{ 'table-th--sortable': col.sortable }"
              @click="col.sortable ? toggleSort(col.field) : undefined"
            >
              <span>{{ col.label }}</span>
              <span v-if="col.sortable" class="sort-icon">{{ getSortIcon(col.field) }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pagedRows" :key="editRows.indexOf(row)">
            <td
              v-for="col in columns"
              :key="col.field"
              class="table-td table-td--editable"
              @click="startEdit(row, col.field)"
            >
              <input
                v-if="editingCell?.rowRef === row && editingCell?.field === col.field"
                :ref="(el) => setInputRef(el as HTMLInputElement | null)"
                class="cell-input"
                :value="String(row[col.field] ?? '')"
                @input="(e) => onCellInput(editRows.indexOf(row), col.field, (e.target as HTMLInputElement).value)"
                @blur="stopEdit"
                @keydown.enter="stopEdit"
                @keydown.escape="stopEdit"
              />
              <span v-else>{{ row[col.field] ?? '' }}</span>
            </td>
          </tr>
          <tr v-if="pagedRows.length === 0">
            <td :colspan="columns.length" class="table-empty">暂无数据</td>
          </tr>
        </tbody>
      </table>
      <div v-if="pageSizeVal > 0" class="pagination">
        <button class="page-btn" :disabled="currentPage <= 1" @click="prevPage">上一页</button>
        <span class="page-info">第 {{ currentPage }} / 共 {{ totalPages }} 页</span>
        <button class="page-btn" :disabled="currentPage >= totalPages" @click="nextPage">
          下一页
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, ref } from 'vue'
import type { ComponentData } from '@/types'
import { useTableLogic } from './composables/useTableLogic'

interface TableColumn {
  field: string
  label: string
  width?: number
  sortable?: boolean
}

type RowData = Record<string, unknown>

const props = defineProps<{ component: ComponentData }>()

const isPreview = inject('isPreview', false)

// ---- Props 派生 ----
const columns = computed<TableColumn[]>(() => {
  const raw = props.component.props.columns
  return Array.isArray(raw) ? (raw as TableColumn[]) : []
})

const sourceData = computed<RowData[]>(() => {
  const raw = props.component.props.data
  return Array.isArray(raw) ? (raw as RowData[]) : []
})

const pageSizeVal = computed<number>(() => {
  const v = props.component.props.pageSize
  return typeof v === 'number' ? v : 5
})

const stripe = computed<boolean>(() => !!props.component.props.stripe)

// ---- 容器样式 ----
const containerStyle = computed(() => ({
  width: '100%',
  height: '100%',
  boxSizing: 'border-box' as const,
  overflow: 'auto',
  backgroundColor: props.component.style.backgroundColor ?? '#ffffff',
  display: 'flex',
  flexDirection: 'column' as const,
}))

// ---- 排序 + 分页核心逻辑（抽取自 composable，便于单测） ----
const {
  editRows,
  onCellInput,
  toggleSort,
  getSortIcon,
  sortedRows,
  currentPage,
  totalPages,
  prevPage,
  nextPage,
} = useTableLogic(
  () => sourceData.value,
  () => pageSizeVal.value,
)

// pagedRows：设计态取前 N 条，运行态由 composable 分页
const pagedRows = computed<RowData[]>(() => {
  if (isPreview) {
    // 运行态逻辑已在 composable 内处理，这里直接根据分页取
    if (pageSizeVal.value <= 0) return sortedRows.value
    const start = (currentPage.value - 1) * pageSizeVal.value
    return sortedRows.value.slice(start, start + pageSizeVal.value)
  }
  // 设计态：直接取前 pageSize 条（或全部）预览
  if (pageSizeVal.value <= 0) return sourceData.value
  return sourceData.value.slice(0, pageSizeVal.value)
})

// ---- 运行态：内联编辑 UI 状态 ----
const editingCell = ref<{ rowRef: Record<string, unknown>; field: string } | null>(null)
let pendingInputRef: HTMLInputElement | null = null

const setInputRef = (el: HTMLInputElement | null) => {
  pendingInputRef = el
  if (el) {
    nextTick(() => el.focus())
  }
}

const startEdit = (rowRef: Record<string, unknown>, field: string) => {
  editingCell.value = { rowRef, field }
}

const stopEdit = () => {
  editingCell.value = null
  pendingInputRef = null
}
</script>

<style scoped>
.table-wrapper {
  font-size: 13px;
  color: #333;
}

.table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.table-th {
  background: #f5f7fa;
  padding: 8px 10px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  color: #606266;
  border-bottom: 1px solid #e4e7ed;
  white-space: nowrap;
  user-select: none;
}

.table-th--sortable {
  cursor: pointer;
}

.table-th--sortable:hover {
  background: #eaecf0;
}

.sort-icon {
  margin-left: 4px;
  font-size: 11px;
  color: #909399;
}

.sort-icon--static {
  opacity: 0.4;
}

.table-td {
  padding: 7px 10px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  vertical-align: middle;
}

.table-td--editable {
  cursor: pointer;
  position: relative;
}

.table-td--editable:hover {
  background: #f5f8ff;
}

.table--stripe tbody tr:nth-child(even) {
  background: #fafafa;
}

.table-empty {
  text-align: center;
  padding: 24px 0;
  color: #c0c4cc;
  font-size: 13px;
}

.cell-input {
  width: 100%;
  border: 1px solid #409eff;
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  background: #fff;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-top: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.pagination--static {
  opacity: 0.6;
}

.page-btn {
  padding: 4px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  color: #606266;
}

.page-btn:hover:not(:disabled) {
  border-color: #409eff;
  color: #409eff;
}

.page-btn:disabled {
  cursor: not-allowed;
  color: #c0c4cc;
  border-color: #e4e7ed;
}

.page-info {
  font-size: 12px;
  color: #606266;
}
</style>
