<template>
  <div class="table-component" :style="wrapperStyle">
    <div class="table-scroll">
      <table :class="tableClass">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.dataIndex"
              class="table-th"
            >
              {{ col.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIndex) in dataSource"
            :key="rowIndex"
            :class="{ 'table-row-stripe': isStriped && rowIndex % 2 === 1 }"
          >
            <td
              v-for="col in columns"
              :key="col.dataIndex"
              class="table-td"
            >
              {{ row[col.dataIndex] ?? '' }}
            </td>
          </tr>
          <tr v-if="dataSource.length === 0 && isPreview">
            <td :colspan="columns.length" class="table-empty-cell">
              暂无数据
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { ComponentData } from '@/types'
import { useComponentStyle } from './composables/useComponentStyle'

const props = defineProps<{
  component: ComponentData
}>()

const isPreview = inject<boolean>('isPreview', false)

const { baseStyle } = useComponentStyle(props.component.style)

const wrapperStyle = computed(() => ({
  ...baseStyle,
  overflow: 'auto' as const,
  userSelect: (isPreview ? 'text' : 'none') as 'text' | 'none',
  fontSize: props.component.style.fontSize ? `${props.component.style.fontSize}px` : 'inherit',
}))

interface TableColumn {
  title: string
  dataIndex: string
}

const columns = computed<TableColumn[]>(() => {
  const rawColumns = props.component.props.columns as string[]
  if (!Array.isArray(rawColumns)) return []
  return rawColumns.map((col) => {
    const parts = col.split(':')
    const title = parts[0] ?? col
    const dataIndex = parts[1] ?? title
    return { title, dataIndex }
  })
})

const dataSource = computed<Record<string, unknown>[]>(() => {
  try {
    const parsed = JSON.parse(props.component.props.dataSource as string)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})

const isBordered = computed(() => props.component.props.bordered !== false)
const isStriped = computed(() => props.component.props.striped === true)

const tableClass = computed(() => ({
  'table-inner': true,
  'table-bordered': isBordered.value,
  'table-striped': isStriped.value,
}))
</script>

<style scoped>
.table-component {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.table-scroll {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.table-inner {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  font-size: inherit;
}

.table-th {
  background-color: #f5f7fa;
  font-weight: 600;
  color: #333;
  padding: 8px 12px;
  text-align: left;
  white-space: nowrap;
}

.table-td {
  padding: 8px 12px;
  color: #555;
}

.table-bordered .table-th,
.table-bordered .table-td {
  border: 1px solid #ebeef5;
}

.table-row-stripe {
  background-color: #fafafa;
}

.table-empty-cell {
  text-align: center;
  color: #999;
  padding: 16px;
  font-size: 13px;
}
</style>
