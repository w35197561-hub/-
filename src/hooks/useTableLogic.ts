import { useState, useMemo, useEffect, useCallback } from 'react'

export type SortOrder = 'asc' | 'desc' | null
export type RowData = Record<string, unknown>

export function useTableLogic(sourceRows: RowData[], pageSize: number) {
  const [editRows, setEditRows] = useState<RowData[]>([])
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setEditRows(sourceRows.map((row) => ({ ...row })))
  }, [sourceRows])

  const onCellInput = useCallback((rowIdx: number, field: string, val: string) => {
    setEditRows((prev) => {
      const rows = [...prev]
      rows[rowIdx] = { ...rows[rowIdx]!, [field]: val }
      return rows
    })
  }, [])

  const toggleSort = useCallback((field: string) => {
    setSortField((prev) => {
      if (prev !== field) {
        setSortOrder('asc')
        return field
      }
      setSortOrder((prevOrder) => {
        if (prevOrder === 'asc') return 'desc'
        setSortField(null)
        return null
      })
      return prev
    })
    setCurrentPage(1)
  }, [])

  const getSortIcon = useCallback(
    (field: string): string => {
      if (sortField !== field) return '\u21D5'
      if (sortOrder === 'asc') return '\u2191'
      if (sortOrder === 'desc') return '\u2193'
      return '\u21D5'
    },
    [sortField, sortOrder],
  )

  const sortedRows = useMemo<RowData[]>(() => {
    const rows = [...editRows]
    if (!sortField || !sortOrder) return rows
    const f = sortField
    const o = sortOrder
    return rows.sort((a, b) => {
      const av = a[f]
      const bv = b[f]
      if (av === bv) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = av < bv ? -1 : 1
      return o === 'asc' ? cmp : -cmp
    })
  }, [editRows, sortField, sortOrder])

  const totalPages = useMemo(
    () => (pageSize <= 0 ? 1 : Math.max(1, Math.ceil(sortedRows.length / pageSize))),
    [sortedRows.length, pageSize],
  )

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [totalPages, currentPage])

  const pagedRows = useMemo<RowData[]>(() => {
    if (pageSize <= 0) return sortedRows
    const start = (currentPage - 1) * pageSize
    return sortedRows.slice(start, start + pageSize)
  }, [sortedRows, currentPage, pageSize])

  const prevPage = useCallback(() => {
    setCurrentPage((p) => (p > 1 ? p - 1 : p))
  }, [])

  const nextPage = useCallback(() => {
    setCurrentPage((p) => (p < totalPages ? p + 1 : p))
  }, [totalPages])

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
