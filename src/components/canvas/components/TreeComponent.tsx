import { useState, useMemo, useEffect, useCallback } from 'react'
import type { ComponentData } from '@/types'
import { useIsPreview } from '@/context/PreviewContext'

interface TreeNode {
  label: string
  value: string
  children?: TreeNode[]
}

export default function TreeComponent({ component }: { component: ComponentData }) {
  const isPreview = useIsPreview()
  const treeData = useMemo(() => (component.props.data as TreeNode[]) ?? [], [component.props.data])
  const defaultExpandAll = !!component.props.defaultExpandAll
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    setExpandedKeys(defaultExpandAll ? new Set(treeData.map((n) => n.value)) : new Set())
  }, [defaultExpandAll, treeData])

  const toggleNode = useCallback((value: string) => {
    setExpandedKeys((prev) => {
      const n = new Set(prev)
      if (n.has(value)) n.delete(value)
      else n.add(value)
      return n
    })
  }, [])

  const containerStyle = useMemo<React.CSSProperties>(
    () => ({
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      overflow: 'auto',
      fontSize: component.style.fontSize ? `${component.style.fontSize}px` : '14px',
      padding: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }),
    [component.style.fontSize],
  )

  return (
    <div style={containerStyle}>
      {treeData.map((node) => (
        <div key={node.value} style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 4px',
              borderRadius: 3,
              cursor: isPreview && node.children?.length ? 'pointer' : 'default',
              userSelect: 'none',
            }}
            onClick={() => isPreview && node.children?.length && toggleNode(node.value)}
          >
            <span
              style={{
                display: 'inline-block',
                width: 14,
                textAlign: 'center',
                fontSize: 10,
                color: '#909399',
                flexShrink: 0,
              }}
            >
              {node.children?.length
                ? isPreview
                  ? expandedKeys.has(node.value)
                    ? '\u25bc'
                    : '\u25b6'
                  : '\u25b6'
                : '\u00b7'}
            </span>
            <span>{node.label}</span>
          </div>
          {node.children?.length && (!isPreview || expandedKeys.has(node.value)) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {node.children.map((child) => (
                <div
                  key={child.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 4px',
                    userSelect: 'none',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      textAlign: 'center',
                      fontSize: 10,
                      color: '#909399',
                      marginLeft: 16,
                    }}
                  >
                    {'\u00b7'}
                  </span>
                  <span>{child.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
