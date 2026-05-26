import { useState, useMemo, useEffect, useCallback } from 'react'
import type { ComponentData } from '@/types'
import { useIsPreview } from '@/context/PreviewContext'
import styles from './CollapseComponent.module.css'

interface CollapseItem {
  name: string
  title: string
  content: string
}

export default function CollapseComponent({ component }: { component: ComponentData }) {
  const isPreview = useIsPreview()
  const items = useMemo<CollapseItem[]>(
    () =>
      (component.props.items as CollapseItem[]) ?? [
        {
          name: 'panel1',
          title: '\u9762\u677f\u4e00',
          content: '\u9762\u677f\u4e00\u7684\u5185\u5bb9',
        },
      ],
    [component.props.items],
  )
  const accordion = component.props.accordion === true
  const [expandedNames, setExpandedNames] = useState<Set<string>>(
    () => new Set(items.map((i) => i.name)),
  )

  useEffect(() => {
    setExpandedNames((prev) => {
      const next = new Set(prev)
      items.forEach((i) => {
        if (!prev.has(i.name)) next.add(i.name)
      })
      return next
    })
  }, [items])

  const isExpanded = useCallback(
    (name: string) => !isPreview || expandedNames.has(name),
    [isPreview, expandedNames],
  )

  const togglePanel = useCallback(
    (name: string) => {
      setExpandedNames((prev) => {
        if (accordion) {
          return prev.has(name) ? new Set() : new Set([name])
        }
        const next = new Set(prev)
        if (next.has(name)) next.delete(name)
        else next.add(name)
        return next
      })
    },
    [accordion],
  )

  const containerStyle = useMemo<React.CSSProperties>(
    () => ({
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      backgroundColor: component.style.backgroundColor ?? '#fff',
      borderRadius: component.style.borderRadius ? `${component.style.borderRadius}px` : '4px',
      border: '1px solid #e4e7ed',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }),
    [component.style],
  )

  return (
    <div style={containerStyle}>
      {items.map((item) => (
        <div
          key={item.name}
          className={`${styles.item} ${isExpanded(item.name) ? styles.itemActive : ''}`}
        >
          <div
            className={styles.header}
            style={{ cursor: isPreview ? 'pointer' : 'default', userSelect: 'none' }}
            onClick={() => isPreview && togglePanel(item.name)}
          >
            <svg
              className={`${styles.arrow} ${isExpanded(item.name) ? styles.arrowOpen : ''}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 6 15 12 9 18" />
            </svg>
            <span className={styles.title}>{item.title}</span>
          </div>
          {isExpanded(item.name) && (
            <div className={styles.body}>
              <span className={styles.content}>{item.content}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
