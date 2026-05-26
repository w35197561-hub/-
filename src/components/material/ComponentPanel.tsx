import { useCallback } from 'react'
import { ComponentType } from '@/types'
import styles from './ComponentPanel.module.css'

const componentGroups = [
  {
    label: '\u57fa\u7840',
    items: [
      { type: ComponentType.TEXT, name: '\u6587\u672c', icon: 'T' },
      { type: ComponentType.TEXTAREA, name: '\u591a\u884c\u6587\u672c', icon: '\u2261' },
      { type: ComponentType.INPUT, name: '\u8f93\u5165\u6846', icon: '\u25ad' },
      { type: ComponentType.NUMBER_INPUT, name: '\u6570\u5b57\u8f93\u5165', icon: '#' },
      { type: ComponentType.BUTTON, name: '\u6309\u94ae', icon: '\u25a2' },
      { type: ComponentType.IMAGE, name: '\u56fe\u7247', icon: '\ud83d\uddbc' },
      { type: ComponentType.RADIO_GROUP, name: '\u5355\u9009\u6309\u94ae', icon: '\u25c9' },
      { type: ComponentType.SELECT, name: '\u4e0b\u62c9\u590d\u9009', icon: '\u25be' },
      {
        type: ComponentType.CHECKBOX_GROUP,
        name: '\u591a\u9009\u590d\u9009\u6846',
        icon: '\u2611',
      },
      { type: ComponentType.DIVIDER, name: '\u5206\u5272\u7ebf', icon: '\u2014' },
      { type: ComponentType.TIME_PICKER, name: '\u65f6\u95f4\u9009\u62e9', icon: '\u23f1' },
      { type: ComponentType.SWITCH, name: 'Switch \u5f00\u5173', icon: '\u21cc' },
      { type: ComponentType.CASCADER, name: '\u7ea7\u8054\u9009\u62e9', icon: '\u229e' },
      { type: ComponentType.LINK, name: 'Link \u94fe\u63a5', icon: '\ud83d\udd17' },
      { type: ComponentType.TREE, name: '\u6811\u5f62\u63a7\u4ef6', icon: '\u22b9' },
      { type: ComponentType.TABLE, name: '\u8868\u683c', icon: '\u229f' },
    ],
  },
  {
    label: '\u5bb9\u5668',
    items: [
      { type: ComponentType.FORM, name: '\u8868\u5355\u5bb9\u5668', icon: '\u229e' },
      { type: ComponentType.TABS, name: 'Tabs\u5bb9\u5668', icon: '\u29c9' },
      { type: ComponentType.CHART, name: '\u56fe\u8868', icon: '\ud83d\udcca' },
      { type: ComponentType.COLLAPSE, name: 'Collapse \u6298\u53e0', icon: '\u2750' },
    ],
  },
]

export default function ComponentPanel() {
  const handleDragStart = useCallback((componentType: ComponentType, event: React.DragEvent) => {
    if (event.dataTransfer) {
      event.dataTransfer.setData('componentType', componentType)
      event.dataTransfer.effectAllowed = 'copy'
    }
  }, [])

  return (
    <div className={styles.componentPanel}>
      <div className={styles.panelHeader}>
        <h3>组件库</h3>
      </div>
      <div className={styles.componentList}>
        {componentGroups.map((group) => (
          <div key={group.label} className={styles.componentGroup}>
            <div className={styles.groupLabel}>{group.label}</div>
            <div className={styles.componentGrid}>
              {group.items.map((component) => (
                <div
                  key={component.type}
                  className={styles.componentItem}
                  data-testid={`component-item-${component.type}`}
                  draggable
                  onDragStart={(e) => handleDragStart(component.type, e)}
                >
                  <span className={styles.componentIcon}>{component.icon}</span>
                  <span className={styles.componentName}>{component.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
