<template>
  <!-- 设计态：静态占位，显示表头 + 示例行 -->
  <div v-if="!isPreview" :style="containerStyle" class="table-wrapper">
    <table :style="tableStyle" class="table-inner">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.dataIndex"
            :style="thStyle"
          >
            {{ col.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIdx) in dataSource" :key="rowIdx" :style="trStyle(rowIdx)">
          <td
            v-for="col in columns"
            :key="col.dataIndex"
            :style="tdStyle"
          >
            {{ row[col.dataIndex] ?? '' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 运行态：支持数据渲染 + 滚动 -->
  <div v-else :style="containerStyle" class="table-wrapper table-interactive">
    <table :style="tableStyle" class="table-inner">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.dataIndex"
            :style="thStyle"
          >
            {{ col.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIdx) in dataSource" :key="rowIdx" :style="trStyle(rowIdx)">
          <td
            v-for="col in columns"
            :key="col.dataIndex"
            :style="tdStyle"
          >
            {{ row[col.dataIndex] ?? '' }}
          </td>
        </tr>
        <tr v-if="dataSource.length === 0">
          <td :colspan="columns.length" :style="tdStyle" class="table-empty">
            暂无数据
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { ComponentData } from '@/types'

interface TableColumn {
  title: string
  dataIndex: string
}

type RowRecord = Record<string, unknown>

const props = defineProps<{ component: ComponentData }>()

const isPreview = inject('isPreview', false)

const columns = computed(
  () => (props.component.props.columns as TableColumn[] | undefined) ?? [],
)

const dataSource = computed(
  () => (props.component.props.dataSource as RowRecord[] | undefined) ?? [],
)

const bordered = computed(() => props.component.props.bordered !== false)

const striped = computed(() => props.component.props.striped === true)

const containerStyle = computed(() => ({
  width: '100%',
  height: '100%',
  boxSizing: 'border-box' as const,
  overflow: 'auto',
  backgroundColor: props.component.style.backgroundColor ?? 'transparent',
  fontSize: props.component.style.fontSize ? `${props.component.style.fontSize}px` : 'inherit',
}))

const tableStyle = computed(() => ({
  width: '100%',
  borderCollapse: bordered.value ? 'collapse' as const : 'separate' as const,
  borderSpacing: bordered.value ? '0' : '0 4px',
}))

const thStyle = computed(() => ({
  padding: '10px 12px',
  background: '#f5f7fa',
  fontWeight: '600',
  fontSize: 'inherit',
  textAlign: 'left' as const,
  whiteSpace: 'nowrap' as const,
  border: bordered.value ? '1px solid #ebeef5' : 'none',
  borderBottom: '1px solid #ebeef5',
}))

const tdStyle = computed(() => ({
  padding: '10px 12px',
  fontSize: 'inherit',
  border: bordered.value ? '1px solid #ebeef5' : 'none',
  borderBottom: '1px solid #f0f0f0',
}))

const trStyle = (rowIdx: number) => ({
  backgroundColor: striped.value && rowIdx % 2 === 0 ? '#fafafa' : 'transparent',
})
</script>

<style scoped>
.table-wrapper {
  user-select: none;
}

.table-interactive {
  user-select: text;
}

.table-inner {
  table-layout: auto;
}

.table-empty {
  text-align: center;
  color: #c0c4cc;
  padding: 20px 0;
}
</style>
