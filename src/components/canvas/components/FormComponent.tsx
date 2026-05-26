import { useMemo } from 'react'
import type { ComponentData } from '@/types'
import { useEditorStore } from '@/stores/editorStore'
import { useContainerDrop } from '@/hooks/useContainerDrop'
import ComponentRenderer from './ComponentRenderer'
import styles from './FormComponent.module.css'

export default function FormComponent({ component }: { component: ComponentData }) {
  const currentComponentId = useEditorStore((s) => s.currentComponent?.id)
  const columns = useMemo(() => {
    const configured = component.props.columns as string[] | undefined
    const keys = configured?.length ? configured : ['col1', 'col2']
    return keys.map((key, i) => ({ key, label: `\u5217 ${i + 1}` }))
  }, [component.props.columns])

  const { dragOverSlot, handleDragOver, handleDragLeave, handleDrop } = useContainerDrop(
    component.id,
    () => columns[0]?.key ?? 'col1',
  )

  const getSlotChildren = (slotKey: string) => component.slots?.[slotKey] ?? []

  return (
    <div className={styles.formComponent}>
      <div className={styles.formHeader}>{(component.props.title as string) ?? ''}</div>
      <div className={styles.formColumns}>
        {columns.map((col) => (
          <div key={col.key} className={styles.formColumn}>
            <div className={styles.columnTitle}>{col.label}</div>
            <div
              className={`${styles.columnBody} ${dragOverSlot === col.key ? styles.isDragOver : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                handleDragOver(col.key, e)
              }}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                e.stopPropagation()
                e.preventDefault()
                handleDrop(col.key, e)
              }}
            >
              {getSlotChildren(col.key).map((child) => (
                <div
                  key={child.id}
                  className={`${styles.childWrapper} ${currentComponentId === child.id ? styles.selected : ''}`}
                  style={{ width: `${child.style.width}px`, height: `${child.style.height}px` }}
                  onClick={(e) => {
                    e.stopPropagation()
                    useEditorStore.getState().selectComponent(child.id)
                  }}
                >
                  <ComponentRenderer component={child} />
                </div>
              ))}
              {dragOverSlot === col.key && (
                <div className={styles.dropTip}>{'\u653e\u5230\u8be5\u5217'}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
