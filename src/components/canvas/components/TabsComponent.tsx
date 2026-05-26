import { useState, useMemo, useEffect, useCallback } from 'react'
import type { ComponentData } from '@/types'
import { useEditorStore } from '@/stores/editorStore'
import { useContainerDrop } from '@/hooks/useContainerDrop'
import ComponentRenderer from './ComponentRenderer'
import styles from './TabsComponent.module.css'

export default function TabsComponent({ component }: { component: ComponentData }) {
  const currentComponentId = useEditorStore((s) => s.currentComponent?.id)
  const updateComponentProps = useEditorStore((s) => s.updateComponentProps)

  const tabs = useMemo(() => {
    const configured = component.props.tabs as Array<{ key: string; label: string }> | undefined
    return configured?.length
      ? configured
      : [
          { key: 'tab1', label: 'Tab 1' },
          { key: 'tab2', label: 'Tab 2' },
        ]
  }, [component.props.tabs])

  const [localActiveTab, setLocalActiveTab] = useState(
    (component.props.activeTab as string) ?? tabs[0]?.key ?? 'tab1',
  )

  useEffect(() => {
    const val = component.props.activeTab as string | undefined
    if (val && val !== localActiveTab) setLocalActiveTab(val)
  }, [component.props.activeTab])

  const setActiveTab = useCallback(
    (key: string) => {
      setLocalActiveTab(key)
      updateComponentProps(component.id, { activeTab: key })
    },
    [component.id, updateComponentProps],
  )

  const activeChildren = useMemo(
    () => component.slots?.[localActiveTab] ?? [],
    [component.slots, localActiveTab],
  )

  const { dragOverSlot, handleDragLeave, handleSingleDragOver, handleSingleDrop } =
    useContainerDrop(component.id, () => localActiveTab)

  return (
    <div className={styles.tabsComponent}>
      <div className={styles.tabsHeader}>
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={`${styles.tabItem} ${localActiveTab === tab.key ? styles.active : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setActiveTab(tab.key)
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>
      <div
        className={`${styles.tabsBody} ${dragOverSlot === localActiveTab ? styles.isDragOver : ''}`}
        onDragOver={handleSingleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleSingleDrop}
      >
        {activeChildren.map((child) => (
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
        {dragOverSlot === localActiveTab && (
          <div className={styles.dropTip}>{'\u653e\u5230\u5f53\u524d Tab'}</div>
        )}
      </div>
    </div>
  )
}
