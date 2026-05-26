import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { ComponentData } from '@/types'
import { useIsPreview } from '@/context/PreviewContext'
import styles from './CascaderComponent.module.css'

interface CascaderOption {
  label: string
  value: string
  children?: CascaderOption[]
}

export default function CascaderComponent({ component }: { component: ComponentData }) {
  const isPreview = useIsPreview()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPath, setSelectedPath] = useState<string[]>([])
  const [dropdownPos, setDropdownPos] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLDivElement>(null)
  const options = useMemo(
    () => (component.props.options as CascaderOption[]) ?? [],
    [component.props.options],
  )
  const clearable = component.props.clearable !== false
  const placeholder = (component.props.placeholder as string) ?? '\u8bf7\u9009\u62e9'

  const displayText = useMemo(() => {
    if (!selectedPath.length) return ''
    const labels: string[] = []
    let list = options
    for (const val of selectedPath) {
      const found = list.find((o) => o.value === val)
      if (!found) break
      labels.push(found.label)
      list = found.children ?? []
    }
    return labels.join(' / ')
  }, [selectedPath, options])

  const activeColumns = useMemo<CascaderOption[][]>(() => {
    const cols: CascaderOption[][] = [options]
    let list = options
    for (const val of selectedPath) {
      const found = list.find((o) => o.value === val)
      if (!found || !found.children?.length) break
      cols.push(found.children)
      list = found.children
    }
    return cols
  }, [selectedPath, options])

  useEffect(() => {
    if (!isPreview) return
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [isPreview])

  const toggleOpen = useCallback(() => {
    if (!isOpen) {
      setIsOpen(true)
      setTimeout(() => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect()
          setDropdownPos({
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            minWidth: rect.width,
            zIndex: 9999,
          })
        }
      }, 0)
    } else {
      setIsOpen(false)
    }
  }, [isOpen])

  const selectOption = useCallback(
    (colIdx: number, opt: CascaderOption) => {
      const newPath = selectedPath.slice(0, colIdx)
      newPath.push(opt.value)
      setSelectedPath(newPath)
      if (!opt.children?.length) setIsOpen(false)
    },
    [selectedPath],
  )

  const triggerStyle = useMemo<React.CSSProperties>(
    () => ({
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      padding: '0 10px',
      backgroundColor: '#fff',
      border: isOpen ? '1px solid #409eff' : '1px solid #dcdfe6',
      borderRadius: component.style.borderRadius ? `${component.style.borderRadius}px` : '4px',
      cursor: isPreview ? 'pointer' : 'default',
      userSelect: 'none',
      position: 'relative',
    }),
    [component.style, isOpen, isPreview],
  )

  const arrow = (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{
        color: '#c0c4cc',
        flexShrink: 0,
        marginLeft: 4,
        transition: 'transform 0.2s',
        transform: isOpen ? 'rotate(180deg)' : 'none',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )

  if (!isPreview) {
    return (
      <div style={{ ...triggerStyle, pointerEvents: 'none' }}>
        <span className={styles.placeholder}>{displayText || placeholder}</span>
        {arrow}
      </div>
    )
  }

  return (
    <div ref={triggerRef} style={triggerStyle} onClick={toggleOpen}>
      <span className={displayText ? styles.value : styles.placeholder}>
        {displayText || placeholder}
      </span>
      {clearable && displayText ? (
        <span
          className={styles.clear}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedPath([])
            setIsOpen(false)
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </span>
      ) : (
        arrow
      )}
      {isOpen &&
        createPortal(
          <div style={dropdownPos} className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
            {activeColumns.map((colOptions, colIdx) => (
              <div key={colIdx} className={styles.column}>
                {colOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={`${styles.option} ${selectedPath[colIdx] === opt.value ? styles.optionActive : ''}`}
                    onClick={() => selectOption(colIdx, opt)}
                  >
                    <span style={{ flex: 1 }}>{opt.label}</span>
                    {opt.children?.length ? (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="9 6 15 12 9 18" />
                      </svg>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
