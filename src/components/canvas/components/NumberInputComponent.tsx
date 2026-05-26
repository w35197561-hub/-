import { useState, useMemo, useEffect } from 'react'
import type { ComponentData } from '@/types'
import { useComponentStyle } from '@/hooks/useComponentStyle'
import { useIsPreview } from '@/context/PreviewContext'
import { useEditorStore } from '@/stores/editorStore'

export default function NumberInputComponent({ component }: { component: ComponentData }) {
  const baseStyle = useComponentStyle(component.style)
  const isPreview = useIsPreview()
  const validationErrors = useEditorStore((s) => s.validationErrors)
  const setPreviewValue = useEditorStore((s) => s.setPreviewValue)
  const [localValue, setLocalValue] = useState<number | ''>((component.props.value as number) ?? '')
  const errorMessage = validationErrors[component.id] ?? ''

  useEffect(() => {
    if (isPreview) setPreviewValue(component.id, localValue)
  }, [localValue])

  const style = useMemo<React.CSSProperties>(
    () => ({
      ...baseStyle,
      color: component.style.color ?? '#333',
      backgroundColor: component.style.backgroundColor ?? '#fff',
      border: component.style.borderWidth
        ? `${component.style.borderWidth}px solid ${component.style.borderColor ?? '#dcdfe6'}`
        : '1px solid #dcdfe6',
      borderRadius: component.style.borderRadius ? `${component.style.borderRadius}px` : '4px',
      padding: '8px 12px',
      outline: 'none',
      minHeight: 32,
    }),
    [baseStyle, component.style],
  )

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <input
        type="number"
        readOnly={!isPreview}
        min={component.props.min as number}
        max={component.props.max as number}
        step={component.props.step as number}
        value={isPreview ? localValue : (component.props.value as number)}
        placeholder={(component.props.placeholder as string) || ''}
        style={style}
        onChange={(e) => {
          if (isPreview) {
            const r = e.target.value
            setLocalValue(r === '' ? '' : Number(r))
          }
        }}
      />
      {errorMessage && (
        <span
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            fontSize: 11,
            color: '#f56c6c',
            marginTop: 2,
          }}
        >
          {errorMessage}
        </span>
      )}
    </div>
  )
}
