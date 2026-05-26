import { useState, useMemo, useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { ComponentType } from '@/types'
import type { ComponentData } from '@/types'
import styles from './LayerPanel.module.css'

const typeNames: Record<ComponentType, string> = {
  [ComponentType.TEXT]: '\u6587\u672c',
  [ComponentType.IMAGE]: '\u56fe\u7247',
  [ComponentType.BUTTON]: '\u6309\u94ae',
  [ComponentType.INPUT]: '\u8f93\u5165\u6846',
  [ComponentType.FORM]: '\u8868\u5355\u5bb9\u5668',
  [ComponentType.CHART]: '\u56fe\u8868',
  [ComponentType.TABS]: '\u6807\u7b7e\u9875',
  [ComponentType.NUMBER_INPUT]: '\u6570\u5b57\u8f93\u5165',
  [ComponentType.SELECT]: '\u4e0b\u62c9\u590d\u9009',
  [ComponentType.TEXTAREA]: '\u591a\u884c\u6587\u672c',
  [ComponentType.RADIO_GROUP]: '\u5355\u9009\u6309\u94ae',
  [ComponentType.CHECKBOX_GROUP]: '\u591a\u9009\u590d\u9009\u6846',
  [ComponentType.DIVIDER]: '\u5206\u5272\u7ebf',
  [ComponentType.TIME_PICKER]: '\u65f6\u95f4\u9009\u62e9',
  [ComponentType.COLLAPSE]: '\u6298\u53e0\u9762\u677f',
  [ComponentType.SWITCH]: 'Switch',
  [ComponentType.CASCADER]: '\u7ea7\u8054\u9009\u62e9',
  [ComponentType.LINK]: 'Link',
  [ComponentType.TREE]: '\u6811\u5f62\u63a7\u4ef6',
  [ComponentType.TABLE]: '\u8868\u683c',
}

const typeIcons: Record<ComponentType, string> = {
  [ComponentType.TEXT]: 'T',
  [ComponentType.IMAGE]: '\ud83d\uddbc',
  [ComponentType.BUTTON]: '\u2b21',
  [ComponentType.INPUT]: '\u25ad',
  [ComponentType.FORM]: '\u229e',
  [ComponentType.CHART]: '\ud83d\udcca',
  [ComponentType.TABS]: '\u29c9',
  [ComponentType.NUMBER_INPUT]: '#',
  [ComponentType.SELECT]: '\u25be',
  [ComponentType.TEXTAREA]: '\u2261',
  [ComponentType.RADIO_GROUP]: '\u25c9',
  [ComponentType.CHECKBOX_GROUP]: '\u2611',
  [ComponentType.DIVIDER]: '\u2014',
  [ComponentType.TIME_PICKER]: '\u23f1',
  [ComponentType.COLLAPSE]: '\u2750',
  [ComponentType.SWITCH]: '\u21cc',
  [ComponentType.CASCADER]: '\u229e',
  [ComponentType.LINK]: '\ud83d\udd17',
  [ComponentType.TREE]: '\u22b9',
  [ComponentType.TABLE]: '\u229f',
}

function getComponentName(c: ComponentData, idx: number): string {
  const baseName = typeNames[c.type] || c.type
  const label = (c.props.content || c.props.title || c.props.placeholder) as string | undefined
  return label ? `${baseName}\u00b7${String(label).slice(0, 8)}` : `${baseName} ${idx + 1}`
}

export default function LayerPanel() {
  const currentPage = useEditorStore((s) => s.currentPage)
  const currentComponentId = useEditorStore((s) => s.currentComponent?.id)
  const selectComponent = useEditorStore((s) => s.selectComponent)
  const reorderComponent = useEditorStore((s) => s.reorderComponent)

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const layers = useMemo(() => {
    if (!currentPage) return []
    return currentPage.components.map((c, idx) => ({
      id: c.id,
      type: c.type,
      name: getComponentName(c, idx),
      index: idx,
    }))
  }, [currentPage])

  const handleDrop = useCallback(
    (targetIndex: number, event: React.DragEvent) => {
      event.preventDefault()
      const sourceId = event.dataTransfer?.getData('layerId') || draggingId
      if (!sourceId) {
        setDragOverId(null)
        return
      }
      reorderComponent(sourceId, targetIndex)
      setDragOverId(null)
      setDraggingId(null)
    },
    [draggingId, reorderComponent],
  )

  return (
    <div className={styles.layerPanel}>
      <div className={styles.header}>
        <span className={styles.title}>{'\u7ec4\u4ef6\u5217\u8868'}</span>
        <span className={styles.count}>
          {layers.length} {'\u4e2a\u7ec4\u4ef6'}
        </span>
      </div>
      {layers.length ? (
        <div className={styles.list}>
          {layers.map((layer) => (
            <div
              key={layer.id}
              className={`${styles.item} ${layer.id === currentComponentId ? styles.itemSelected : ''} ${dragOverId === layer.id ? styles.itemDragOver : ''}`}
              draggable
              onClick={() => selectComponent(layer.id)}
              onDragStart={(e) => {
                setDraggingId(layer.id)
                e.dataTransfer.setData('layerId', layer.id)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                e.preventDefault()
                if (layer.id !== draggingId) setDragOverId(layer.id)
              }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => handleDrop(layer.index, e)}
              onDragEnd={() => {
                setDraggingId(null)
                setDragOverId(null)
              }}
            >
              <span className={styles.dragHandle} title={'\u62d6\u62fd\u8c03\u6574\u987a\u5e8f'}>
                {'\u2630'}
              </span>
              <span className={styles.typeIcon}>{typeIcons[layer.type] || '\u25a1'}</span>
              <span className={styles.name} title={layer.name}>
                {layer.name}
              </span>
              <span className={`${styles.zindex} ${styles.zindexMid}`}>{layer.index + 1}</span>
              <div className={styles.actions}>
                <span
                  className={`${styles.actionBtn} ${layer.index === 0 ? styles.disabled : ''}`}
                  title={'\u4e0a\u79fb'}
                  onClick={(e) => {
                    e.stopPropagation()
                    reorderComponent(layer.id, layer.index - 1)
                  }}
                >
                  {'\u2191'}
                </span>
                <span
                  className={`${styles.actionBtn} ${layer.index === layers.length - 1 ? styles.disabled : ''}`}
                  title={'\u4e0b\u79fb'}
                  onClick={(e) => {
                    e.stopPropagation()
                    reorderComponent(layer.id, layer.index + 1)
                  }}
                >
                  {'\u2193'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <span style={{ fontSize: 28 }}>{'\ud83d\uddbc'}</span>
          <p>{'\u6682\u65e0\u7ec4\u4ef6'}</p>
        </div>
      )}
    </div>
  )
}
