import { useState, useMemo } from 'react'
import type { ComponentData } from '@/types'
import { useIsPreview } from '@/context/PreviewContext'

export default function RadioGroupComponent({ component }: { component: ComponentData }) {
  const isPreview = useIsPreview()
  const options = (component.props.options as string[]) ?? []
  const defaultValue = (component.props.defaultValue as string) ?? ''
  const [localValue, setLocalValue] = useState(defaultValue)

  const wrapperStyle = useMemo<React.CSSProperties>(
    () => ({
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 8,
      padding: '8px 12px',
      backgroundColor: component.style.backgroundColor ?? '',
    }),
    [component.style.backgroundColor],
  )

  const labelStyle = useMemo<React.CSSProperties>(
    () => ({
      fontSize: component.style.fontSize ? `${component.style.fontSize}px` : '14px',
      color: component.style.color ?? '#333',
    }),
    [component.style.fontSize, component.style.color],
  )

  return (
    <div style={wrapperStyle}>
      {options.map((option, idx) => (
        <label
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: isPreview ? 'pointer' : 'default',
            userSelect: 'none',
          }}
        >
          <input
            type="radio"
            name={`radio-${component.id}`}
            value={option}
            checked={option === (isPreview ? localValue : defaultValue)}
            disabled={!isPreview}
            onChange={() => setLocalValue(option)}
          />
          <span style={labelStyle}>{option}</span>
        </label>
      ))}
    </div>
  )
}
