import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import type { ComponentData } from '@/types'
import { useIsPreview } from '@/context/PreviewContext'
import styles from './TimePickerComponent.module.css'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 21 }, (_, i) => String(currentYear - 10 + i))
const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const seconds = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

export default function TimePickerComponent({ component }: { component: ComponentData }) {
  const isPreview = useIsPreview()
  const [panelOpen, setPanelOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const [selectedYear, setSelectedYear] = useState(String(currentYear))
  const [selectedMonth, setSelectedMonth] = useState('01')
  const [selectedDay, setSelectedDay] = useState('01')
  const [selectedHour, setSelectedHour] = useState('00')
  const [selectedMinute, setSelectedMinute] = useState('00')
  const [selectedSecond, setSelectedSecond] = useState('00')
  const [displayValue, setDisplayValue] = useState((component.props.value as string) ?? '')

  const days = useMemo(() => {
    const d = new Date(Number(selectedYear), Number(selectedMonth), 0).getDate()
    return Array.from({ length: d }, (_, i) => String(i + 1).padStart(2, '0'))
  }, [selectedYear, selectedMonth])

  useEffect(() => {
    if (!days.includes(selectedDay)) setSelectedDay(days[days.length - 1]!)
  }, [days, selectedDay])

  useEffect(() => {
    if (!isPreview) return
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPanelOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [isPreview])

  const parseValue = useCallback((val: string) => {
    const dtMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})$/)
    if (dtMatch) {
      setSelectedYear(dtMatch[1]!)
      setSelectedMonth(dtMatch[2]!)
      setSelectedDay(dtMatch[3]!)
      setSelectedHour(dtMatch[4]!)
      setSelectedMinute(dtMatch[5]!)
      setSelectedSecond(dtMatch[6]!)
      return
    }
    const tMatch = val.match(/^(\d{2}):(\d{2}):(\d{2})$/)
    if (tMatch) {
      setSelectedHour(tMatch[1]!)
      setSelectedMinute(tMatch[2]!)
      setSelectedSecond(tMatch[3]!)
    }
  }, [])

  useEffect(() => {
    const v = component.props.value as string
    if (v) {
      setDisplayValue(v)
      parseValue(v)
    }
  }, [component.props.value, parseValue])

  const togglePanel = useCallback(() => {
    if (component.props.disabled) return
    setPanelOpen((prev) => {
      if (!prev && displayValue) parseValue(displayValue)
      return !prev
    })
  }, [component.props.disabled, displayValue, parseValue])

  const confirmPanel = useCallback(() => {
    setDisplayValue(
      `${selectedYear}-${selectedMonth}-${selectedDay} ${selectedHour}:${selectedMinute}:${selectedSecond}`,
    )
    setPanelOpen(false)
  }, [selectedYear, selectedMonth, selectedDay, selectedHour, selectedMinute, selectedSecond])

  const wrapperStyle = useMemo<React.CSSProperties>(
    () => ({
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '0 10px',
      backgroundColor: component.style.backgroundColor ?? '#fff',
      border: panelOpen ? '1px solid #409eff' : '1px solid #dcdfe6',
      borderRadius: component.style.borderRadius ? `${component.style.borderRadius}px` : '4px',
      cursor: isPreview ? (component.props.disabled ? 'not-allowed' : 'pointer') : 'default',
      position: 'relative',
      userSelect: 'none',
      opacity: component.props.disabled ? 0.5 : 1,
    }),
    [component.style, panelOpen, isPreview, component.props.disabled],
  )

  const calendarIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c0c4cc" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
  const placeholder =
    (component.props.placeholder as string) ?? '\u8bf7\u9009\u62e9\u65e5\u671f\u65f6\u95f4'

  const renderCol = (
    label: string,
    items: string[],
    selected: string,
    onSelect: (v: string) => void,
  ) => (
    <div className={styles.col}>
      <div className={styles.colHeader}>{label}</div>
      <ul className={styles.colList}>
        {items.map((item) => (
          <li
            key={item}
            className={`${styles.colItem} ${item === selected ? styles.colItemActive : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(item)
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )

  if (!isPreview) {
    return (
      <div style={wrapperStyle}>
        {calendarIcon}
        <span className={styles.placeholder}>{placeholder}</span>
      </div>
    )
  }

  return (
    <div ref={rootRef} style={wrapperStyle} onClick={togglePanel}>
      {calendarIcon}
      <span className={displayValue ? styles.displayValue : styles.placeholder}>
        {displayValue || placeholder}
      </span>
      {panelOpen && (
        <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
          <div className={styles.columns}>
            {renderCol('\u5e74', years, selectedYear, setSelectedYear)}
            {renderCol('\u6708', months, selectedMonth, setSelectedMonth)}
            {renderCol('\u65e5', days, selectedDay, setSelectedDay)}
            <div className={styles.colDivider} />
            {renderCol('\u65f6', hours, selectedHour, setSelectedHour)}
            {renderCol('\u5206', minutes, selectedMinute, setSelectedMinute)}
            {renderCol('\u79d2', seconds, selectedSecond, setSelectedSecond)}
          </div>
          <div className={styles.footer}>
            <button
              className={styles.btnCancel}
              onClick={(e) => {
                e.stopPropagation()
                setPanelOpen(false)
              }}
            >
              {'\u53d6\u6d88'}
            </button>
            <button
              className={styles.btnConfirm}
              onClick={(e) => {
                e.stopPropagation()
                confirmPanel()
              }}
            >
              {'\u786e\u5b9a'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
