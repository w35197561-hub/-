import { useMemo } from 'react'
import type { ComponentData } from '@/types'
import { useComponentStyle } from '@/hooks/useComponentStyle'

export default function TextComponent({ component }: { component: ComponentData }) {
  const baseStyle = useComponentStyle(component.style)
  const computedStyle = useMemo<React.CSSProperties>(
    () => ({
      ...baseStyle,
      color: component.style.color ?? '#333333',
      backgroundColor: component.style.backgroundColor ?? 'transparent',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      padding: '4px 8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      minHeight: '20px',
    }),
    [baseStyle, component.style.color, component.style.backgroundColor],
  )

  return <div style={computedStyle}>{(component.props.content as string) ?? ''}</div>
}
