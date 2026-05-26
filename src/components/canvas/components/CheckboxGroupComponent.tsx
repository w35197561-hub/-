import { useState, useMemo, useCallback } from 'react'
import type { ComponentData } from '@/types'
import { useIsPreview } from '@/context/PreviewContext'

export default function CheckboxGroupComponent({ component }: { component: ComponentData }) {
  const isPreview = useIsPreview()
  const options = (component.props.options as string[]) ?? []
  const defaultValues = (component.props.defaultValues as string[]) ?? []
  const [localValues, setLocalValues] = useState<string[]>([...defaultValues])

  const toggleOption = useCallback((option: string) => {
    setLocalValues((prev) =>
      prev.includes(option) ? prev.filter((v) => v !== option) : [...prev, option],
    )
  }, [])

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
            type="checkbox"
            value={option}
            checked={isPreview ? localValues.includes(option) : defaultValues.includes(option)}
            disabled={!isPreview}
            onChange={() => toggleOption(option)}
          />
          <span style={labelStyle}>{option}</span>
        </label>
      ))}
    </div>
  )
}
