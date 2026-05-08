<template>
  <div class="table-component" :style="wrapperStyle">
    <div class="table-scroll">
      <table :class="tableClass">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.field" class="table-th">
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
            <td v-for="col in columns" :key="col.field" class="table-td">
              {{ row[col.field] ?? '' }}
            </td>
          </tr>
          <tr v-if="dataSource.length === 0">
            <td :colspan="columns.length" class="table-empty-cell">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentData } from '@/types'
import { useComponentStyle } from './composables/useComponentStyle'

const props = defineProps<{ component: ComponentData }>()

const { baseStyle } = useComponentStyle(props.component.style)

const wrapperStyle = computed(() => ({
  ...baseStyle.value,
  overflow: 'auto' as const,
}))

interface TableColumn {
  title: string
  field: string
}

const columns = computed<TableColumn[]>(() => {
  const raw = props.component.props.columns as TableColumn[]
  if (!Array.isArray(raw)) return []
  return raw
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
