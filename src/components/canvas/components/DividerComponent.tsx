import { useMemo } from 'react'
import type { ComponentData } from '@/types'

export default function DividerComponent({ component }: { component: ComponentData }) {
  const text = (component.props.text as string) ?? ''
  const bs = (component.props.borderStyle as string) ?? 'solid'
  const bw = component.style.borderWidth ?? 1
  const bc = component.style.borderColor ?? '#dcdfe6'
  const lineStyle = useMemo<React.CSSProperties>(
    () => ({ flex: 1, borderTop: `${bw}px ${bs} ${bc}` }),
    [bw, bs, bc],
  )
  const textStyle = useMemo<React.CSSProperties>(
    () => ({ fontSize: 12, color: bc, whiteSpace: 'nowrap', flexShrink: 0 }),
    [bc],
  )

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div style={lineStyle} />
      {text && <span style={textStyle}>{text}</span>}
      {text && <div style={lineStyle} />}
    </div>
  )
}
