import { useState, useMemo } from 'react'
import type { ComponentData } from '@/types'
import { useIsPreview } from '@/context/PreviewContext'
import { useTableLogic } from '@/hooks/useTableLogic'
import styles from './TableComponent.module.css'

interface TableColumn {
  field: string
  label: string
  width?: number
  sortable?: boolean
}

export default function TableComponent({ component }: { component: ComponentData }) {
  const isPreview = useIsPreview()
  const columns = useMemo<TableColumn[]>(
    () =>
      Array.isArray(component.props.columns) ? (component.props.columns as TableColumn[]) : [],
    [component.props.columns],
  )
  const sourceData = useMemo(
    () =>
      Array.isArray(component.props.data)
        ? (component.props.data as Record<string, unknown>[])
        : [],
    [component.props.data],
  )
  const pageSizeVal = typeof component.props.pageSize === 'number' ? component.props.pageSize : 5
  const stripe = !!component.props.stripe

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
  } = useTableLogic(sourceData, pageSizeVal)

  const pagedRows = useMemo(() => {
    if (isPreview) {
      if (pageSizeVal <= 0) return sortedRows
      const start = (currentPage - 1) * pageSizeVal
      return sortedRows.slice(start, start + pageSizeVal)
    }
    if (pageSizeVal <= 0) return sourceData
    return sourceData.slice(0, pageSizeVal)
  }, [isPreview, pageSizeVal, sortedRows, currentPage, sourceData])

  const [editingCell, setEditingCell] = useState<{ rowIdx: number; field: string } | null>(null)

  const containerStyle = useMemo<React.CSSProperties>(
    () => ({
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      overflow: 'auto',
      backgroundColor: component.style.backgroundColor ?? '#fff',
      display: 'flex',
      flexDirection: 'column',
      fontSize: 13,
      color: '#333',
    }),
    [component.style.backgroundColor],
  )

  return (
    <div style={containerStyle}>
      <table className={`${styles.table} ${stripe ? styles.stripe : ''}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.field}
                className={`${styles.th} ${isPreview && col.sortable ? styles.thSortable : ''}`}
                style={col.width ? { width: col.width } : {}}
                onClick={() => isPreview && col.sortable && toggleSort(col.field)}
              >
                <span>{col.label}</span>
                {col.sortable && (
                  <span className={styles.sortIcon} style={!isPreview ? { opacity: 0.4 } : {}}>
                    {isPreview ? getSortIcon(col.field) : '\u21d5'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((row, rIdx) => (
            <tr key={rIdx}>
              {columns.map((col) => (
                <td
                  key={col.field}
                  className={`${styles.td} ${isPreview ? styles.tdEditable : ''}`}
                  onClick={() =>
                    isPreview && setEditingCell({ rowIdx: editRows.indexOf(row), field: col.field })
                  }
                >
                  {isPreview &&
                  editingCell?.rowIdx === editRows.indexOf(row) &&
                  editingCell?.field === col.field ? (
                    <input
                      className={styles.cellInput}
                      autoFocus
                      defaultValue={String(row[col.field] ?? '')}
                      onChange={(e) =>
                        onCellInput(editRows.indexOf(row), col.field, e.target.value)
                      }
                      onBlur={() => setEditingCell(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') setEditingCell(null)
                      }}
                    />
                  ) : (
                    <span>{String(row[col.field] ?? '')}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
          {pagedRows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {'\u6682\u65e0\u6570\u636e'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {pageSizeVal > 0 && (
        <div className={`${styles.pagination} ${!isPreview ? styles.paginationStatic : ''}`}>
          <button
            className={styles.pageBtn}
            disabled={!isPreview || currentPage <= 1}
            onClick={prevPage}
          >
            {'\u4e0a\u4e00\u9875'}
          </button>
          <span className={styles.pageInfo}>
            {'\u7b2c'} {isPreview ? currentPage : 1} / {'\u5171'} {totalPages} {'\u9875'}
          </span>
          <button
            className={styles.pageBtn}
            disabled={!isPreview || currentPage >= totalPages}
            onClick={nextPage}
          >
            {'\u4e0b\u4e00\u9875'}
          </button>
        </div>
      )}
    </div>
  )
}
