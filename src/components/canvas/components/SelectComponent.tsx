import { useState, useMemo, useEffect, useRef } from 'react'
import type { ComponentData } from '@/types'
import { useIsPreview } from '@/context/PreviewContext'
import styles from './SelectComponent.module.css'

export default function SelectComponent({ component }: { component: ComponentData }) {
  const isPreview = useIsPreview()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const options = (component.props.options as string[]) ?? []
  const placeholder = (component.props.placeholder as string) ?? '\u8bf7\u9009\u62e9'

  useEffect(() => {
    if (!isPreview) return
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [isPreview])

  const wrapperStyle = useMemo<React.CSSProperties>(
    () => ({
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 10px',
      backgroundColor: component.style.backgroundColor ?? '#fff',
      border: open ? '1px solid #409eff' : '1px solid #dcdfe6',
      borderRadius: component.style.borderRadius ? `${component.style.borderRadius}px` : '4px',
      cursor: isPreview ? 'pointer' : 'default',
      position: 'relative',
      userSelect: 'none',
    }),
    [component.style, open, isPreview],
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
        transition: 'transform 0.2s',
        transform: open ? 'rotate(180deg)' : 'none',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )

  if (!isPreview) {
    return (
      <div style={wrapperStyle}>
        <span className={styles.placeholder}>{placeholder}</span>
        {arrow}
      </div>
    )
  }

  return (
    <div ref={rootRef} style={wrapperStyle} onClick={() => setOpen(!open)}>
      <span className={selected ? styles.value : styles.placeholder}>
        {selected || placeholder}
      </span>
      {arrow}
      {open && (
        <ul className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
          {options.map((opt) => (
            <li
              key={opt}
              className={`${styles.option} ${opt === selected ? styles.active : ''}`}
              onClick={() => {
                setSelected(opt)
                setOpen(false)
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
